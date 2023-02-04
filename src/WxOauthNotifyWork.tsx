
import { cachedFetch, CODE, FetchParams, StorageType, UseCacheConfig } from "@rwsbillyang/usecache";

import React, { useEffect, useState } from 'react';

import { useRouter } from "react-router-manage";

import { getValue, WxAuthHelper } from './WxOauthHelper';

import { WxLoginConfig } from "./Config";
import { WxWorkAccountAuthBean, WxWorkGuest } from "./datatype/AuthBean";
import { rolesNeededByPath } from "./securedRoute";
import { scanQrcodeIdKey } from "./WxScanQrcodeLogin";
import { parseUrlQuery } from "./utils";
import { ErrMsg, LoadingToast, OkMsg, Page } from "./WeUIComponents";




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
    const { navigate } = useRouter()
    const [msg, setMsg] = useState<string | undefined>()
    const [err, setErr] = useState<string | undefined>()
    const query: any = parseUrlQuery() || {}
    const { code, state, errMsg, deviceId, openId, userId, externalUserId, corpId, agentId, suiteId } = query

    if (WxLoginConfig.EnableLog) console.log("WxWorkOAuthNotify...")

    const pageInit = () => {
        if (WxLoginConfig.EnableLog) console.log("WxWorkOAuthNotify pageInit... url=" + window.location.href)
        //f7.dialog.preloader('登录中...')

        const stateInSession = getValue("state")

        if (code !== 'OK') {
            setErr(errMsg)
            console.warn(errMsg)
            return false
        }

        if (state !== stateInSession) {
            setErr("页面可能已过期，可直接关闭")
            console.warn("state=" + state + ", stateInSession=" + stateInSession)
            return false
        }

        if (!corpId && !suiteId) {
            setErr("缺少参数：corpId/suiteId")
            return false
        }

        //作为guest，此时已登录成功，此时的agentId可能为空
        const guest: WxWorkGuest = {
            corpId, agentId, suiteId, userId, externalId: externalUserId, openId, deviceId
        }

        //默认使用BothStorage
        const authStorageType = +(getValue("authStorageType") || StorageType.BothStorage.toString())
        WxAuthHelper.saveAuthBean(true, { guest }, authStorageType)

        const from = getValue("from")
        if (WxLoginConfig.EnableLog) console.log("from=" + from)

        if (!from) {
            setMsg("请关闭窗口重新打开")
            console.warn("no from")
            //f7.dialog.alert("登录成功，请关闭窗口重新打开")
            return false
        }
        if (!WxLoginConfig.backToFromAfterOAuth) {
            setMsg("因配置不跳回原页面")
            console.log("wxWork: WxLoginConfig.backToFromAfterOAuth=" + WxLoginConfig.backToFromAfterOAuth)
            return false
        }

        //登录后，无需再登录自己的系统，如普通的访客对newsDetail的访问
        //检查路径中是否包含需要登录的字符
        const roles = rolesNeededByPath(from)
        if (!roles) {
            if (WxLoginConfig.EnableLog) console.log("navigate non-admin page: " + from)
            navigate(from)

            return false
        }
        if (WxLoginConfig.EnableLog) console.log("WxWorkOAuthNotify： account login ...")

        let url = `/api/wx/work/account/login`
        //是否扫码登录，是的话传递给后台，单独处理 WxScanQrcodeLoginConfirmPage中设置scanQrcodeId
        const scanQrcodeId = getValue(scanQrcodeIdKey)
        if (scanQrcodeId) url = url + "?scanQrcodeId=" + scanQrcodeId


        const p: FetchParams<WxWorkAccountAuthBean> = {
            url, data: guest,
            method: "POST",
            attachAuthHeader: false, isShowLoading: true,
            storageType: UseCacheConfig.defaultStorageType,
            onOK: (authBean) => {
                WxAuthHelper.saveAuthBean(false, authBean, authStorageType)
                if (WxLoginConfig.EnableLog) console.log("successfully login, goto " + from)
                if (WxAuthHelper.hasRoles(roles)) {
                    navigate(from)
                } else {
                    if (WxLoginConfig.EnableLog) console.log("no permission: need " + roles, +", but " + JSON.stringify(authBean))
                    setErr("没有权限，请联系管理员")
                }
            },
            onNoData: () => {
                if (WxLoginConfig.EnableLog) console.log("defaultFetchParams: onNoData, no data from remote server")
                if (UseCacheConfig.showToast) UseCacheConfig.showToast("no data")
                setErr("异常：未获取到登录信息")
            },
            onKO: (code, msg) => {
                if (UseCacheConfig.EnableLog) console.log("defaultFetchParams: onKO from remote server: code=" + code + ", msg=" + msg)
                if (code == CODE.NewUser) {
                    //window.location.href = "/u/register?from=" + from
                    //使用router.navigate容易导致有的手机中注册页面中checkbox和a标签无法点击,原因不明
                    //f7.views.main.router.navigate("/u/register", { props: { from: from } })
                    navigate("/u/register?from=" + from)
                } else if (code === "SelfAuth") {
                    //成员自己授权使用，引导用户授权应用
                    setErr("请自行安装应用")
                    //window.location.href = from 
                }
                setErr("登录失败，请联系管理员：" + msg)
            },
            onErr: (errMsg) => {
                if (UseCacheConfig.EnableLog) console.log("defaultFetchParams: onErr from remote server: errMsg=" + errMsg)
                setErr(errMsg)
            }
        }

        cachedFetch(p)

        return false
    }

    useEffect(() => {
        pageInit() //对于RoutableTab，无pageInit等page事件
    }, [])

    return (
        <Page>
           {err ? <ErrMsg errMsg={err}/>:(msg ? <OkMsg title="登录成功" msg={msg}/>: <LoadingToast text="请稍候..." />)}
        </Page>
    )
}

export default WxOauthNotifyWork