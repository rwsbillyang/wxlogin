import React, { useEffect, useState } from 'react';

import { Block, Page } from 'framework7-react';

import { currentHost, StorageType } from "@rwsbillyang/usecache";

import { WxLoginConfig } from './Config';
import { LoginParam } from './datatype/LoginParam';
import { NeedUserInfoType } from './datatype/NeedUserInfoType';
import { SnsScope } from './datatype/SnsScope';
import { randomAlphabetNumber } from './random';
import { pageCenter } from './style';
import { saveValue } from './WxOauthHelper';




//ktorKit中默认值
const NotifyPath = {
    notify1: "/api/wx/oa/oauth/notify1",
    notify2: "/api/wx/oa/oauth/notify2"
}

/**
 * 
 * @param params LoginParam
 * @returns 腾讯授权链接url，将重定向到该url进入获取用户openId，或用户授权的腾讯页面
 */
export const authorizeUrl = (params: LoginParam) => {
    //只有强制获取时，则直接进入step2，否则交由后端继续判断
    const forceNeed = params.needUserInfo === NeedUserInfoType.ForceNeed
    const notifyPath = forceNeed ? NotifyPath.notify2 : NotifyPath.notify1
    const scope = forceNeed ? SnsScope.userInfo : SnsScope.base

    //构建callback notify的url,后端notify url如下：
    // $notifyPath1/{appId}/{needUserInfo}/{owner?}
    //"$notifyPath2/{appId}"
    let url = `${currentHost()}${notifyPath}/${params.appId}`
    if(!forceNeed){//notify1
        url += ("/" + params.needUserInfo)
        if (params.owner) url += ("/" + params.owner)
    }
    
    const redirectUri = encodeURI(url)
    console.log("redirectUri=" + url + ", after encodeURI=" + redirectUri)

    const state = randomAlphabetNumber(12)
    saveValue("state", state)
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${params.appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`
}


export const WxOauthLoginPageOA: React.FC<LoginParam> = (props: LoginParam) => {
    const [status, setStatus] = useState<string>("请稍候...")

    const { appId, from, authStorageType } = props


    //在RoutableTabs中，故onPageInit不被trigger，故使用useEffect
    useEffect(() => {
        if (!appId) {
            setStatus("no appId, please set appId in query parameters")
        } else {
            //const bean = WxAuthHelper.getAuthBean(true) || WxAuthHelper.getAuthBean(false) 
            //const user = (bean)? bean as WxOaAccountAuthBean : undefined
            //const openId = user?.guest?.openId || user?.guest?.openId

            if (from) saveValue("from", from)
            saveValue("authStorageType", authStorageType?.toString() || StorageType.BothStorage.toString())

            const url = authorizeUrl(props)
            if(WxLoginConfig.JumpToAuthrize)
                window.location.href = url
        }
    }, [])

    return (
        <Page name="oalogin" >
            <Block style={pageCenter}>{status}</Block>
        </Page>
    )
}
