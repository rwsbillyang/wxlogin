export interface GuestOAuthBean{
    appId?: string// 公众号
    unionId?: string,// 公众号
    openId1?: string, // 公众号访客openId
    hasUserInfo?: boolean 

    openId2?: string, // 企业微信访客openId
    //企业微信
    userId?: string, //企业微信内部员工userid
    externalUserId?: string,//企业微信外部成员id
    corpId?: string,
    agentId?: number,
    suiteId?: string,
    deviceId?: string
}