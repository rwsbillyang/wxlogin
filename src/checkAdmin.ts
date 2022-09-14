
import { Router } from "framework7/types";

import { f7 } from "framework7-react";
import { StorageType } from "@rwsbillyang/usecache";

import { WxOauthLoginPageOA } from "./WxOauthLoginPageOA";
import { PathNeedRoles } from "./datatype/PathNeedRoles";
import { LoginParam } from "./datatype/LoginParam";
import { NeedUserInfoType } from "./datatype/NeedUserInfoType";
import WxOauthLoginPageWork from "./WxOauthLoginPageWork";
import UserPwdLoginPage from "./UserPwdLoginPage";
import { LoginType } from "./datatype/LoginType";
import { PcShowQrcodePage } from "./WxScanQrcodeLogin";
import { WebAppHelper } from "./WebAppHelper";
import { isWeixinOrWxWorkBrowser } from "./wxJsSdkHelper";
import { CorpParams } from "./datatype/CorpParams";
import { WxAuthHelper, WxGuestAuthHelper } from "./WxOauthHelper";
import ErrorPage from "./ErrorPage";
import { ComponentFunction } from "framework7/modules/component/component";
import { WxLoginConfig } from "./Config";


const adminPathConfigs: PathNeedRoles[] = [
    {
        characters: "/super/admin/",
        roles: ["root"]
    },
    {
        characters: "/admin/",
        roles: ["root", "admin"]
    },
    {
        characters: "/dev/",
        roles: ["dev"]
    },
    {
        characters: "/user/",
        roles: ["root", "admin", "user"]
    },
]

/**
 * 循环遍历adminPathConfigs配置数组，path匹配则返回需要的roles
 * @param toPath 访问路径
 * @returns 返回访问该路径需要的roles数组，用户如若具备roles中任何一个即可访问，无需roles，返回undefined
 */
export function rolesNeededByPath(toPath: string) {
    for (let i = 0; i < adminPathConfigs.length; i++) {
        const e = adminPathConfigs[i]
        if (toPath.indexOf(e.characters) >= 0)
            return e.roles
    }
    return
}
/**
 * 仅适用于无需roles特权时的普通路径，是否需微信登录
 */
export enum NeedWxOauth {
    Yes, //是
    OnlyWxEnv, //仅仅微信环境下 
    No //直接跳走，无需微信登录
}
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
 */
export function checkAdmin(ctx: Router.RouteCallbackCtx,
    component: ComponentFunction | Function | object,
    needWxOauth: NeedWxOauth = NeedWxOauth.Yes
) {
    if (WxLoginConfig.EnableLog) console.log("securedRoute checkAdmin call checkAndSetCorpParams")
    const toUrl = ctx.to.url
    if (!checkAndSetCorpParams(toUrl, ["/super/", "/wx/admin/"]))
        ctx.resolve({ "component": ErrorPage }, { "props": { msg: "no CorpParams in toUrl=" + toUrl } })

    const toPath = ctx.to.path
    const isWxWorkApp = WebAppHelper.isWxWorkApp()

    //从拦截的链接中获取 从url中提取参数loginType
    const loginType = ctx.to.query.loginType

    let loginComponent: ((props: any) => JSX.Element) | React.FC<LoginParam>
    if (loginType === LoginType.ACCOUNT) {
        loginComponent = UserPwdLoginPage
    } else if (loginType === LoginType.SCAN_QRCODE) {
        loginComponent = PcShowQrcodePage
    } else if (loginType === LoginType.MOBILE) {
        loginComponent = UserPwdLoginPage //暂时也使用账户密码登录
    } else {
        loginComponent = isWxWorkApp ? WxOauthLoginPageWork : WxOauthLoginPageOA
    }

    //从拦截的链接中获取 从url中提取参数needUserInfo
    const needUserInfo: number = +(ctx.to.query.needUseInfo || NeedUserInfoType.Force_Not_Need)
    const authStorageType: number = (ctx.to.query.authStorageType ? +(ctx.to.query.authStorageType) : StorageType.BothStorage)
    const owner = ctx.to.params["uId"]//用于查询后端文章属主需不需要获取用户信息 //只有newsDetail待定（根据用户配置确定），其它都不需要获取用户信息（关注时自动获取，其它情况不必要）

    const loginParam: LoginParam = {
        appId: ctx.to.query.appId,
        corpId: ctx.to.query.corpId,
        suiteId: ctx.to.query.suiteId,
        agentId: ctx.to.query.agentId,
        from: ctx.to.url,
        owner,
        needUserInfo,
        authStorageType
    }
    const p = { "props": loginParam }

    //检查路径中是否包含需要登录的字符
    const roles = rolesNeededByPath(toPath)
    if (roles) {
        if (WxAuthHelper.hasRoles(roles)) //已登录
            ctx.resolve({ "component": component })
        else {
            if (WxLoginConfig.EnableLog) console.log("securedRoute checkAdmin: need roles="+ roles +", goto LoginPage from " + ctx.to.url)
            ctx.resolve({ "component": loginComponent }, p)
        }
    } else {
        switch (needWxOauth) {
            case NeedWxOauth.Yes: {
                tryLogin(ctx, component, loginComponent, loginParam)
                break
            }
            case NeedWxOauth.OnlyWxEnv: {
                if (isWeixinOrWxWorkBrowser()) {
                    tryLogin(ctx, component, loginComponent, loginParam)
                } else {
                    if (WxLoginConfig.EnableLog) console.log("securedRoute: not wx env, jump to=" + ctx.to.url)
                    ctx.resolve({ "component": component }, p)
                }

                break
            }
            //不需要admin，直接跳走，无需微信登录
            case NeedWxOauth.No: {
                ctx.resolve({ "component": component }, p)
                break
            }
        }

    }
}

function tryLogin(ctx: Router.RouteCallbackCtx,
    component: ComponentFunction | Function | object,
    loginComponent: ComponentFunction | Function | object,
    loginParam: LoginParam) {

    const p = { "props": loginParam }
    if (WxGuestAuthHelper.isAuthenticated() || WxAuthHelper.isAuthenticated()) {
        ctx.resolve({ "component": component }, p)
    } else {
        if (WxLoginConfig.EnableLog) console.log("securedRoute: has wxOauth info, jump to=" + ctx.to.url)
        ctx.resolve({ "component": loginComponent }, p)
    }
}


/**
 * 检查提取路径中的corpId，agentId等信息，用于构建cache key的前缀，避免数据窜乱
 * 可以通过exceptions设置例外不检查的路径，如“/wx/admin”，此时将这只一个默认的参数
 * 若未设置，将提示出错
 */
 function checkAndSetCorpParams(toUrl: string, exceptions?: string[]) {
    if (WxLoginConfig.EnableLog) console.log("checkAndSetCorpParams call getCorpParams! toUrl=" + toUrl)
    //若还没有CorpParams，则解析url参数，设置它；若已存在则忽略
    //对于exceptions中的例外路径，则设置一个fake CorpParams
    const p = WebAppHelper.getCorpParams()
    if (!p) {
      const query: any = f7.utils.parseUrlQuery(toUrl)
      const params: CorpParams = { corpId: query.corpId, agentId: query.agentId, suiteId: query.suiteId, appId: query.appId }
  
      if ((!query.corpId || !query.agentId) && !query.suiteId && !query.appId) {
        //wx admin not need SetCorpParams
        if (exceptions && exceptions.length > 0) {
          for(let i =0; i < exceptions.length; i++){
            const e = exceptions[i]
            if (WxLoginConfig.EnableLog) console.log("get exception: "+e)
            if (toUrl.indexOf(e) >= 0) {
              const fakeParams: CorpParams = { appId: "wxAdmin" }
              if (WxLoginConfig.EnableLog) console.log("set fake CorpParams done")
              WebAppHelper.setCorpParams(fakeParams)//设置一个fake CorpParams
              return true
            }
          }
        }
  
        if (WxLoginConfig.EnableLog) console.log("no CorpParams in url and sessionStorage:, toUrl=" + toUrl)
        return false
      } else {
        WebAppHelper.setCorpParams(params)
        if (WxLoginConfig.EnableLog) console.log("setCorpParams done")
      }
    }else{
        WebAppHelper.setKeyPrefixByCorpParams(p)
    }
    return true
  }
  