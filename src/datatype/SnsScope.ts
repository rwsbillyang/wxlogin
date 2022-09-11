export const SnsScope = {
    base: "snsapi_base", //不弹出授权页面，直接跳转，只能获取用户openid
    userInfo: "snsapi_userinfo", //弹出授权页面，可通过openid拿到昵称、性别、所在地。并且， 即使在未关注的情况下，只要用户授权，也能获取其信息
    privateinfo: "snsapi_privateinfo" //企业微信适用.  第三方服务商配置scope为snsapi_privateinfo时，agentid所对应的应用必须有“成员敏感信息授权”的权限。“成员敏感信息授权”的开启方法为：登录服务商管理后台->标准应用服务->本地应用->进入应用->点击基本信息栏“编辑”按钮->勾选"成员敏感信息"
  }
  