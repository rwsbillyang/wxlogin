
export interface AuthBean {
    loginType: string, //login type
    token: string,
    sysId?: string //system accountId
    roles?: string[], //'user' | 'guest' | 'admin';
    expireInfo?: ExpireInfo,
    profile?: Profile,
}

export interface Profile{
    nick?: string
    avatar?: string
    sex?: number, //用户的性别，值为1时是男性，值为2时是女性，值为0时是未知
    address?: string //click IP地址，查看用户详情时则是微信用户信息里的地址
}

export interface ExpireInfo{
    expire: number,
    level: number
}

export interface WxOaGuest{
    appId: string,
    openId?: string // 微信openId
    unionId?: string
}


export interface SysAccountAuthBean{
    authBean: AuthBean
}

export interface WxOaAccountAuthBean{
    _id?: string, //wxOaAccount._id
    authBean?: AuthBean,
    guest?: WxOaGuest
}

export interface WxWorkGuest{
    corpId?: string
    suiteId?: string //ISV模式，否则空
    agentId?: number,

    openId?: string // 企业微信的openId
    userId?: string //企业成员userId
    externalId?: string //外部成员ID
    deviceId?: string
}


export interface WxWorkAccountAuthBean{
    _id?: string,
    authBean?: AuthBean,
    guest: WxWorkGuest
}


// export interface AuthBean extends GuestOAuthBean{
//     uId: string, //account._id
//     token: string, //系统注册用户登录后，才有值
//     level: number, // 当前edition level 可能已过期
//     permittedlevel?: number, // 操作权限，过期后降为免费权限
//     expire?: number, //utc time
//     role?: string[], //若为空，自动赋值 "user"

//     avatar?: string,
//     nick?: string,
//     qrCode?: string  
//     ext?: string //扩展字段，如推广模式：个人品牌，产品广告等

//     miniId?: string //小程序 appId
//     gId?: string[] //所属群组
// }
//export interface GuestOAuthBean{
    //     appId?: string// 公众号
    //     unionId?: string,// 公众号
    //     openId1?: string, // 公众号访客openId
    //     hasUserInfo?: boolean 
    
    //     openId2?: string, // 企业微信访客openId
    //     //企业微信
    //     userId?: string, //企业微信内部员工userid
    //     externalUserId?: string,//企业微信外部成员id
    //     corpId?: string,
    //     agentId?: number,
    //     suiteId?: string,
    //     deviceId?: string
    // }