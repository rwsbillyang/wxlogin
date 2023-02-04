
import { WxLoginConfig } from "./Config"
import { AuthBean, Profile,ExpireInfo,WxOaGuest,SysAccountAuthBean,WxOaAccountAuthBean,WxWorkGuest,WxWorkAccountAuthBean } from "./datatype/AuthBean"
import { LoginParam } from "./datatype/LoginParam"

import { LoginType } from "./datatype/LoginType"
import { NeedUserInfoType } from "./datatype/NeedUserInfoType"

import { enableVConsole, isVConsoleEnabled, loadJS, tryLoadWxJs } from "./loadjs"
import {  getQueryString, getQueryStringByRegx, parseUrlQuery, randomAlphabet, randomAlphabetNumber, randomNumber } from "./utils"
import { wxUserLoginRoutes } from "./routes"
import { beforeEnter, NeedWxOauth } from "./securedRoute"
import { WebAppLoginHelper } from "./WebAppLoginHelper"
import { isWeixinBrowser, isWeixinOrWxWorkBrowser, isWxWorkBrowser, useWxJsSdk, WxInitResult, WxJsStatus } from "./wxJsSdkHelper"
import { WxAuthHelper } from "./WxOauthHelper"
import { setRelayShareInfo, ShareInfo } from "./wxShareHelper"
import { ErrMsg, ErrorPage, Loading, LoadingToast, OkMsg, Page, WeButton } from "./WeUIComponents"
import { UserPwdLoginPage } from "./UserPwdLoginPage"
import { WxOauthLoginPageOA } from "./WxOauthLoginPageOA"
import WxOauthLoginPageWork from "./WxOauthLoginPageWork"
import WxOauthNotifyWork from "./WxOauthNotifyWork"
import WxOauthNotifyOA from "./WxOauthNotifyOA"
import { PcShowQrcodePage, WxScanQrcodeLoginConfirmPage, WxScanQrcodeLoginDonePage } from "./WxScanQrcodeLogin"
import { SnsScope } from "./datatype/SnsScope"


export type{
     AuthBean, Profile,ExpireInfo,WxOaGuest,SysAccountAuthBean,WxOaAccountAuthBean,WxWorkGuest,WxWorkAccountAuthBean,
     LoginParam, SnsScope,
    WxInitResult, ShareInfo
}

export {
    Page, ErrorPage, Loading, LoadingToast, OkMsg, ErrMsg, WeButton,
    UserPwdLoginPage, WxOauthLoginPageOA, WxOauthLoginPageWork,
    WxOauthNotifyWork, WxOauthNotifyOA,
    PcShowQrcodePage, WxScanQrcodeLoginConfirmPage,  WxScanQrcodeLoginDonePage,
    WxLoginConfig, 
    wxUserLoginRoutes,beforeEnter,
    LoginType, NeedUserInfoType, NeedWxOauth,   
    WxAuthHelper, WebAppLoginHelper,
    isWeixinOrWxWorkBrowser,isWeixinBrowser,isWxWorkBrowser,
    WxJsStatus, useWxJsSdk,setRelayShareInfo,
    randomNumber,randomAlphabet,randomAlphabetNumber,
    tryLoadWxJs, isVConsoleEnabled,enableVConsole,loadJS,
    getQueryString,getQueryStringByRegx,parseUrlQuery
}