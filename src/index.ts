import { beforeLeave } from "./beforeLeave"

import { WxLoginConfig } from "./Config"
import { AuthBean, Profile,ExpireInfo,WxOaGuest,SysAccountAuthBean,WxOaAccountAuthBean,WxWorkGuest,WxWorkAccountAuthBean } from "./datatype/AuthBean"
import { CorpParams } from "./datatype/CorpParams"

import { LoginType } from "./datatype/LoginType"
import { NeedUserInfoType } from "./datatype/NeedUserInfoType"
import ErrorPage from "./ErrorPage"
import { randomAlphabet, randomAlphabetNumber, randomNumber } from "./random"
import { wxUserLoginRoutes } from "./routes"
import { NeedWxOauth, securedRoute } from "./securedRoute"
import { WebAppHelper } from "./WebAppHelper"
import { isWeixinBrowser, isWeixinOrWxWorkBrowser, isWxWorkBrowser, useWxJsSdk, WxInitResult, WxJsStatus } from "./wxJsSdkHelper"
import { WxAuthHelper } from "./WxOauthHelper"
import { setRelayShareInfo } from "./wxShareHelper"


export type{
     AuthBean, Profile,ExpireInfo,WxOaGuest,SysAccountAuthBean,WxOaAccountAuthBean,WxWorkGuest,WxWorkAccountAuthBean,
    CorpParams, 
    WxInitResult, 
}

export {
    ErrorPage, 
    //UserPwdLoginPage, WxOauthLoginPageOA, WxOauthLoginPageWork,
    //WxOauthNotifyWork, WxOauthNotifyOA,
    //PcShowQrcodePage, WxScanQrcodeLoginConfirmPage,  WxScanQrcodeLoginDonePage,
    WxLoginConfig, 
    wxUserLoginRoutes, securedRoute, beforeLeave,
    LoginType, NeedUserInfoType, NeedWxOauth,
    //SnsScope,
    WxAuthHelper, WebAppHelper,
    isWeixinOrWxWorkBrowser,isWeixinBrowser,isWxWorkBrowser,
    WxJsStatus, useWxJsSdk,setRelayShareInfo,
    randomNumber,randomAlphabet,randomAlphabetNumber
}