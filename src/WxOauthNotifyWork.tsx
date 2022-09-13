
import {DataBox, StorageType, CODE, getDataFromBox, UseCacheConfig} from "@rwsbillyang/usecache"


import { Block, f7, Page } from 'framework7-react';
import React, { useState } from 'react';

import { rolesNeededByPath } from './checkAdmin';
import { getValue, WxAuthHelper, WxGuestAuthHelper } from './WxOauthHelper';

import { GuestOAuthBean } from "./datatype/GuestOAuthBean";
import { AuthBean } from "./datatype/AuthBean";
import { WxLoginConfig } from "./Config";
import { pageCenter3 } from "./style";



/**
 * OAuthLogin成功后的通知
 * 
class OAuthResult(
    var code: String,// OK or KO
    val state: String?,//回传给前端用于校验
    var errMsg: String? = null,
    var unionId: String? = null, 
    var deviceId: String? = null,
    var openId: String? = null,
    var userId: String? = null,
    var externalUserId: String? = null,
    var corpId: String? = null,
    var agentId: String? = null, //内建应用才有值，ISV第三方应用则为空
    var suiteId: String? = null
)
 * 坑：若提示“页面可能已过期，state校验失败”，有可能是https和http不一致的问题，假如设置的访问首页是https，但通知时却是http，
 * 就会产生这个问题，因为保存的storage不在同一域名(包括scheme)下，通知此页的路径scheme又是根据指定给腾讯的通知回调url决定，
 * 尤其是部署在nginx后的upstream server得到的scheme，有可能是来自nginx的请求，也就是http，而实际主页地址却是https，就产生了不一致
 * 解决方式是确保指定给腾讯的回调url是https的
 */
const WxOauthNotifyWork: React.FC = (props: any) => {
    const [msg, setMsg] = useState<string>("请稍候...")
    const { code, state, errMsg, unionId, deviceId, openId, userId, externalUserId, corpId, agentId, suiteId } = props.f7route.query

    if (WxLoginConfig.EnableLog) console.log("WxWorkOAuthNotify...")

    const pageInit = () => {
        if (WxLoginConfig.EnableLog) console.log("WxWorkOAuthNotify pageInit... url=" + props.f7route.url)
        //f7.dialog.preloader('登录中...')

        const stateInSession = getValue("state")
        if (state !== stateInSession) {
            setMsg("页面可能已过期，可直接关闭")
            console.warn("state=" + state + ", stateInSession=" + stateInSession)
            return false
        }
        if (code !== 'OK') {
            setMsg(errMsg)
            console.warn(errMsg)
            return false
        }
        if (!corpId && !suiteId) {
            setMsg("缺少参数：corpId/suiteId")
            return false
        }

        //作为guest，此时已登录成功，此时的agentId可能为空
        const initialAuthBean: GuestOAuthBean = {
            corpId, agentId, suiteId, userId, externalUserId, openId2: openId, deviceId
        }

        //默认使用BothStorage
        const authStorageType = +(getValue("authStorageType") || StorageType.BothStorage.toString())
        WxGuestAuthHelper.onAuthenticated(initialAuthBean, authStorageType)

        const from = getValue("from")
        if (WxLoginConfig.EnableLog) console.log("from=" + from)

        if (!from) {
            setMsg("登录成功，请关闭窗口重新打开")
            console.warn("no from")
            //f7.dialog.alert("登录成功，请关闭窗口重新打开")
            return false
        }

        //登录后，无需再登录自己的系统，如普通的访客对newsDetail的访问
         //检查路径中是否包含需要登录的字符
        const roles = rolesNeededByPath(from)
        if(!roles){
            if (WxLoginConfig.EnableLog) console.log("navigate non-admin page: " + from)
            props.f7router.navigate(from)
            
            return false
        }
        console.log("WxWorkOAuthNotify： account login ...")

        let url = `/api/wx/work/account/login`
        //是否扫码登录，是的话传递给后台，单独处理 WxScanQrcodeLoginConfirmPage中设置scanQrcodeId
        const scanQrcodeId = getValue("scanQrcodeId")
        if (scanQrcodeId) url = url + "?scanQrcodeId=" + scanQrcodeId
    
        const p = UseCacheConfig.request?.postWithouAuth
        if (!p) {
            console.warn("useWxJsSdk: not config UseCacheConfig.request?.postWithouAuth?")
            return 
        }
        p(url, initialAuthBean)
            .then(function (res) {
                const box: DataBox<AuthBean> = res.data
                const authBean = getDataFromBox(box)
                if (box.code === CODE.OK) {
                    if (authBean) {
                        authBean.unionId = unionId
                        WxAuthHelper.onAuthenticated(authBean, authStorageType)
    
                        f7.views.main.router.navigate(from)  //window.location.href = from 
                    } else {
                        setMsg("异常：未获取到登录信息")
                    }
                } else if (box.code == CODE.NewUser) {
                    //window.location.href = "/u/register?from=" + from
                    //使用router.navigate容易导致有的手机中注册页面中checkbox和a标签无法点击,原因不明
                    f7.views.main.router.navigate("/u/register", { props: { from: from } })
                } else if (box.code === "SelfAuth") {
                    //成员自己授权使用，引导用户授权应用
                    setMsg("请自行安装应用")
                    //f7.views.main.router.navigate(from)
                    //props.f7router.navigate(from)  //window.location.href = from 
                } else {
                    setMsg("登录失败，请联系管理员：" + box.msg)
                }
            }).catch(function (err) {
                setMsg(err.status + ": " + err.message)
                console.log(err.status + ": " + err.message)
            })
        return false
    }
    return (
        <Page name="workAuthNotify" onPageAfterIn={pageInit}>
            <Block style={pageCenter3}>{msg}</Block>
        </Page>
    )
}

export default WxOauthNotifyWork