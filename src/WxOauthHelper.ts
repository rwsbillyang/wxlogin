import {CacheStorage, StorageType, Cache} from "@rwsbillyang/usecache"
import { WxLoginConfig } from "./Config"
import { AuthBean } from "./datatype/AuthBean"
import { GuestOAuthBean } from "./datatype/GuestOAuthBean"


import { WebAppHelper } from "./WebAppHelper"


/**
 * 适用于公众号和企业微信 oauth身份认证
 */
export const WxGuestAuthHelper = {
    getKey(): string {
        return  "auth/guest"
    },
    getAuthBean(): GuestOAuthBean | undefined {
        return CacheStorage.getObject(WxGuestAuthHelper.getKey(), StorageType.BothStorage)
    },
    onAuthenticated(authBean: GuestOAuthBean, storageType: number) {
        CacheStorage.saveObject(WxGuestAuthHelper.getKey(), authBean, storageType)

    },
    /**
     * 判断是否登录
     */
    isAuthenticated(): boolean {
        const authBean = WxGuestAuthHelper.getAuthBean()
        if (authBean)
            return true
        else
            return false
    },
    onSignout(cb?: () => void) {
        Cache.evictCache(WxGuestAuthHelper.getKey(), StorageType.BothStorage)
        if (cb) {
            cb()
        }
    },
}

export const WxAuthHelper = {
    getKey(): string {
        return "auth"
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
    isAuthenticated(): boolean {
        const authBean = WxAuthHelper.getAuthBean()
        if (authBean && authBean.token)
            return true
        else
            return false
    },
    hasRole(role: string){
        return WxAuthHelper.hasRoles([role])
    },
    hasRoles(anyRoles: string[]){
        const authBean = WxAuthHelper.getAuthBean()
        if (authBean && authBean.uId && authBean.token && authBean.role) {
            for(let j=0;j<anyRoles.length;j++){
                const role = anyRoles[j]
                for (let i = 0; i < authBean.role.length; i++) {
                    if (authBean.role[i] === role)
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
    onAuthenticated(authBean: AuthBean, storageType: number) {
        const key = WxAuthHelper.getKey()
        const str = JSON.stringify(authBean)
        CacheStorage.saveItem(key, str, storageType)

    },
    /**
     * 退出登录成功后的动作
     */
    onSignout(cb?: () => void) {
        const key = WxAuthHelper.getKey()
        Cache.evictCache(key,  StorageType.BothStorage)

        if (cb) {
            cb()
        }
    },


    /**
     * 
     * @param id 用户id字符串
     * @param token jwt token
     * @param level 用户等级
     * data class AuthBean(val id: String, val token: String, val level: Int)
     * */
    getAuthBean(): AuthBean | undefined {
       return CacheStorage.getObject(WxAuthHelper.getKey(), StorageType.BothStorage)
    },


    /**
     * 获取登录后的请求头
     * use-http会额外添加application/json请求头，故此处注释掉
     */
    getHeaders(): {} | undefined {
        const authBean = WxAuthHelper.getAuthBean()
        const isWxWorkApp = WebAppHelper.isWxWorkApp()
        if (authBean) {
            let header: MyHeaders = {
                // 'Content-Type': 'application/json',
                // 'Accept': 'application/json',
                "Authorization": 'Bearer ' + authBean.token
            }

            if (authBean.uId) header["X-Auth-uId"] = authBean.uId
            if(isWxWorkApp){
                if (authBean.openId2) header["X-Auth-oId"] = authBean.openId2
                if (authBean.userId) header["X-Auth-UserId"] = authBean.userId
                if (authBean.externalUserId) header["X-Auth-ExternalUserId"] = authBean.externalUserId
                if (authBean.suiteId) header["X-Auth-SuiteId"] = authBean.suiteId
                if (authBean.corpId) header["X-Auth-CorpId"] = authBean.corpId
                if (authBean.agentId) header["X-Auth-AgentId"] = authBean.agentId
            } else{
                if (authBean.openId1) header["X-Auth-oId"] = authBean.openId1
                if (authBean.unionId) header["X-Auth-unId"] = authBean.unionId
                if (authBean.corpId) header["X-Auth-CorpId"] = authBean.appId
            }
            
            return header
        }else{
            const authBean2 = WxGuestAuthHelper.getAuthBean()
            if(authBean2){
                let header2: MyHeaders = {}
                if(isWxWorkApp){
                    if (authBean2.openId2) header2["X-Auth-oId"] = authBean2.openId2
                    if (authBean2.userId) header2["X-Auth-UserId"] = authBean2.userId
                    if (authBean2.externalUserId) header2["X-Auth-ExternalUserId"] = authBean2.externalUserId
                    if (authBean2.suiteId) header2["X-Auth-SuiteId"] = authBean2.suiteId
                    if (authBean2.corpId) header2["X-Auth-CorpId"] = authBean2.corpId
                    if (authBean2.agentId) header2["X-Auth-AgentId"] = authBean2.agentId
                } else{
                    if (authBean2.openId1) header2["X-Auth-oId"] = authBean2.openId1
                    if (authBean2.unionId) header2["X-Auth-unId"] = authBean2.unionId
                    if (authBean2.corpId) header2["X-Auth-CorpId"] = authBean2.appId
                }
                return header2
            }else 
            return undefined
        }
    }
}

interface MyHeaders{
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

export function saveValue(shortKey: string, value: string)
{
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
