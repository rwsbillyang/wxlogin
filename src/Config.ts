import { PathNeedRoles } from "./datatype/PathNeedRoles";

interface IWxLoginConfig {
    EnableLog: boolean;
    WxConfigDebug: boolean;
    WxWorkConfigDebug: boolean;
    WxWorkConfigEnableAgentConfig: boolean;
    JumpToAuthrize: boolean;
    backToFromAfterOAuth: boolean;
    hasNavBar: boolean;
    /**
    * 后端在通知前端oauth认证时采用的前端路径必须与此一致，
    * 注意： 前端若是SPA，通知路径可能需要添加browserHistorySeparator
    */
    BrowserHistorySeparator: string;
    AppKeyPrefix: string;
    /**
     * SecuredRoute根据该配置是否需要登录, 会被自定义的permitRoles覆盖
     * path中包含characters即命中
     */
     adminPathRoles: PathNeedRoles[]
     /**
      * 优先级高于adminPathRoles, path中包含characters即命中
      */
     customAdminPathRoles?: PathNeedRoles[]

};


//depends on f7 Router/Compoent and UI
export const WxLoginConfig: IWxLoginConfig = {
    EnableLog: false,
    WxConfigDebug: false, //wx.config调试开关
    WxWorkConfigDebug: false, //企业微信wx.config调试开关
    WxWorkConfigEnableAgentConfig: false, //企业微信是否注入agentConfig
    JumpToAuthrize: true, //跳转到微信认证授权，用于调试
    backToFromAfterOAuth: true, //oauth之后是否跳回from，用于调试
    hasNavBar: true,
    /**
    * 后端在通知前端oauth认证时采用的前端路径必须与此一致，
    * 注意： 前端若是SPA，通知路径可能需要添加browserHistorySeparator
    */
    BrowserHistorySeparator: "#!",
    AppKeyPrefix: "/wx",

    /**
     * SecuredRoute根据该配置是否需要登录, 会被自定义的permitRoles覆盖
     */
    adminPathRoles: [
        {
            characters: "/super/admin",
            roles: ["root"]
        },
        {
            characters: "/admin",
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

} 