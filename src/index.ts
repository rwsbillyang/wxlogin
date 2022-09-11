import { beforeLeave } from "./beforeLeave"
import { NeedWxOauth } from "./checkAdmin"
import { WxLoginConfig } from "./Config"
import { AuthBean } from "./datatype/AuthBean"
import { CorpParams } from "./datatype/CorpParams"
import { GuestOAuthBean } from "./datatype/GuestOAuthBean"

import { LoginType } from "./datatype/LoginType"
import { NeedUserInfoType } from "./datatype/NeedUserInfoType"
import ErrorPage from "./ErrorPage"
import { randomAlphabet, randomAlphabetNumber, randomNumber } from "./random"
import { wxUserLoginRoutes } from "./routes"
import { securedRoute } from "./securedRoute"
import { WebAppHelper } from "./WebAppHelper"
import { isWeixinBrowser, isWeixinOrWxWorkBrowser, isWxWorkBrowser, useWxJsSdk, WxInitResult, WxJsStatus } from "./wxJsSdkHelper"
import { WxAuthHelper, WxGuestAuthHelper } from "./WxOauthHelper"
// import { LoginParam } from "./datatype/LoginParam"
// import { PathNeedRoles } from "./datatype/PathNeedRoles"
// import UserPwdLoginPage from "./UserPwdLoginPage"
// import { WxOauthLoginPageOA } from "./WxOauthLoginPageOA"
// import WxOauthLoginPageWork from "./WxOauthLoginPageWork"
// import WxOauthNotifyOA from "./WxOauthNotifyOA"
// import WxOauthNotifyWork from "./WxOauthNotifyWork"
// import { PcShowQrcodePage, WxScanQrcodeLoginConfirmPage, WxScanQrcodeLoginDonePage } from "./WxScanQrcodeLogin"


export type{
    GuestOAuthBean,  AuthBean, 
    //PathNeedRoles,LoginParam,  
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
    WxGuestAuthHelper, WxAuthHelper, WebAppHelper,
    isWeixinOrWxWorkBrowser,isWeixinBrowser,isWxWorkBrowser,
    WxJsStatus, useWxJsSdk,
    randomNumber,randomAlphabet,randomAlphabetNumber
}