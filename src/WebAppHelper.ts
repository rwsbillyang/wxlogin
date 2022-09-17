

import { f7 } from "framework7-react"
import { WxLoginConfig } from "./Config"
import { CorpParams } from "./datatype/CorpParams"


export const WebAppHelper = {
    //同一个企业微信账户在切换到不同单位时，应该使用不同的登录数据和业务数据，因此缓存这些数据的key需要入口页url中的参数动
    //态变化，不可固定不变，否则导致数据不更新。这里通过入口页url中的参数来获取登录信息
    //将入口页url参数保存到session中，关闭后丢失，重新打开时重新设置
    setCorpParams(params: CorpParams) {
        const str = JSON.stringify(params)
        sessionStorage.setItem(`${WxLoginConfig.AppKeyPrefix}/corpParams`, str)
    },
    getCorpParams(): CorpParams | undefined {
        const p = sessionStorage.getItem(`${WxLoginConfig.AppKeyPrefix}/corpParams`)
        if (p) return JSON.parse(p)
        else return undefined
    },
    isWxWorkApp(){
        if(WxLoginConfig.EnableLog) console.log("isWxWorkApp call getCorpParams")
        const p = WebAppHelper.getCorpParams()
        if(p?.corpId && p?.agentId) return true //企业微信模式
       // if(WxLoginConfig.EnableLog) console.log("no corpId or agentId, isWxWorkApp return false")
        return false //公众号模式
    },

    //获取cacheKeyPrefix，用于注入useCacheConfig中
    getKeyPrefix(){ 
        const params = WebAppHelper.getCorpParams()
        const corpId_ = params?.corpId || params?.appId || params?.suiteId || 'nocorp'
        const key = params?.agentId? `${WxLoginConfig.AppKeyPrefix}/${corpId_}/${params.agentId}/` : `${WxLoginConfig.AppKeyPrefix}/${corpId_}/`

        //if(WxLoginConfig.EnableLog) console.log("WebAppHelper: getKeyPrefix(): "+key)
        return key
    },
    
    //prefix: ?, &
    getCorpParamsUrlQuery(prefix: string): string {
        if(WxLoginConfig.EnableLog) console.log("getCorpParamsUrlQuery call getCorpParams")
        const p = WebAppHelper.getCorpParams()
        if (p) return prefix + f7.utils.serializeObject(p)
        else return ''
    },
}