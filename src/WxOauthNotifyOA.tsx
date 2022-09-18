import { Block, f7, Page } from 'framework7-react';
import React, { useState } from 'react';

import { DataBox, StorageType, CODE, getDataFromBox, UseCacheConfig } from "@rwsbillyang/usecache"


import { getValue, WxGuestAuthHelper } from './WxOauthHelper';
import { authorizeUrl } from './WxOauthLoginPageOA';


import { rolesNeededByPath } from './checkAdmin';
import { WxAuthHelper } from "./WxOauthHelper";
import { AuthBean } from './datatype/AuthBean';
import { LoginType } from './datatype/LoginType';
import { LoginParam } from './datatype/LoginParam';
import { NeedUserInfoType } from './datatype/NeedUserInfoType';
import { GuestOAuthBean } from './datatype/GuestOAuthBean';
import { pageCenter } from './style';
import { WxLoginConfig } from './Config';
import { scanQrcodeIdKey } from './WxScanQrcodeLogin';

/**
 * 适用于公众号登录
 * 各种需要登录的地方，需求可能有所区别，提取于此，都用到它
 * 本来不需要每次进入都登录，只不过收到奖励后需要更新，才每次都获取最新值，同时后端可对token进行检查
 */
export function login(openId: string,
    onOK: (authBean: AuthBean) => void,
    onNewUser: () => void,
    onFail: (msg: string) => void,
    authStorageType: number,
    unionId?: string,
    loginType: string = 'wechat'
) {
    f7.dialog.preloader('登录中...')
    const p = UseCacheConfig.request?.postWithoutAuth
    if (!p) {
        console.warn("WxOatuhNotifyOA: not config UseCacheConfig.request?.postWithouAuth?")
        return
    }
    p(`/api/wx/oa/account/login`, { name: openId, pwd: unionId, type: loginType })
        .then(function (res) {
            f7.dialog.close()
            const box: DataBox<AuthBean> = res.data
            if (box.code == CODE.OK) {
                const authBean = getDataFromBox(box)
                if (authBean) {
                    WxAuthHelper.onAuthenticated(authBean, authStorageType)
                    onOK(authBean)
                } else {
                    console.log(box.msg)
                    onFail("no data")
                }
            } else if (box.code == CODE.NewUser) {
                onNewUser()
            } else {
                console.log(box.msg)
                onFail(box.msg || "something wrong")
            }
        })
        .catch(function (err) {
            f7.dialog.close()
            const msg_ = err.status + ": " + err.message
            console.log(msg_)
            onFail(msg_)
        })
}


/**
 * 接到后端通知后，出错则显示错误信息；正确则进行登录(若需admin)获取jwtToken，最后进行跳转
 * 明确指定了是否获取用户信息，则只调用此页面一次；若未指定，即根据参数和owner判断，调用此页面有可能1次，也可能2次
 * 
 * /wxoa/authNotify?state=Qg5z68nYBTttG9a6&step=1&appId=wxe05e4b65760b950c&code=OK&openId=oV79guKWo0mvIUA2pZQE9CGqwLFE&needUserInfo=1
 */
export default (props: any) => {
    const [msg, setMsg] = useState<string>("请稍候...")

    const maybeLoginAndGoBack = (storageType: number, openId: string) => {
        const from = getValue("from")
        console.log("from=" + from)

        if (!from) {
            setMsg("登录成功，请关闭后重新打开")
            console.warn("no from")
            //f7.dialog.alert("登录成功，请关闭窗口重新打开")
            return false
        }

        if (!WxLoginConfig.backToFromAfterOAuth) {
            setMsg("登录成功，因配置不跳回from")
            console.log("WxLoginConfig.backToFromAfterOAuth=" + WxLoginConfig.backToFromAfterOAuth)
            return false
        }

        //微信登录后，无需再登录自己的系统，如普通的访客对newsDetail的访问
        //检查路径中是否包含需要登录的字符
        const roles = rolesNeededByPath(from)
        if (!roles) {
            console.log("navigate non-admin page: " + from)
            props.f7router.navigate(from)
            return false
        }

        //是否扫码登录，是的话传递给后台，单独处理 WxScanQrcodeLoginConfirmPage中设置scanQrcodeId
        const scanQrcodeId = getValue(scanQrcodeIdKey)
        const unionId = scanQrcodeId ? scanQrcodeId : undefined
        const type = scanQrcodeId ? LoginType.SCAN_QRCODE : LoginType.WECHAT

        //必须是系统注册用户
        login(openId,
            (authBean) => {
                if (WxAuthHelper.hasRoles(roles))
                    props.f7router.navigate(from)
                    //f7.views.main.router.navigate(from)  //window.location.href = from
                else {
                    if (WxLoginConfig.EnableLog) console.log("no permission: need " + roles, +", but " + JSON.stringify(authBean))
                    setMsg("没有权限，请联系管理员")
                }
            },
            //()=> f7.views.main.router.navigate("/u/register", { props: { from } }),
            () => { window.location.href = "/u/register?from=" + from }, //使用router.navigate容易导致有的手机中注册页面中checkbox和a标签无法点击,原因不明
            (msg) => setMsg("登录失败：" + msg), storageType, unionId, type
        )

        return false
    }


    const pageInit = () => {
        /*
        //后端跳转到前端的结果
        class OAuthNotifyResult(
            val step: Int,// 1 or 2
            var code: String,// OK or KO
            val appId: String? = null,
            val state: String? = null,//回传给前端用于校验
            var openId: String? = null,
            var msg: String? = null,
            var unionId: String? = null, //for step2
            var needEnterStep2: Int? = null // for step1: 1 enter step2, or else ends
            ) 
            */
        const { step, code, appId, state, openId, msg, unionId, needEnterStep2 } = props.f7route.query


        //默认使用BothStorage
        const authStorageType = +(getValue("authStorageType") || StorageType.BothStorage.toString())

        const stateInSession = getValue("state")
        if (state !== stateInSession) {
            setMsg("页面已过期")
            console.warn("state=" + state + ", stateInSession=" + stateInSession)
            return false
        }
        if (code !== 'OK') {
            setMsg(msg)
            console.warn(msg)
            return false
        }
        if (!openId) {
            setMsg("缺少参数：openId")
            console.warn("缺少参数：openId")
            return false
        }

        // console.log("WxOauthNotifyOA.pageInit: UseCacheConfig.EnableLog=" + UseCacheConfig.EnableLog)
        // console.log("WxOauthNotifyOA.pageInit: WxLoginConfig=" + JSON.stringify(WxLoginConfig))
        // console.log("WxOauthNotifyOA.pageInit: coprParams=" + JSON.stringify(WebAppHelper.getCorpParams()))

        if (step === '1') {
            //进行第二步认证：目的在于获取用户信息
            if (needEnterStep2 === '1') {
                //准备进入step2，表示获取用户信息
                const params: LoginParam = { appId, needUserInfo: NeedUserInfoType.ForceNeed }
                const url = authorizeUrl(params)
                if (WxLoginConfig.JumpToAuthrize)
                    window.location.href = url
            } else {
                const guestAuthBean: GuestOAuthBean = { appId, openId1: openId, unionId }

                WxGuestAuthHelper.onAuthenticated(guestAuthBean, authStorageType)

                maybeLoginAndGoBack(authStorageType, openId)
            }
        } else if (step === '2') {
            const guestAuthBean: GuestOAuthBean = { appId, openId1: openId, unionId, hasUserInfo: true }
            WxGuestAuthHelper.onAuthenticated(guestAuthBean, authStorageType)

            maybeLoginAndGoBack(authStorageType, openId)
        } else {
            setMsg("parameter error: step=" + step)
        }

        return false
    }

    return (
        <Page name="authNotify" onPageInit={pageInit}>
            {msg && <Block style={pageCenter}>{msg} <br />
            </Block>}
        </Page>
    )
}