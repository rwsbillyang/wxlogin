
import { Router } from 'framework7/types';
import ErrorPage from './ErrorPage';
import { securedRoute } from './securedRoute';
import UserPwdLoginPage from './UserPwdLoginPage';
import { WxOauthLoginPageOA } from './WxOauthLoginPageOA';
import WxOauthLoginPageWork from './WxOauthLoginPageWork';
import WxOauthNotifyOA from './WxOauthNotifyOA';
import WxOauthNotifyWork from './WxOauthNotifyWork';
import { WxScanQrcodeLoginDonePage, WxScanQrcodeLoginConfirmPage, PcShowQrcodePage } from './WxScanQrcodeLogin';


export const wxUserLoginRoutes: Router.RouteParameters[] = [
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
  securedRoute('scanQrcodeLoginDone', '/wx/scanLogin/user/done', WxScanQrcodeLoginDonePage),
  
  {
    name: 'webAdminLogin',
    path: '/wx/webAdmin/login',
    component: UserPwdLoginPage,
    options: {
      history: false,
      browserHistory: false,
      clearPreviousHistory: true
    }
  },
  {
    name: 'login',
    path: '/wx/login',
    component: WxOauthLoginPageWork,
    options: {
      history: false,
      browserHistory: false,
      clearPreviousHistory: true
    }
  },
  {
    name: 'wxoaLogin',
    path: '/wxoa/login',
    component: WxOauthLoginPageOA,
    options: {
      history: false,
      browserHistory: false,
      clearPreviousHistory: true
    }
  },
  {
    name: "wxworkAuthNotify",
    path: '/wxwork/authNotify', //前端若是SPA，通知路径可能需要添加browserHistorySeparator
    component: WxOauthNotifyWork,
    options: {
      history: false,
      browserHistory: false,
      clearPreviousHistory: true
    }
  },
  {
    name: "wxoaAuthNotify",
    path: '/wxoa/authNotify', //前端若是SPA，通知路径可能需要添加browserHistorySeparator
    component: WxOauthNotifyOA,
    options: {
      history: false,
      browserHistory: false,
      clearPreviousHistory: true
    }
  },
  {
    name: 'error',
    path: '/error',
    component: ErrorPage, //若引用了错误的component，将导致构建route失败，从而影响路由，从而打不开页面
  },
]

