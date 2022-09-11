
/***
 * securedRoute保护的route，通过checkAdmin提取的参数，然后传递给各LoginComponent
 */
 export interface LoginParam {
    appId?: string //公众号
    corpId?: string //企业微信
    suiteId?: string //企业微信ISV
    agentId?: string //企业微信
    from?: string //需要登录的页面
    owner?: string //用于公众号 用于判断用户设置是否获取用户信息 
    needUserInfo: number // 用于公众号 或企业微信
    authStorageType?: number //authBean存储类型
  }
