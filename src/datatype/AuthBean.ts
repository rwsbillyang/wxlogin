import { GuestOAuthBean } from "./GuestOAuthBean"

export interface AuthBean extends GuestOAuthBean{
    uId: string, //account._id
    token: string, //系统注册用户登录后，才有值
    level: number, // 当前edition level 可能已过期
    permittedlevel?: number, // 操作权限，过期后降为免费权限
    expire?: number, //utc time
    role?: string[], //若为空，自动赋值 "user"

    avatar?: string,
    nick?: string,
    qrCode?: string  
    ext?: string //扩展字段，如推广模式：个人品牌，产品广告等

    miniId?: string //小程序 appId
    gId?: string[] //所属群组
}

