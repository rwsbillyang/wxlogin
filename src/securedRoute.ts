
import { StorageType } from "@rwsbillyang/usecache";

import { WxOauthLoginPageOA } from "./WxOauthLoginPageOA";
import { LoginParam } from "./datatype/LoginParam";
import { NeedUserInfoType } from "./datatype/NeedUserInfoType";
import WxOauthLoginPageWork from "./WxOauthLoginPageWork";
import {UserPwdLoginPage} from "./UserPwdLoginPage";
import { LoginType } from "./datatype/LoginType";
import { PcShowQrcodePage } from "./WxScanQrcodeLogin";

import { isWeixinBrowser, isWxWorkBrowser,isWeixinOrWxWorkBrowser } from "./wxJsSdkHelper";

import { WxAuthHelper } from "./WxOauthHelper";
import { WxLoginConfig } from "./Config";
import { RouteTypeI } from "react-router-manage";
import { WebAppLoginHelper } from "./WebAppLoginHelper";
import { parseUrlQuery } from "./utils";


/**
 * 仅适用于无需roles特权时的普通路径，是否需微信登录
 */
 export const NeedWxOauth = {
  Yes: 2, //是
  OnlyWxEnv: 1, //仅仅微信环境下 
  No: 0 //直接跳走，无需微信登录
}



  //copy from lib
type NextOptionsType = { name?: string; path?: string;} | React.ComponentType<any>;

/**
 * 用于全局路由配置
 * 
 * 参考类型RouteTypeI：https://github.com/NSFI/react-router-manage/blob/main/README.zh-CN.md
 * 
 * 其中code：表示每个路由需要的权限，若无配置，将使用WxLoginConfig.customAdminPathRoles、WxLoginConfig.adminPathRoles中配置的权限
 * 可以忽略code属性，定义全局的WxLoginConfig.customAdminPathRoles、WxLoginConfig.adminPathRoles
 * 
 * meta属性：如在route中添加meta字段： meta: { needWxOauth: NeedWxOauth.OnlyWxEnv},
 */
export const beforeEnter = (to: RouteTypeI | undefined, next: (nextOptionsType?: NextOptionsType) => void) => {
    let hasAuth = false
    let rolesNeeded: string[] | undefined
    if(to?.code){//检查是否需要权限，优先使用code配置
        const t = typeof to.code
        if(t === "function"){
            const f = to.code as (route: RouteTypeI) => boolean;
            if(WxLoginConfig.EnableLog) console.log("code is function, and return true")
            hasAuth = f(to) //如果路由配置code为函数，且执行结果为true，则有权限
        }else if (t === "object"){ //array
            rolesNeeded = to.code as string[]
        }else if( t === "string"){
            rolesNeeded = [to.code as string]
        }
    }else{//没有配置code，使用WxLoginConfig的配置，即path中是否有admin等字符
        if(WxLoginConfig.EnableLog) console.log("no code, check path special characters")
        rolesNeeded = rolesNeededByPath(to?.path  || window.location.href)
    }

    if(hasAuth){//code为函数，返回结果为true表示有权限
        next()
    }else{
        const  {loginComponent, loginParam} = getLoginComponent()
        checkAndSetLoginParams(loginParam, to?.path || window.location.href, ["/super/", "/wx/admin/"])

        if(rolesNeeded && rolesNeeded.length > 0){//需要的权限
            if (WxAuthHelper.hasRoles(rolesNeeded)) //已登录
            {
                if(WxLoginConfig.EnableLog) console.log("already login, go directly")
                next()
            }else{
                if(WxLoginConfig.EnableLog) console.log("need: " + JSON.stringify(rolesNeeded) + ", to login...")
                next(loginComponent)
            }
        }else{//无需权限，即无code配置，path也无admin字符，但配置了拦截（全局或局部），则检查meta.needWxOauth
            if(WxLoginConfig.EnableLog) console.log("not need auth, to check to?.meta?.needWxOauth...")
            switch (to?.meta?.needWxOauth) {
                case NeedWxOauth.Yes: {
                    tryLogin(next,  loginComponent)
                    break
                }
                case NeedWxOauth.OnlyWxEnv: {
                    if (isWeixinOrWxWorkBrowser()) {
                        tryLogin(next, loginComponent)
                    } else {
                        if (WxLoginConfig.EnableLog) console.log("securedRoute: not wx env, jump directly")
                        next()
                    }

                    break
                }
                //不需要admin，直接跳走，无需微信登录
                case NeedWxOauth.No: {
                    next()
                    break
                }
                default://若配置为全局拦截，则进入此处；若配置为局部，则不拦截；
                {
                    next()
                    break
                }
            }
        }
    }
  }

  function getLoginComponent(){
    const query = parseUrlQuery()
   
    const loginParam: LoginParam = {
        appId: query["appId"],
        corpId: query["corpId"],
        suiteId: query["suiteId"],
        agentId: query["agentId"],
        from: window.location.href,
        owner: query["owner"],//用于查询后端文章属主需不需要获取用户信息 //只有newsDetail待定（根据用户配置确定），其它都不需要获取用户信息（关注时自动获取，其它情况不必要）
        needUserInfo: +(query["needUseInfo"] || NeedUserInfoType.Force_Not_Need), //从拦截的链接中获取 从url中提取参数needUserInfo
        authStorageType: +(query["authStorageType"] || StorageType.BothStorage)
    }

    //从拦截的链接中获取 从url中提取参数loginType,
    //没有的话，则根据是否在微信环境，指定默认类型，不再是默认都为微信公众号类型
    let loginType = query["loginType"]
    if(!loginType){
        if(isWeixinBrowser()) loginType = LoginType.WECHAT
        else if(isWxWorkBrowser()) loginType = LoginType.WXWORK
        else loginType = LoginType.ACCOUNT
    }


    let loginComponent: ((props: any) => JSX.Element) | React.FC<LoginParam>
    switch(loginType){
        case LoginType.ACCOUNT:
        case LoginType.MOBILE:    //暂时也使用账户密码登录
        {
            loginComponent = UserPwdLoginPage
            break
        } 
        case LoginType.SCAN_QRCODE:
        {
            loginComponent = PcShowQrcodePage
            break
        }
        case LoginType.WECHAT:
        {
            if(!loginParam.appId){
                console.warn("LoginType.WECHAT, but no appId? loginParams="+JSON.stringify(loginParam))
            }
            loginComponent = WxOauthLoginPageOA
            break
        }
        case LoginType.WXWORK:
        {
            if(!WebAppLoginHelper.isWxWorkApp(loginParam)){
                console.warn("LoginType.WXWORK, but no corpId/agentId? loginParams="+JSON.stringify(loginParam))
            }
            loginComponent = WxOauthLoginPageWork
            break
        }
        default:
        {
            loginComponent = UserPwdLoginPage
            break
        }
    }
    

    return {loginComponent, loginParam}
  }

/**
* 循环遍历adminPathConfigs配置数组，path匹配则返回需要的roles
* @param toPath 访问路径
* @returns 返回访问该路径需要的roles数组，用户如若具备roles中任何一个即可访问，无需roles，返回undefined
*/
export function rolesNeededByPath(toPath: string) {
  const customAdminPathRoles = WxLoginConfig.customAdminPathRoles
  if (customAdminPathRoles && customAdminPathRoles.length > 0) {
      for (let i = 0; i < customAdminPathRoles.length; i++) {
          const e = customAdminPathRoles[i]
          if (toPath.indexOf(e.characters) >= 0)
              return e.roles
      }
  }

  const adminPathConfigs = WxLoginConfig.adminPathRoles
  for (let i = 0; i < adminPathConfigs.length; i++) {
      const e = adminPathConfigs[i]
      if (toPath.indexOf(e.characters) >= 0)
          return e.roles
  }
  return undefined
}


function tryLogin(next: (nextOptionsType?: NextOptionsType) => void,
  loginComponent: React.LazyExoticComponent<any> | React.FC<any>) {

  if (WxAuthHelper.isAuthenticated(true) || WxAuthHelper.isAuthenticated(false)) {
    next() 
  } else {
      if (WxLoginConfig.EnableLog) console.log("securedRoute: no wxOauth info, to wxAuth...")
      next(loginComponent) 
  }
}


/**
* 检查提取路径中的corpId，agentId等信息，用于构建cache key的前缀(space)，避免数据窜乱
* 可以通过exceptions设置例外不检查的路径，如“/wx/admin”，此时将这只一个默认的参数
* 若未设置，将提示出错
*/
function checkAndSetLoginParams(loginParam: LoginParam, path: string, exceptions?: string[]) {
  if (WxLoginConfig.EnableLog) console.log("checkAndSetLoginParams " )

  const p = WebAppLoginHelper.getLoginParams()
  if (!p) {
      console.log("no loginParam, check url query params, and try set it")
      if ((!loginParam.corpId || !loginParam.agentId) && !loginParam.suiteId && !loginParam.appId) {
          if (exceptions && exceptions.length > 0) {
              for (let i = 0; i < exceptions.length; i++) {
                  const e = exceptions[i]
                  if (WxLoginConfig.EnableLog) console.log("get exception: " + e)
                  if (path.indexOf(e) >= 0) {
                      //loginParam.appId="app"
                      if (WxLoginConfig.EnableLog) console.log("set fake appId done")
                      WebAppLoginHelper.setLoginParams(loginParam)//设置一个fake appId
                      return true
                  }
              }
          }else{
            if (WxLoginConfig.EnableLog) console.log("no LoginParams in url and sessionStorage: to="+path)
            return false
          }
      } else {
        WebAppLoginHelper.setLoginParams(loginParam)
          if (WxLoginConfig.EnableLog) console.log("setLoginParams done")
      }
  }
  return true
}


  /**
 * @parameter 
 */
// export function securedRoute(
//     name: string,
//     path: string,
//     component: React.LazyExoticComponent<any> | React.FC<any>,
//     needWxOauth: number = NeedWxOauth.Yes) 
//     {
//       return {
//         name, path, id: name, async(ctx: Router.RouteCallbackCtx) { 
//           checkAdmin(ctx, component, needWxOauth) 
//         }
//       }
//   }



/**
* 0.关于securedRoute
* （1）使用securedRoute保护的路径，且路径中含了"/super/admin/", "/admin/", "/dev/", "/user/" 对应的role权限
* （2）使用securedRoute保护的路径，且路径中无上述字符串，将只是跳转到微信，让获取openId等信息，无需特殊role角色配置
* 
* 1.路径约定之query参数（必须）： appId，或corpId&agentId，或suiteId， 微信或企业微信登录时为必选项， 以及agentId
* （1）若不包含，需明确设置特例，如"/super/","/wx/admin/"。
* （2）目的是设置CorpParams，用于构建cacheKey，不用于API调用时设置到请求头中，其核心目的是避免不同账号切换时数据乱窜
* （3）请求头中的corpId或appId来自于用户登录后的authBean。并从中遍历获取LoginParam
*
*  2.路径约定之query参数（可选）： loginType  
*  (1) 用于指定登录类型（若还没有登录的话）：LoginType.ACCOUNT（密码登录）、LoginType.SCAN_QRCODE（微信或企业微信扫码）
*  (2) 本函数将根据loginType跳到不同的登录组件进行登录, 不指定任何值（微信登录或企业微信登录，自动判断浏览器类型）
* 
* 3. 路径约定之query参数（可选）： authStorageType
* （1）用于指定登录后存储登录信息的storageType，登录成功后，将根据该参数进行登录信息的存储
* （2）不指定的话则使用sessionStorage和localStorage，其值参见：StorageType
* 
* 4. 路径约定之query参数（可选）： needUseInfo
* (1)微信登录时，是否获取用户信息（需用户授权），可以获取、不获取、或动态（由后端查询配置是否获取）
*（2）值参见：NeedUserInfoType，不指定则默认为不获取
*  
* 5.路径path参数，在route中配置（如: /u/:uId/n2/:id, uId即owner)，用于needUserInfo需要根据后端配置时查询是哪个配置
* 
* 上面这些参数除了loginType外，其余的将以LoginParam传递给登录组件
* 
* @param needWxOauth 当不是admin等特权路径、但使用了securedRoute保护的路径，配置是否需要微信认证登录
* 为Yes时，则检查是否oauth登录信息，没有则进行微信登录，
* 为OnlyWxEnv时则在微信环境下进行认证登录，
* 为No一概不进行微信认证登录
* 
*/
// function checkAdmin(ctxx: Router.RouteCallbackCtx,
//   component: React.LazyExoticComponent<any> | React.FC<any>,
//   needWxOauth: number = NeedWxOauth.Yes
// ) {
//   if (WxLoginConfig.EnableLog) console.log("securedRoute checkAdmin call checkAndSetCorpParams")
//   const toUrl = ctx.to.url

//   // make CorpParams optional, not check
//   checkAndSetCorpParams(toUrl, ["/super/", "/wx/admin/"])
//   //ctx.resolve({ "component": ErrorPage }, { "props": { msg: "no CorpParams in toUrl=" + toUrl } })

//   const toPath = ctx.to.path

//   const loginParam: LoginParam = {
//       appId: ctx.to.query.appId,
//       corpId: ctx.to.query.corpId,
//       suiteId: ctx.to.query.suiteId,
//       agentId: ctx.to.query.agentId,
//       from: toUrl,
//       owner: ctx.to.params["uId"],//用于查询后端文章属主需不需要获取用户信息 //只有newsDetail待定（根据用户配置确定），其它都不需要获取用户信息（关注时自动获取，其它情况不必要）
//       needUserInfo: +(ctx.to.query.needUseInfo || NeedUserInfoType.Force_Not_Need), //从拦截的链接中获取 从url中提取参数needUserInfo
//       authStorageType: ctx.to.query.authStorageType ? +(ctx.to.query.authStorageType) : StorageType.BothStorage
//   }

//   //从拦截的链接中获取 从url中提取参数loginType,
//   //没有的话，则根据是否在微信环境，指定默认类型，不再是默认都为微信公众号类型
//   let loginType = ctx.to.query.loginType
//   if(!loginType){
//     if(isWeixinBrowser()) loginType = LoginType.WECHAT
//     else if(isWeixinOrWxWorkBrowser()) loginType = LoginType.WXWORK
//     else loginType = LoginType.ACCOUNT
//   }
  

//   let loginComponent: ((props: any) => JSX.Element) | React.FC<LoginParam>
//   if (loginType === LoginType.ACCOUNT) {
//       loginComponent = UserPwdLoginPage
//   } else if (loginType === LoginType.SCAN_QRCODE) {
//       loginComponent = PcShowQrcodePage
//   } else if (loginType === LoginType.MOBILE) {
//       loginComponent = UserPwdLoginPage //暂时也使用账户密码登录
//   } else {
//       loginComponent = WebAppHelper.isWxWorkApp() ? WxOauthLoginPageWork : WxOauthLoginPageOA
//   }

//   const p = { "props": loginParam }

//   //检查路径中是否包含需要登录的字符
//   const roles = rolesNeededByPath(toPath)
//   if (roles) {//有特殊权限要求，如admin
//       if (WxAuthHelper.hasRoles(roles)) //已登录
//           ctx.resolve({ "component": component })
//       else {
//           if (WxLoginConfig.EnableLog) console.log("securedRoute checkAdmin: need roles=" + roles + ", goto LoginPage from " + ctx.to.url)
//           ctx.resolve({ "component": loginComponent }, p)
//       }
//   } else {//无需特殊要求
//       switch (needWxOauth) {
//           case NeedWxOauth.Yes: {
//               tryLogin(ctx, component, loginComponent, loginParam)
//               break
//           }
//           case NeedWxOauth.OnlyWxEnv: {
//               if (isWeixinOrWxWorkBrowser()) {
//                   tryLogin(ctx, component, loginComponent, loginParam)
//               } else {
//                   if (WxLoginConfig.EnableLog) console.log("securedRoute: not wx env, jump to=" + ctx.to.url)
//                   ctx.resolve({ "component": component }, p)
//               }

//               break
//           }
//           //不需要admin，直接跳走，无需微信登录
//           case NeedWxOauth.No: {
//               ctx.resolve({ "component": component }, p)
//               break
//           }
//       }

//   }
// }