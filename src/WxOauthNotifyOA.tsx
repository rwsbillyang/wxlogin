
import React, { useEffect, useState } from 'react';

import { cachedFetch, CODE, defaultFetchParams, FetchParams, StorageType } from "@rwsbillyang/usecache";

import { useRouter } from "react-router-manage";
import { getValue } from './WxOauthHelper';
import { authorizeUrl } from './WxOauthLoginPageOA';


import { WxLoginConfig } from './Config';
import { WxOaAccountAuthBean, WxOaGuest } from './datatype/AuthBean';
import { LoginParam } from './datatype/LoginParam';
import { NeedUserInfoType } from './datatype/NeedUserInfoType';
import { rolesNeededByPath } from './securedRoute';
import { WxAuthHelper } from "./WxOauthHelper";
import { scanQrcodeIdKey } from './WxScanQrcodeLogin';
import { parseUrlQuery } from './utils';
import { ErrMsg, LoadingToast, OkMsg, Page } from './WeUIComponents';

/**
 * 适用于公众号登录
 * 各种需要登录的地方，需求可能有所区别，提取于此，都用到它
 * 本来不需要每次进入都登录，只不过收到奖励后需要更新，才每次都获取最新值，同时后端可对token进行检查
 */
export function login(guest: WxOaGuest,
    onOK: (authBean: WxOaAccountAuthBean) => void,
    onNewUser: () => void,
    onFail: (msg: string) => void,
    authStorageType: number
) {

    //是否扫码登录，是的话传递给后台，单独处理 WxScanQrcodeLoginConfirmPage中设置scanQrcodeId
    const scanQrcodeId = getValue(scanQrcodeIdKey)
    //const loginType = scanQrcodeId ? LoginType.SCAN_QRCODE : LoginType.WECHAT
    //let query = `loginType=${loginType}`
    const query = (scanQrcodeId) ? ("?scanQrcodeId=" + scanQrcodeId) : ''

    const param: FetchParams<WxOaAccountAuthBean> = defaultFetchParams<WxOaAccountAuthBean>(
        `/api/wx/oa/account/login${query}`,
        (authBean) => {
            WxAuthHelper.saveAuthBean(false, authBean, authStorageType)
            onOK(authBean)
        }, guest)

    param.method = "POST"
    param.onKO = (code, msg) => {
        if (code == CODE.NewUser) {
            onNewUser()
        } else {
            onFail(msg || "something wrong")
        }
    }
    param.onErr = (errMsg) => {
        onFail(errMsg)
    }

    cachedFetch(param)
}




/**
 * 接到后端通知后，出错则显示错误信息；正确则进行登录(若需admin)获取jwtToken，最后进行跳转
 * 明确指定了是否获取用户信息，则只调用此页面一次；若未指定，即根据参数和owner判断，调用此页面有可能1次，也可能2次
 * 
 * /wxoa/authNotify?state=Qg5z68nYBTttG9a6&step=1&appId=wxe05e4b65760b950c&code=OK&openId=oV79guKWo0mvIUA2pZQE9CGqwLFE&needUserInfo=1
 */
export default (props: any) => {
    const [msg, setMsg] = useState<string | undefined>()
    const [err, setErr] = useState<string | undefined>()
    const { navigate } = useRouter()

    const maybeLoginAndGoBack = (storageType: number, guest: WxOaGuest) => {
        const from = getValue("from")
        if (WxLoginConfig.EnableLog) console.log("from=" + from)

        if (!from) {
            setMsg("请关闭后重新打开")
            console.warn("no from")
            //f7.dialog.alert("登录成功，请关闭窗口重新打开")
            return false
        }

        if (!WxLoginConfig.backToFromAfterOAuth) {
            setMsg("因配置不跳回from")
            console.log("WxLoginConfig.backToFromAfterOAuth=" + WxLoginConfig.backToFromAfterOAuth)
            return false
        }

        //微信登录后，无需再登录自己的系统，如普通的访客对newsDetail的访问
        //检查路径中是否包含需要登录的字符
        const roles = rolesNeededByPath(from)
        if (!roles) {
            console.log("navigate non-admin page: " + from)
            navigate(from)
            return false
        }


        //必须是系统注册用户
        login(guest,
            (authBean) => {
                if (WxAuthHelper.hasRoles(roles))
                navigate(from)
                else {
                    if (WxLoginConfig.EnableLog) console.log("no permission: need " + roles, +", but " + JSON.stringify(authBean))
                    setErr("没有权限，请联系管理员")
                }
            },
            () => { window.location.href = "/u/register?from=" + from }, //使用router.navigate容易导致有的手机中注册页面中checkbox和a标签无法点击,原因不明
            (msg) => setErr("登录失败：" + msg), storageType
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
        const query: any = parseUrlQuery() || {}
        const { step, code, appId, state, openId, msg, unionId, needEnterStep2 } = query


        //默认使用BothStorage
        const authStorageType = +(getValue("authStorageType") || StorageType.BothStorage.toString())


        if (code !== 'OK') {
            setErr(msg)
            console.warn(msg)
            return false
        }

        const stateInSession = getValue("state")
        if (state !== stateInSession) {
            setErr("页面已过期")
            console.warn("state=" + state + ", stateInSession=" + stateInSession)
            return false
        }

        if (!openId) {
            setErr("缺少参数：openId")
            console.warn("缺少参数：openId")
            return false
        }

        if (step === '1') {
            //进行第二步认证：目的在于获取用户信息
            if (needEnterStep2 === '1') {
                //准备进入step2，表示获取用户信息
                const params: LoginParam = { appId, needUserInfo: NeedUserInfoType.ForceNeed }
                const url = authorizeUrl(params)
                if (WxLoginConfig.JumpToAuthrize)
                    window.location.href = url
            } else {
                const guest: WxOaGuest = { appId, openId, unionId }

                WxAuthHelper.saveAuthBean(true, { guest }, authStorageType)

                maybeLoginAndGoBack(authStorageType, guest)
            }
        } else if (step === '2') {
            const guest: WxOaGuest = { appId, openId, unionId }
            WxAuthHelper.saveAuthBean(true, { guest }, authStorageType)

            maybeLoginAndGoBack(authStorageType, guest)
        } else {
            setErr("parameter error: step=" + step)
        }

        return false
    }

    useEffect(() => {
        pageInit() //对于RoutableTab，无pageInit等page事件
    }, [])

    return (
        <Page id="oaLoginNotify">
            {err ? <ErrMsg errMsg={err}/>:(msg ? <OkMsg title="登录成功" msg={msg}/>: <LoadingToast text="请稍候..." />)}
        </Page>
    )
}