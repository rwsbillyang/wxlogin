
import { WxLoginConfig } from "./Config"
import { AuthBean, Profile,ExpireInfo,WxOaGuest,SysAccountAuthBean,WxOaAccountAuthBean,WxWorkGuest,WxWorkAccountAuthBean } from "./datatype/AuthBean"
import { LoginParam } from "./datatype/LoginParam"

import { LoginType } from "./datatype/LoginType"
import { NeedUserInfoType } from "./datatype/NeedUserInfoType"
import ErrorPage from "./ErrorPage"
import { enableVConsole, isVConsoleEnabled, loadJS, tryLoadWxJs } from "./loadjs"
import {  getQueryString, getQueryStringByRegx, parseUrlQuery, randomAlphabet, randomAlphabetNumber, randomNumber } from "./utils"
import { wxUserLoginRoutes } from "./routes"
import { beforeEnter, NeedWxOauth } from "./securedRoute"
import { WebAppLoginHelper } from "./WebAppLoginHelper"
import { isWeixinBrowser, isWeixinOrWxWorkBrowser, isWxWorkBrowser, useWxJsSdk, WxInitResult, WxJsStatus } from "./wxJsSdkHelper"
import { WxAuthHelper } from "./WxOauthHelper"
import { setRelayShareInfo, ShareInfo } from "./wxShareHelper"


export type{
     AuthBean, Profile,ExpireInfo,WxOaGuest,SysAccountAuthBean,WxOaAccountAuthBean,WxWorkGuest,WxWorkAccountAuthBean,
     LoginParam, 
    WxInitResult, ShareInfo
}

export {
    ErrorPage, 
    //UserPwdLoginPage, WxOauthLoginPageOA, WxOauthLoginPageWork,
    //WxOauthNotifyWork, WxOauthNotifyOA,
    //PcShowQrcodePage, WxScanQrcodeLoginConfirmPage,  WxScanQrcodeLoginDonePage,
    WxLoginConfig, 
    wxUserLoginRoutes,beforeEnter,
    LoginType, NeedUserInfoType, NeedWxOauth,
    //SnsScope,
    WxAuthHelper, WebAppLoginHelper,
    isWeixinOrWxWorkBrowser,isWeixinBrowser,isWxWorkBrowser,
    WxJsStatus, useWxJsSdk,setRelayShareInfo,
    randomNumber,randomAlphabet,randomAlphabetNumber,
    tryLoadWxJs, isVConsoleEnabled,enableVConsole,loadJS,
    getQueryString,getQueryStringByRegx,parseUrlQuery
}