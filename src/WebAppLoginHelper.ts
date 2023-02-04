
import { serializeObject } from "@rwsbillyang/usecache"
import { WxLoginConfig } from "./Config"
import { LoginParam } from "./datatype/LoginParam"


export const WebAppLoginHelper = {
    //同一个企业微信账户在切换到不同单位时，应该使用不同的登录数据和业务数据，因此缓存这些数据的key需要入口页url中的参数动
    //态变化，不可固定不变，否则导致数据不更新。这里通过入口页url中的参数来获取登录信息
    //将入口页url参数保存到session中，关闭后丢失，重新打开时重新设置
    setLoginParams(params: LoginParam) {
        const str = JSON.stringify(params)
        sessionStorage.setItem(`${WxLoginConfig.AppKeyPrefix}/loginParams`, str)
    },
    getLoginParams(): LoginParam | undefined {
        const p = sessionStorage.getItem(`${WxLoginConfig.AppKeyPrefix}/loginParams`)
        if (p) return JSON.parse(p)
        else return undefined
    },
    isWxWorkApp(){
        if(WxLoginConfig.EnableLog) console.log("isWxWorkApp call getCorpParams")
        const p = WebAppLoginHelper.getLoginParams()
        if(p?.corpId && p?.agentId) return true //企业微信模式
        return false //公众号模式
    },

    /**
     * 获取cache Space prefix，用于注入useCacheConfig中
     * */
    getCacheSpace(){ 
        const params = WebAppLoginHelper.getLoginParams()
        const corpId_ = params?.corpId || params?.appId || params?.suiteId || 'appId'
        const key = params?.agentId? `${WxLoginConfig.AppKeyPrefix}/${corpId_}/${params.agentId}/` : `${WxLoginConfig.AppKeyPrefix}/${corpId_}/`

        return key
    },
    
    /**
     * @param prefix: ?, &
     * */
    getLoginParamsUrlQuery(prefix: '?' | '&'): string {
        if(WxLoginConfig.EnableLog) console.log("getCorpParamsUrlQuery call getCorpParams")
        const p = WebAppLoginHelper.getLoginParams()
        if (p) return prefix + serializeObject(p)
        else return ''
    },
}