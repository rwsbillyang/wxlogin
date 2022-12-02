import { Cache, CacheStorage, StorageType } from "@rwsbillyang/usecache"
import { WxLoginConfig } from "./Config"
import { SysAccountAuthBean, WxOaAccountAuthBean, WxWorkAccountAuthBean } from "./datatype/AuthBean"




export const WxAuthHelper = {
    getKey(isGuest: boolean): string {
        return isGuest ? "guest" : "auth2"
    },
    /**
     * 
     * @param groupNeed 资源需要的分组，不需要分组时为空，返回true
     * @param userGroup 用户所在分组，若为空则为false
     * @returns 检查用户所具在分组，是否是在资源所需要的分组范围内，有交集为true，否则false
     */
    isInGroup(groupNeed?: string[], userGroup?: string[]){
        if(!groupNeed || groupNeed.length === 0) return true //不需要权限
        if(!userGroup || userGroup.length === 0) return false //用户没有权限
        //只要有交集就有权限
        for(let i=0;i<groupNeed.length;i++){
            const gId = groupNeed[i]
            for(let j=0;j<userGroup.length;j++){
                if(userGroup[j] === gId) return true
            }
        }
        return false
    },
    /**
     * 判断是否登录
     */
    isAuthenticated(isGuest: boolean): boolean {
        const bean = WxAuthHelper.getAuthBean(isGuest)
        if(isGuest){
            return !!bean
        }else{
            if (bean && bean.authBean && bean.authBean.token)
            return true
        else
            return false
        }
        
    },
    hasRole(role: string) {
        return WxAuthHelper.hasRoles([role])
    },
    hasRoles(anyRoles: string[]) {
        const bean = WxAuthHelper.getAuthBean(false)
        if (!bean) return false

        const authBean = bean.authBean


        if (authBean && authBean.token && authBean.roles) {
            for (let j = 0; j < anyRoles.length; j++) {
                const role = anyRoles[j]
                for (let i = 0; i < authBean.roles.length; i++) {
                    if (authBean.roles[i] === role)
                        return true
                }
            }
            return false
        } else {
            return false
        }
    },
    /**
     * 是否是系统管理员
     */
    isAdmin() {
        return WxAuthHelper.hasRole("admin")
    },

    /**
     *  登录成功后的动作，记录下登录信息
     */
    saveAuthBean(isGuest: boolean, authBean: SysAccountAuthBean | WxOaAccountAuthBean | WxWorkAccountAuthBean, storageType: number) {
        CacheStorage.saveObject(WxAuthHelper.getKey(isGuest), authBean, storageType)
    },
    /**
 * 
 * @param id 用户id字符串
 * @param token jwt token
 * @param level 用户等级
 * data class AuthBean(val id: String, val token: String, val level: Int)
 * */
    getAuthBean(isGuest: boolean): SysAccountAuthBean | WxOaAccountAuthBean | WxWorkAccountAuthBean | undefined {
        return CacheStorage.getObject(WxAuthHelper.getKey(isGuest), StorageType.BothStorage)
    },

    /**
     * 退出登录成功后的动作
     */
    onSignout(isGuest: boolean, cb?: () => void) {
        const key = WxAuthHelper.getKey(isGuest)
        Cache.evictCache(key, StorageType.BothStorage)

        if (cb) {
            cb()
        }
    },





    /**
     * 获取登录后的请求头
     * use-http会额外添加application/json请求头，故此处注释掉
     */
    getHeaders(): {} | undefined {
        const bean = WxAuthHelper.getAuthBean(false) || WxAuthHelper.getAuthBean(true)
        if (!bean || !bean.authBean) return undefined
        const authBean = bean.authBean

        const header: MyHeaders = {
            // 'Content-Type': 'application/json',
            // 'Accept': 'application/json',
            "Authorization": 'Bearer ' + authBean.token
        }
        const accountId =  bean["_id"]
        if (accountId) header["X-Auth-uId"] = accountId //app account Id 
        if(authBean.sysId) header["X-Auth-sysId"] = authBean.sysId//global account Id

        const guest = authBean["guest"]
        if (guest) {
            if (guest.appId) header["X-Auth-appId"] = guest.appId || guest.corpId || guest.suiteId
            if (guest.openId) header["X-Auth-openId"] = guest.openId
            if (guest.unionId) header["X-Auth-unionId"] = guest.unionId
            
            if (guest.agentId) header["X-Auth-AgentId"] = guest.agentId
            if (guest.userId) header["X-Auth-UserId"] = guest.userId
            if (guest.externalId) header["X-Auth-ExternalUserId"] = guest.externalId

        }
        return header
    }
}

interface MyHeaders {
    "Authorization"?: string | undefined
    "X-Auth-uId"?: string | undefined
    "X-Auth-oId"?: string | undefined
    "X-Auth-unId"?: string | undefined
    "X-Auth-UserId"?: string | undefined
    "X-Auth-ExternalUserId"?: string | undefined
    "X-Auth-SuiteId"?: string | undefined
    "X-Auth-CorpId"?: string | undefined
    "X-Auth-AgentId"?: number | undefined
}

export function saveValue(shortKey: string, value: string) {
    const key = `${WxLoginConfig.AppKeyPrefix}/${shortKey}`
    sessionStorage.setItem(key, value)
}
/**
 * 阅后即焚
 * @param shortKey 
 * @returns 
 */
export function getValue(shortKey: string): string | null {
    const key = `${WxLoginConfig.AppKeyPrefix}/${shortKey}`
    const value = sessionStorage.getItem(key)
    sessionStorage.removeItem(key)
    return value
}
