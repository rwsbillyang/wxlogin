import { RouteTypeI } from 'react-router-manage';

import { beforeEnter, NeedWxOauth } from './securedRoute';
import {UserPwdLoginPage} from './UserPwdLoginPage';
import { ErrorPage } from './WeUIComponents';
import { WxOauthLoginPageOA } from './WxOauthLoginPageOA';
import WxOauthLoginPageWork from './WxOauthLoginPageWork';
import WxOauthNotifyOA from './WxOauthNotifyOA';
import WxOauthNotifyWork from './WxOauthNotifyWork';
import { WxScanQrcodeLoginDonePage, WxScanQrcodeLoginConfirmPage, PcShowQrcodePage } from './WxScanQrcodeLogin';

//https://github.com/NSFI/react-router-manage/blob/main/README.zh-CN.md
export const wxUserLoginRoutes: RouteTypeI[] = [
  {
    name: 'showQrcode',
    path: '/wx/scanLogin/show',
    component: PcShowQrcodePage
  },
  {
    name: 'confirmScanLogin',
    path: '/wx/scanLogin/confirm',
    component: WxScanQrcodeLoginConfirmPage
  },
  {
    name: 'scanQrcodeLoginDone', 
    path: '/wx/scanLogin/user/done', 
    component: WxScanQrcodeLoginDonePage,
    beforeEnter: beforeEnter,
    meta:{ "needWxOauth": NeedWxOauth.Yes }
  },
  
  {
    name: 'webAdminLogin',
    path: '/wx/webAdmin/login',
    component: UserPwdLoginPage,
  },
  {
    name: 'login',
    path: '/wx/login',
    component: WxOauthLoginPageWork,
  },
  {
    name: 'wxoaLogin',
    path: '/wxoa/login',
    component: WxOauthLoginPageOA,
  },
  {
    name: "wxworkAuthNotify",
    path: '/wxwork/authNotify', //前端若是SPA，通知路径可能需要添加browserHistorySeparator
    component: WxOauthNotifyWork,
  },
  {
    name: "wxoaAuthNotify",
    path: '/wxoa/authNotify', //前端若是SPA，通知路径可能需要添加browserHistorySeparator
    component: WxOauthNotifyOA,
  },
  {
    name: 'error',
    path: '/error',
    component: ErrorPage, //若引用了错误的component，将导致构建route失败，从而影响路由，从而打不开页面
  },
]
