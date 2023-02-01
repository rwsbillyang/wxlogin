
import {currentHref, StorageType} from "@rwsbillyang/usecache"

import React, { useEffect, useState } from 'react';

import { saveValue } from './WxOauthHelper';
import { LoginParam } from "./datatype/LoginParam";
import { NeedUserInfoType } from "./datatype/NeedUserInfoType";
import { SnsScope } from "./datatype/SnsScope";
import { randomAlphabetNumber } from "./utils";
import { pageCenter } from "./style";
import { WxLoginConfig } from "./Config";
import { Page } from "./PortLayer";
import { WebAppLoginHelper } from "./WebAppLoginHelper";




/**
 * 
 * @param params LoginParam
 * @returns 腾讯授权链接url，将重定向到该url进入获取用户openId，或用户授权的腾讯页面
 */
 export const authorizeUrlWork = (params: LoginParam) => {
    //构建callback notify的url
    const href = currentHref()
    let url = !params.suiteId ? `${href}/api/wx/work/oauth/notify/${params.corpId}/${params.agentId}`
    : `${href}/api/wx/work/isv/oauth/notify/${params.suiteId}`
    if(params.needUserInfo !== undefined) url += ("&needUserInfo="+params.needUserInfo)
    const redirectUri = encodeURI(url)
    console.log("wxwork: redirectUri="+url+", after encodeURI="+redirectUri)

    const scope = params.needUserInfo === NeedUserInfoType.ForceNeed ? SnsScope.base : SnsScope.userInfo

    const state = randomAlphabetNumber(12)
    saveValue("state", state)
    const appId = params.corpId || params.suiteId
    //refer to: https://developer.work.weixin.qq.com/document/path/91022
    //ISV: https://developer.work.weixin.qq.com/document/path/91120
    return params.agentId? `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&agentid=${params.agentId}#wechat_redirect` 
    :`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`
}

/**
 * 显示 登录中...
 * 获取OauthInfo 然后重定向到用户授权页面，后端接到授权通知后再通知到前端认证结果，
 * 前端再获取jwt token，再重定向到原请求页面 onPageInit={pageInit}
 * 
 * 下一步将执行到wxOAuthNotifyxx.tsx
 */
const WxOauthLoginPageWork: React.FC = (props) => {
    const [status, setStatus] = useState<string>("请稍候...")
    const loginParam = WebAppLoginHelper.getLoginParams()
    //const {corpId, suiteId, agentId, from, authStorageType} = loginParam

    //对于RoutableTab，无pageInit等page事件
    const pageInit = () => {
        if(!loginParam?.corpId && !loginParam?.suiteId){
            setStatus("no corpId/suiteId, please set them in query parameters")
        }else{
            if(loginParam?.corpId && !loginParam?.agentId){
                setStatus("no agentId, please set it in query parameters")
            }else{
                if(WxLoginConfig.EnableLog) console.log("wxWork oauth login from " + loginParam?.from)
                if (loginParam?.from) saveValue("from", loginParam?.from)
                saveValue("authStorageType", loginParam?.authStorageType?.toString() || StorageType.BothStorage.toString())
          
                //const corpsParam = WebAppHelper.getCorpParams()
                const url = authorizeUrlWork(loginParam)
                if(WxLoginConfig.JumpToAuthrize)
                    window.location.href = url
            }
            
        }
    
    }

    useEffect(() =>{ 
        pageInit() //对于RoutableTab，无pageInit等page事件
    }, [])

    return (
        <Page>
             <div style={pageCenter}>{status}</div>
        </Page>
    )
}

export default WxOauthLoginPageWork
