
import { ComponentFunction } from "framework7/modules/component/component";
import { Router } from "framework7/types";
import { checkAdmin, NeedWxOauth } from "./checkAdmin";





export function securedRoute(
    name: string,
    path: string,
    component: ComponentFunction | Function | object,
    needWxOauth: NeedWxOauth = NeedWxOauth.Yes) {
    return {
      name, path, id: name, async(ctx: Router.RouteCallbackCtx) { checkAdmin(ctx, component, needWxOauth) }
    }
  }
  
  
  
  
  //https://forum.framework7.io/t/issue-with-f7-vue-routes-component-async-at-same-time-doesnt-works/4469/8
  // export function securedRoute2(name: string, path: string, component: ComponentFunction | Function | object) {
  //   return {
  //     name, path, id: name,
  //     async(ctx: Router.RouteCallbackCtx) {
  
  //       checkAndSetCorpParams(ctx, ctx.to.url)
  
  //       const isNeedAdmin = ctx.to.path.indexOf("/admin/") >= 0
  //       if (isNeedAdmin) {
  //         const isLogined = WxAuthHelper.isAuthenticated()
  //         if (isLogined) {
  //           //console.log("securedRoute: admin logined, jump to " + ctx.to.url)
  //           ctx.resolve({ "component": component })
  //         } else {
  //           //console.log("securedRoute: not logined, jump to WxOAuthLoginPage from " + ctx.to.url)
  //           ctx.resolve({
  //             "component": WxOauthLoginPageWork
  //           }, {
  //             "props": { from: ctx.to.url }
  //           })
  //         }
  //       } else {
  //         if (WxGuestAuthHelper.isAuthenticated()) {
  //           //console.log("securedRoute: guest logined, jump to " + ctx.to.url)
  //           ctx.resolve({ "component": component })
  //         } else {
  //           //console.log("securedRoute: guest not login, from " + ctx.to.url)
  //           ctx.resolve({ "component": WxOauthLoginPageWork }, { "props": { from: ctx.to.url } })
  //         }
  //       }
  //     }
  //   }
  // }
  
  
  
  //deprecated
  // export function needAdmin(ctx: Router.RouteCallbackCtx) {
  //   if (DEBUG) console.log("beforeEnter needAdmin")
  
  //   checkAndSetCorpParams(ctx, ["/wx/admin/"])
  
  //   if (ctx.to.path.indexOf("/wx/admin/") >= 0) { //wx管理后台单独处理
  //     const bean = WxAuthHelper.getAuthBean()
  //     if (bean?.uId && bean.token && (WxAuthHelper.hasRoles(bean, "admin") || WxAuthHelper.hasRoles(bean, "root")))
  //       ctx.resolve()
  //     else {
  //       ctx.reject()
  //         //admin情况下，没有指定owner，也没指定openId，WxOauthLoginPageOA直接跳转到获取用户信息的授权认证
  //         ctx.router.navigate({ name:  'webAdminLogin'  }, { props: { from: ctx.to.url } });
  //     }
  //   } else {
  //     //若还没有CorpParams，则解析url参数，设置它；若已存在则忽略
  
  //     const isWxWorkApp = WebAppHelper.isWxWorkApp()
  //     const isNeedAdmin = ctx.to.path.indexOf("/admin/") >= 0
  //     if (isNeedAdmin) {
  //       const isAuthenticated = WxAuthHelper.isAuthenticated()
  //       if (isAuthenticated) {
  //         ctx.resolve()
  //       } else {
  //         ctx.reject()
  //         //admin情况下，没有指定owner，也没指定openId，WxOauthLoginPageOA直接跳转到获取用户信息的授权认证
  //         ctx.router.navigate({ name: isWxWorkApp ? 'login' : 'login2' }, { props: { from: ctx.to.url } });
  //       }
  //     } else {
  //       if (WxGuestAuthHelper.isAuthenticated() || WxAuthHelper.isAuthenticated()) {
  //         ctx.resolve()
  //       } else {
  //         if (DEBUG) console.log("beforeEnter needAdmin: not login, jump to=" + ctx.to.url)
  //         let owner = ctx.to.params["uId"]//用于查询后端文章属主需不需要获取用户信息
  
  //         ctx.reject()
  //         //非admin页面：只有newsDetail待定（传递了ownerOpenId和未定的needUserInfo，WxOauthLoginPageOA将请求后端根据用户配置确定），其它都不需要获取用户信息（关注时自动获取，其它情况不必要）
  //         ctx.router.navigate({ name: isWxWorkApp ? 'login' : 'wxoaLogin' }, { props: { from: ctx.to.url, needUserInfo: ctx.to.name.indexOf("newsDetail") >= 0 ? undefined : false, owner: owner } });
  //       }
  //     }
  //   }
  // }