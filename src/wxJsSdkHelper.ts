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
    'onMenuShareTimeline',
    'onMenuShareAppMessage',
    'onMenuShareQQ',
    'onMenuShareWeibo',
    'onMenuShareQZone',
    'onMenuShareWeChat',
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
    'chooseWXPay',
    //'openProductSpecificView',
    //'addCard',
    //'chooseCard',
    //'openCard'
]

/**
 * 错误值越大，离正确结果越远
 */
export const WxJsStatus = {
    NotWeixin: -5,//最终状态
    RequestErr: -4,//最终状态
    ServerResponseErr_KO: -3,//最终状态
    ServerResponseErr_NO_DATA: -2,//最终状态
    WxInitErr: -1,//最终状态
    None: 0,
    SignatureLoading: 1,
    SDKInitializing: 2,
    Ready: 3,
    NetworkTypeLoaded: 4,//最终状态
    NetworkTypeLoadErr: 5 //最终状态
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
 * @param jsapiList 
 */
export function useWxJsSdk(jsapiList: string[] = defaultJsApiList) {
    const [status, setStatus] = useState(f7.data.wxJsStatus || WxJsStatus.None)
    const [networkType, setNetworkType] = useState<string | undefined>(CacheStorage.getItem(WxJsNtKey))

    useEffect(() => {
        if (!isWeixinOrWxWorkBrowser()) {
            setStatus(WxJsStatus.NotWeixin)
            f7.data.wxJsStatus = WxJsStatus.NotWeixin
            //saveItem(WxJsStatusKey, WxJsStatus.NotWeixin.toString())
            console.log("not in wx")
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

            const isWxWorkApp = WebAppHelper.isWxWorkApp()
            console.log("to getSignautre...isWxWorkApp=" + isWxWorkApp);

            const get = UseCacheConfig.request?.get
            if (!get) {
                console.warn("useWxJsSdk: not config UseCacheConfig.request?.get?")
                return false
            }
            let p: Promise<RequestResponse>
            //企业微信的jsSDK自定义分享不能在微信中正确设置，使用对应的公众号配置
            //因此：在微信中，就使用公众号的配置; 在企业微信中，就使用企业微信的配置
            if (isWxWorkApp && isWxWorkBrowser()) {//企业微信浏览器中
                if (!corpId || !agentId) {
                    console.warn("no corpId=" + corpId + " or agentId=" + agentId)
                }
                p = get("/api/wx/work/jssdk/signature", { ...params, url: currentHost() + "/" }) //后端签名依赖于Referer，但index.html中禁用了，故明确传递过去
            } else if (isWeixinBrowser()) {//微信浏览器中
                if (!appId) {
                    console.warn("no appId=" + appId)
                }
                p = get("/api/wx/oa/jssdk/signature", { appId: appId, url: currentHost() + "/" }) //后端签名依赖于Referer，但index.html中禁用了，故明确传递过去
            } else {
                console.warn("no in weixin browser or wx work browser?")
                return false
            }

            p.then(res => {
                f7.data.wxJsStatus = WxJsStatus.SDKInitializing
                setStatus(WxJsStatus.SDKInitializing)

                const box: DataBox<JsSignature> = res.data
                if (box.code === CODE.OK) {
                    const data = getDataFromBox(box)
                    if (data) {
                        wx.ready(() => {
                            f7.data.wxJsStatus = WxJsStatus.Ready
                            setStatus(WxJsStatus.Ready)

                            console.log("wx.ready...")
                            wx.getNetworkType({
                                success: function (res: any) {
                                    const networkType = res.networkType
                                    console.log("get networkType=" + networkType)
                                    setNetworkType(networkType)
                                    if (networkType) CacheStorage.saveItem(WxJsNtKey, networkType)

                                    f7.data.wxJsStatus = WxJsStatus.NetworkTypeLoaded
                                    setStatus(WxJsStatus.NetworkTypeLoaded)
                                },
                                fail: function () {
                                    //不关心获取网络类型错误
                                    f7.data.wxJsStatus = WxJsStatus.NetworkTypeLoadErr
                                    setStatus(WxJsStatus.NetworkTypeLoadErr)
                                    console.log("fail to get networkType")
                                }
                            })

                            // if(!DEBUG){
                            //     // 隐藏菜单
                            //     wx.hideMenuItems({
                            //         menuList: [ 'menuItem:refresh', 'menuItem:copyUrl', 'menuItem:openWithSafari'] // 要隐藏的菜单项
                            //     });
                            // }

                        });

                        wx.error((res: any) => {
                            console.error('wx error', res);
                            f7.data.wxJsStatus = WxJsStatus.WxInitErr
                            setStatus(WxJsStatus.WxInitErr)
                            //saveItem(WxJsStatusKey, WxJsStatus.WxInitErr.toString()) //注释掉，目的在于下次可以尝试
                        });

                        wxConfig(isWxWorkApp, data, params, corpId, agentId, jsapiList)
                    } else {
                        const msg = "data is null: " + JSON.stringify(box)
                        console.warn(msg)
                        f7.data.wxJsStatus = WxJsStatus.ServerResponseErr_NO_DATA
                        setStatus(WxJsStatus.ServerResponseErr_NO_DATA)

                    }
                } else {
                    const msg = JSON.stringify(box)
                    f7.data.wxJsStatus = WxJsStatus.ServerResponseErr_KO
                    setStatus(WxJsStatus.ServerResponseErr_KO)
                    console.warn(msg)
                }
            }).catch(err => {
                const msg = err.message
                console.warn(msg)
                f7.data.wxJsStatus = WxJsStatus.RequestErr
                setStatus(WxJsStatus.RequestErr)
            })
        } else {
            //spa webapp, not need update signature for every url
            console.log("status=" + status + ",ignore getSignature,  nt=" + networkType)
        }
        return false
    }

    return { status, networkType }
}



//JS-SDK:  https://open.work.weixin.qq.com/api/doc/10029  
function wxConfig(isWxWorkApp: boolean, data: JsSignature, params?: CorpParams, corpId?: string, agentId?: number, jsapiList: string[] = defaultJsApiList) {
    wx.checkJsApi({
        jsApiList: jsapiList, // 需要检测的JS接口列表
        success: function () {
            // 以键值对的形式返回，可用的api值true，不可用为false
            // 如：{"checkResult":{"chooseImage":true},"errMsg":"checkJsApi:ok"}
            //console.log(res)
            console.log("wx.checkJsApi done")
        }
    });
    if (isWxWorkApp && isWxWorkBrowser()) {//企业微信浏览器中
        console.log("wxwork config...")
        wx.config({
            beta: true,// 必须这么写，否则wx.invoke调用形式的jsapi会有问题
            debug: WxLoginConfig.WxWorkConfigDebug, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
            appId: data.appId,// 必填，企业微信的corpID
            timestamp: data.timestamp,// 必填，生成签名的时间戳
            nonceStr: data.nonceStr,// 必填，生成签名的随机串
            signature: data.signature, // 必填，签名，见 附录-JS-SDK使用权限签名算法
            jsApiList: jsapiList,// 必填，需要使用的JS接口列表，凡是要调用的接口都需要传进来
            success: function (res: any) {
                console.log("wxwork wx.config successfully")
                if (WxLoginConfig.WxWorkConfigEnableAgentConfig) {
                    injectAgentConfig(params, corpId, agentId, jsapiList)
                }
            },
            fail: function (res: any) {
                console.log("wxwork wx.config fail: " + res.errMsg)
                if (res.errMsg.indexOf('function not exist') > -1) {
                    alert('版本过低请升级')
                }
            }
        })
    } else if (isWeixinBrowser()) {//微信浏览器中
        console.log("wxoa config...")
        wx.config({
            debug: WxLoginConfig.WxConfigDebug, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
            appId: data.appId,// 必填，企业微信的corpID
            timestamp: data.timestamp,// 必填，生成签名的时间戳
            nonceStr: data.nonceStr,// 必填，生成签名的随机串
            signature: data.signature, // 必填，签名，见 附录-JS-SDK使用权限签名算法
            jsApiList: jsapiList,// 必填，需要使用的JS接口列表，凡是要调用的接口都需要传进来
            success: function (res: any) {
                console.log("wxoa wx.config successfully")
                if (WxLoginConfig.WxWorkConfigEnableAgentConfig) {
                    injectAgentConfig(params, corpId, agentId, jsapiList)
                }
            },
            fail: function (res: any) {
                console.log("wxoa wx.config fail: " + res.errMsg)
                if (res.errMsg.indexOf('function not exist') > -1) {
                    alert('版本过低请升级')
                }
            }
        });
    }
}


function injectAgentConfig(params?: CorpParams, corpId?: string, agentId?: number, jsapiList: string[] = defaultJsApiList) {
    const get = UseCacheConfig.request?.get
    if (!get) {
        console.warn("useWxJsSdk: not config UseCacheConfig.request?.get?")
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
                        },
                        fail: function (res: any) {
                            if (res.errMsg.indexOf('function not exist') > -1) {
                                alert('版本过低请升级')
                            }
                        }
                    });
                }
            }
        }).catch(err => {
            const msg = err.message
            console.warn(msg)
            //setStatus(WxJsStatus.RequestErr)
        })
}



export const showUserDetail = (id: string, messageType: string) => {
    let type: number = -1
    if ("received" === messageType) type = 2
    else if (messageType === "sent") type = 1
    if (type > 0) {
        wx.invoke('openUserProfile', {
            "type": type, //1表示该userid是企业成员，2表示该userid是外部联系人
            "userid": id //可以是企业成员，也可以是外部联系人
        }, function (res: any) {
            if (res.err_msg != "openUserProfile:ok") {
                //错误处理
                console.warn(res.err_msg)
            }
        });
    } else {
        console.warn("not support type=" + type)
    }

}



export function loadJS(url: string, callback?: () => void) {
    const script: HTMLScriptElement = document.createElement('script')
    const fn = callback || function () { };
    script.type = 'text/javascript';

    //IE
    // if (script.readyState) {
    //     script.onreadystatechange = function () {
    //         if (script.readyState == 'loaded' || script.readyState == 'complete') {
    //             script.onreadystatechange = null;
    //             fn();
    //         }
    //     };
    // } else {
    //其他浏览器
    script.onload = function () {
        console.log("load done: " + url)
        fn();
    };
    // }
    script.src = url;
    document.getElementsByTagName('head')[0].appendChild(script);
}