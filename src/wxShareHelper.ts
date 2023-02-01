import { currentHref } from "@rwsbillyang/usecache"
import { WxLoginConfig } from "./Config"
import { WxJsStatus } from "./wxJsSdkHelper"

export interface ShareInfo {
    link: string,
    title: string,
    brief?: string,
    img?: string
}

 //如果index.html中设置  <meta name="referrer" content="no-referrer" />，将导致微信js不能正确注入，故须使用：no-referrer-when-downgrade
//并且确保当前链接是https，而抖音视频链接降级为http
//2022.09 视频源被强制到https，此方案失效，改成：<meta name="referrer" content="same-origin" />
//same-origin：对于同源的请求会发送引用地址，但是对于非同源请求则不发送引用地址信息
//export const schemaDowngrade = (url?: string) => url?.replace("https:","http:") 

// const removeSchema = (img?: string) => {
//     if(img) return img.replace(/https?:/,"") 
//     else return undefined
// }
/**
 * 微信分享的图片地址必须带有http，而img图片地址格式可能各异
 * @param url 可能有http开头的（admin后台直接复制图片地址），某些//开头的 或者 /px/img?url=
 */
 function addSchema(url?: string){
    if(!url || url.indexOf("http") === 0) return url
    if(url.indexOf("//") === 0)return window.location.protocol + url
    
    return currentHref()+url
}

/**
 * 设置转发时的自定义分享信息 依赖于wxInit初始化结束、click返回的objectId、article查询完毕
 * 初始化转发自定义分享信息，article为空则直接返回
 * 
 * const sep = (WxLoginConfig.BrowserHistorySeparator) ? WxLoginConfig.BrowserHistorySeparator + "/" : ""
 * const link = `${currentHost()}/${sep}n/d/${mId}${WebAppHelper.getCorpParamsUrlQuery('?')}`
 */
 export function setRelayShareInfo(status: number, shareInfo: ShareInfo) {
    if (status > WxJsStatus.Ready) {
        updateWxShareInfo( { ...shareInfo, img: addSchema(shareInfo.img)})
    } else {
       if(WxLoginConfig.EnableLog) console.log("ignore setRelayShareInfo, status=" + status)
    }
}


/**
 * 
 * @param uId 系统注册用户id
 * @param material 素材信息
 * @param shareBean 待提交的分享信息 shareBean与relayBean只有一个非空
 * @param relayBean 待提交的中继转发信息 shareBean与relayBean只有一个非空
 */
function updateWxShareInfo(shareInfo: ShareInfo) {
    if(WxLoginConfig.EnableLog) console.log("updateWxShareInfo, shareInfo=" + JSON.stringify(shareInfo))
    // //自定义“分享给朋友”及“分享到QQ”按钮的分享内容（1.4.0）
    //https://www.cnblogs.com/jin-zhe/p/11975240.html
    // wx.updateAppMessageShareData({
    //     title: shareInfo.title, // 分享标题
    //     desc: shareInfo.brief, // 分享描述
    //     link: shareInfo.link + `&${ShareQueryKeys.to}=${ShareType.AppMessage}`, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
    //     imgUrl: shareInfo.img, // 分享图标
    //     success: shareInfo.onShareSuccess(ShareType.AppMessage) 
    // });
    // //自定义“分享到朋友圈”及“分享到QQ空间”按钮的分享内容（1.4.0）
    // wx.updateTimelineShareData({
    //     title: shareInfo.title, // 分享标题
    //     link: shareInfo.link + `&${ShareQueryKeys.to}=${ShareType.Timeline}`, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
    //     imgUrl: shareInfo.img, // 分享图标
    //     success: shareInfo.onShareSuccess(ShareType.Timeline) 
    // });

    
    //分享到朋友圈（即将废弃）
    //企业微信中，则是分享到微信朋友圈
    wx.onMenuShareTimeline({
        title: shareInfo.title,
        link: shareInfo.link,
        imgUrl: shareInfo.img,
        success: () => { console.log("success to onMenuShareTimeline"); },
        fail: function () { console.log("fail to onMenuShareTimeline"); },
        cancel: function () {  console.log("cancel onMenuShareTimeline"); },
        trigger:function () {  console.log("trigger onMenuShareTimeline"); }
    });



//分享给朋友（即将废弃）
wx.onMenuShareAppMessage({
    title: shareInfo.title,
    desc: shareInfo.brief,
    link: shareInfo.link,
    imgUrl: shareInfo.img,
    success: () => { console.log("success to onMenuShareAppMessage"); },
    fail: function () { console.log("fail to onMenuShareAppMessage"); },
    cancel: function () { console.log("cancel onMenuShareAppMessage"); },
    trigger:function () {  console.log("trigger onMenuShareAppMessage"); }
});
//获取“分享到QQ”按钮点击状态及自定义分享内容接口（即将废弃）
wx.onMenuShareQQ({
    title: shareInfo.title,
    desc: shareInfo.brief,
    link: shareInfo.link,
    imgUrl: shareInfo.img,
    success: () => { console.log("success to onMenuShareQQ"); },
    fail: function () { console.log("fail to onMenuShareQQ"); },
    cancel: function () {  console.log("cancel onMenuShareQQ"); },
    trigger:function () {  console.log("trigger onMenuShareQQ"); }
});

//获取“分享到QQ空间”按钮点击状态及自定义分享内容接口（即将废弃）
wx.onMenuShareQZone({
    title: shareInfo.title,
    desc: shareInfo.brief,
    link: shareInfo.link,
    imgUrl: shareInfo.img,
    success: () => { console.log("success to onMenuShareQZone"); },
    fail: function () { console.log("fail to onMenuShareQZone"); },
    cancel: function () {  console.log("cancel onMenuShareQZone"); },
    trigger:function () {  console.log("trigger onMenuShareQZone"); }
});

wx.onMenuShareWeibo({
    title: shareInfo.title,
    desc: shareInfo.brief,
    link: shareInfo.link,
    imgUrl: shareInfo.img,
    success: () => { console.log("success to onMenuShareWeibo"); },
    fail: function () { console.log("fail to onMenuShareWeibo"); },
    cancel: function () {  console.log("cancel onMenuShareWeibo"); },
    trigger:function () {  console.log("trigger onMenuShareWeibo"); }
});

    //显示右上角菜单接口
    //wx.showOptionMenu();  
}




