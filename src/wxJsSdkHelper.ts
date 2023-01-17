import { useEffect, useState } from 'react'

import { CODE, DataBox, getDataFromBox, CacheStorage, currentHost, UseCacheConfig } from "@rwsbillyang/usecache"

import { f7 } from 'framework7-react';
import { RequestResponse } from 'framework7/types';
import { WebAppHelper } from './WebAppHelper';
import { CorpParams } from './datatype/CorpParams';
import { WxLoginConfig } from './Config';




//分享接口仅激活的成员数超过200人且已经认证的企业才可在微信上调用。

export interface JsSignature {
    appId: string
    timestamp: number
    nonceStr: string
    signature: string
    objectId: string //share or relay id
}

const WxJsNtKey = "WxJsNtKey"

export function isWeixinOrWxWorkBrowser() {
    return /MicroMessenger/.test(navigator.userAgent);
}
export function isWeixinBrowser() {
    const ua = window.navigator.userAgent;
    return /MicroMessenger\/([\d\.]+)/i.test(ua) && !/wxwork/i.test(ua)
}
export function isWxWorkBrowser() {
    const ua = window.navigator.userAgent;
    return /MicroMessenger\/([\d\.]+)/i.test(ua) && /wxwork/i.test(ua)
}



const defaultJsApiList = [

    // 'startRecord',
    // 'stopRecord',
    // 'onVoiceRecordEnd',
    // 'playVoice',
    // 'pauseVoice',
    // 'stopVoice',
    // 'onVoicePlayEnd',
    // 'uploadVoice',
    // 'downloadVoice',
    // 'translateVoice',

    'chooseImage',
    'previewImage',
    'uploadImage',
    'downloadImage',

    'getNetworkType',
    'openLocation',
    'getLocation',
    'hideOptionMenu',
    'showOptionMenu',
    'hideMenuItems',
    'showMenuItems',
    'hideAllNonBaseMenuItem',
    'showAllNonBaseMenuItem',
    'closeWindow',
    'scanQRCode',

    //'openProductSpecificView',
    //'addCard',
    //'chooseCard',
    //'openCard'
]
const defaultWxOaJsApi = [
    'onMenuShareTimeline',
    'onMenuShareAppMessage',
    'onMenuShareQQ',
    'onMenuShareWeibo',
    'onMenuShareQZone',
    'onMenuShareWeChat',
    'chooseWXPay',
]
const defaultWxWorkJsApi = [
    "getContext", "getCurExternalContact", "openUserProfile", "selectExternalContact",
    "onMenuShareAppMessage","onMenuShareWechat","onMenuShareTimeline","shareAppMessage","shareWechatMessage"
]

/**
 * 错误值越大，离正确结果越远
 */
export const WxJsStatus = {
    NotWeixin: -7,//最终状态
    RequestErr: -6,//最终状态
    ServerResponseErr_KO: -5,//最终状态
    ServerResponseErr_NO_DATA: -4,//最终状态
    WxWorkAgentConfigFail: -3,
    WxConfigFail: -2,
    WxInitErr: -1,//最终状态
    None: 0,
    SignatureLoading: 1,
    SDKInitializing: 2,
    WxConfigDone: 3, // oa or work wxconfig success
    WxWorkAgentConfigDone: 4,
    Ready: 5,
    NetworkTypeLoaded: 6,//最终状态
    NetworkTypeLoadErr: 7, //最终状态


}
export interface WxInitResult {
    status: number,
    networkType?: string
}

/**
 * react hooks版本 需要在设置了corpParams后执行
 * 在需要使用wx js sdk的页面中调用该函数
 * support Official account and wxWork 企业微信中分享的内容有可能会
 * https://open.work.weixin.qq.com/api/doc/10029
 * @
 * @param jsApi 
 */
export function useWxJsSdk(stausCallbacks?: object, jsApi?: string[]) {
    const [status, setStatus] = useState(f7.data.wxJsStatus || WxJsStatus.None)
    const [networkType, setNetworkType] = useState<string | undefined>(CacheStorage.getItem(WxJsNtKey))
    const isWxWorkApp = WebAppHelper.isWxWorkApp()
    const jsApiList = jsApi ? jsApi : defaultJsApiList.concat(isWxWorkApp ? defaultWxWorkJsApi : defaultWxOaJsApi)

    const updateStatus = (newStatus: number) => {
        f7.data.wxJsStatus = newStatus
        if (stausCallbacks) {
            const cb = stausCallbacks[newStatus.toString()]
            if (cb) cb()
        }
        setStatus(newStatus)
    }

    useEffect(() => {
        if (!isWeixinOrWxWorkBrowser()) {
            console.log("useWxJsSdk: not in wx")
            updateStatus(WxJsStatus.NotWeixin)
        } else {
            getSignautre()
        }
    }, [])

    const getSignautre = () => {
        //避免重复请求
        if (f7.data.wxJsStatus == undefined || f7.data.wxJsStatus <= WxJsStatus.None) { //若还处在初始状态，就进行签名验证，否则不验证。避免中途再次调用getSignautre
            const params = WebAppHelper.getCorpParams()
            const appId = params?.appId
            const corpId = params?.corpId
            const agentId = params?.agentId


            console.log("to getSignautre...isWxWorkApp=" + isWxWorkApp);

            const get = UseCacheConfig.request?.get
            if (!get) {
                console.warn("useWxJsSdk: not config UseCacheConfig.request?.get?")
                return false
            }
            const url = window.location.href //currentHost() + "/"
            let p: Promise<RequestResponse>
            //企业微信的jsSDK自定义分享不能在微信中正确设置，使用对应的公众号配置
            //因此：在微信中，就使用公众号的配置; 在企业微信中，就使用企业微信的配置
            if (isWxWorkApp && isWxWorkBrowser()) {//企业微信浏览器中
                if (!corpId || !agentId) {
                    console.warn("no corpId=" + corpId + " or agentId=" + agentId)
                }
                p = get("/api/wx/work/jssdk/signature", { ...params, url }) //后端签名依赖于Referer，但index.html中禁用了，故明确传递过去
            } else if (isWeixinBrowser()) {//微信浏览器中
                if (!appId) {
                    console.warn("no appId=" + appId)
                }
                p = get("/api/wx/oa/jssdk/signature", { appId: appId, url }) //后端签名依赖于Referer，但index.html中禁用了，故明确传递过去
            } else {
                console.warn("no in weixin browser or wx work browser?")
                return false
            }

            p.then(res => {
                updateStatus(WxJsStatus.SDKInitializing)

                const box: DataBox<JsSignature> = res.data
                if (box.code === CODE.OK) {
                    const data = getDataFromBox(box)
                    if (data) {
                       console.log("get JsSignature return data done!")
                        wxConfig(isWxWorkApp, data, params, corpId, agentId)
                       
                        wx.ready(()=> {
                            console.log("wx.ready!!!")
                            updateStatus(WxJsStatus.Ready)
                        
                            wx.getNetworkType({
                                success: function (res: any) {
                                    const networkType = res.networkType
                                    console.log("get networkType=" + networkType)
                                    setNetworkType(networkType)
                                    if (networkType) CacheStorage.saveItem(WxJsNtKey, networkType)
                                    updateStatus(WxJsStatus.NetworkTypeLoaded)
                                
                                },
                                fail: function () {
                                    //不关心获取网络类型错误
                                    updateStatus(WxJsStatus.NetworkTypeLoadErr)
                            
                                    console.log("fail to get networkType")
                                }
                            })
                        })

                        wx.error((res: any) => {
                            console.error('wx error', res);
                            updateStatus(WxJsStatus.WxInitErr)
                            //saveItem(WxJsStatusKey, WxJsStatus.WxInitErr.toString()) //注释掉，目的在于下次可以尝试
                        });

                    } else {
                        const msg = "data is null: " + JSON.stringify(box)
                        console.warn(msg)
                        updateStatus(WxJsStatus.ServerResponseErr_NO_DATA)
                    }
                } else {
                    const msg = JSON.stringify(box)
                    console.warn(msg)

                    updateStatus(WxJsStatus.ServerResponseErr_KO)
                }
            }).catch(err => {
                const msg = err.message
                console.warn(msg)
                updateStatus(WxJsStatus.RequestErr)
            })
        } else {
            //spa webapp, not need update signature for every url
            console.log("status=" + status + ",ignore getSignature,  nt=" + networkType)
        }
        return false
    }

    //JS-SDK:  https://open.work.weixin.qq.com/api/doc/10029  
    function wxConfig(isWxWorkApp: boolean, data: JsSignature, params?: CorpParams, corpId?: string, agentId?: number) {
        wx.checkJsApi({
            jsApiList: jsApiList, // 需要检测的JS接口列表
            success: function (res) {
                // 以键值对的形式返回，可用的api值true，不可用为false
                // 如：{"checkResult":{"chooseImage":true},"errMsg":"checkJsApi:ok"}
                console.log(res)
                //console.log("wx.checkJsApi done")
            }
        });
        if (isWxWorkApp && isWxWorkBrowser()) {//企业微信浏览器中
            if (WxLoginConfig.WxWorkConfigEnableAgentConfig) {
                injectAgentConfig(jsApiList, params, corpId, agentId)
            }
            else{
                wxWorkConfig(data, params, corpId, agentId)
            }
        } else {
            wxOaConfig(data)
        }
    }

    function wxOaConfig(data: JsSignature) {
        console.log("wxoa config...")
        wx.config({
            debug: WxLoginConfig.WxConfigDebug, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
            appId: data.appId,// 必填，企业微信的corpID
            timestamp: data.timestamp,// 必填，生成签名的时间戳
            nonceStr: data.nonceStr,// 必填，生成签名的随机串
            signature: data.signature, // 必填，签名，见 附录-JS-SDK使用权限签名算法
            jsApiList: jsApiList,// 必填，需要使用的JS接口列表，凡是要调用的接口都需要传进来
            success: function (res: any) {
                console.log("wxoa wx.config successfully")
                updateStatus(WxJsStatus.WxConfigDone)
            },
            fail: function (res: any) {
                console.log("wxoa wx.config fail: " + res.errMsg)
                updateStatus(WxJsStatus.WxConfigFail)

                if (res.errMsg.indexOf('function not exist') > -1) {
                    alert('版本过低请升级')
                }
            }
        });
    }
    function wxWorkConfig(data: JsSignature, params?: CorpParams, corpId?: string, agentId?: number) {
        console.log("wxwork config...")
        wx.config({
            beta: true,// 必须这么写，否则wx.invoke调用形式的jsapi会有问题
            debug: WxLoginConfig.WxWorkConfigDebug, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
            appId: data.appId,// 必填，企业微信的corpID
            timestamp: data.timestamp,// 必填，生成签名的时间戳
            nonceStr: data.nonceStr,// 必填，生成签名的随机串
            signature: data.signature, // 必填，签名，见 附录-JS-SDK使用权限签名算法
            jsApiList: jsApiList,// 必填，需要使用的JS接口列表，凡是要调用的接口都需要传进来
            success: function (res: any) {
                console.log("wxwork wx.config successfully")
                  //企业微信3.0.24以前的老版本（可通过企业微信UA判断版本号），
                //在调用wx.agentConfig之前，必须确保先成功调用wx.config
                
                updateStatus(WxJsStatus.WxConfigDone)
            },
            fail: function (res: any) {
                console.log("wxwork wx.config fail: " + res.errMsg)
                updateStatus(WxJsStatus.WxConfigFail)

                if (res.errMsg.indexOf('function not exist') > -1) {
                    alert('企业微信版本过低，请升级')
                }
            },
            complete: function(){//接口调用完成时执行的回调函数，无论成功或失败都会执行。
                console.log("wxwork wx.config: complete")
            },
            cancel:function(){//用户点击取消时的回调函数，仅部分有用户取消操作的api才会用到。
                console.log("wxwork wx.config: cancel")
            }, 
            trigger: function(){// 监听Menu中的按钮点击时触发的方法，该方法仅支持Menu中的相关接口
                console.log("wxwork wx.config: trigger")
            } 
        })
    }


    function injectAgentConfig(jsapiList: string[], params?: CorpParams, corpId?: string, agentId?: number) {
        console.log("injectAgentConfig...")
        const get = UseCacheConfig.request?.get
        if (!get) {
            console.warn("useWxJsSdk: not config UseCacheConfig.request?.get?")
            return
        }
        if (!corpId || !agentId) {
            console.log("no corpId or agentId, ignore injectAgentConfig")
            return
        }

        get("/api/wx/work/jssdk/signature", { ...params, "type": "agent_config", url: currentHost() + "/" }) //后端签名依赖于Referer，但index.html中禁用了，故明确传递过去
            .then(res => {
                //setStatus(WxJsStatus.SDKInitializing)
                const box: DataBox<JsSignature> = res.data
                if (box.code === CODE.OK) {
                    const data = getDataFromBox(box)
                    if (data) {
                        //https://work.weixin.qq.com/api/doc/90000/90136/90515
                        //config注入的是企业的身份与权限，而agentConfig注入的是应用的身份与权限。尤其是当调用者为第三方服务商时，
                        //通过config无法准确区分出调用者是哪个第三方应用，而在部分场景下，又必须严谨区分出第三方应用的身份，
                        //此时即需要通过agentConfig来注入应用的身份信息。
                        //调用wx.agentConfig之前，必须确保先成功调用wx.config. 
                        //注意：从企业微信3.0.24及以后版本（可通过企业微信UA判断版本号），无须先调用wx.config，可直接wx.agentConfig.
                        //仅部分接口才需要调用agentConfig，需注意每个接口的说明
                        wx.agentConfig({
                            corpid: corpId, // 必填，企业微信的corpid，必须与当前登录的企业一致
                            agentid: agentId, // 必填，企业微信的应用id （e.g. 1000247） ISV模式下不能返回agentId
                            timestamp: data.timestamp, // 必填，生成签名的时间戳
                            nonceStr: data.nonceStr, // 必填，生成签名的随机串
                            signature: data.signature,// 必填，签名，见附录-JS-SDK使用权限签名算法
                            jsApiList: jsapiList, //必填
                            success: function (res: any) {
                                console.log("wx.agentConfig successfully")
                                updateStatus(WxJsStatus.WxWorkAgentConfigDone)
                            },
                            fail: function (res: any) {
                                console.log("wx.agentConfig failed: res=" + JSON.stringify(res))
                                updateStatus(WxJsStatus.WxWorkAgentConfigFail)
                                
                                if (res.errMsg.indexOf('function not exist') > -1) {
                                    alert('版本过低请升级')
                                }
                            }
                        });
                    } else {
                        console.log("got JsSignature is null, please check backend config correct")
                    }
                } else {
                    console.log("got JsSignature is null, please check backend whether enable jsAgentTicket")
                }
            }).catch(err => {
                const msg = err.message
                console.warn(msg)
                updateStatus(WxJsStatus.RequestErr)
            })
    }

    return { status, networkType }
}


