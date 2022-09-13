
//depends on f7 Router/Compoent and UI
export const WxLoginConfig = {
    EnableLog: false,
    enableAgentConfig: false, //企业微信是否注入agentConfig
    hasNavBar: true,
     /**
     * 后端在通知前端oauth认证时采用的前端路径必须与此一致，
     * 注意： 前端若是SPA，通知路径可能需要添加browserHistorySeparator
     */
    BrowserHistorySeparator: "#!",
    AppKeyPrefix: "/wx",
    TextBack:  "返回",  
} 