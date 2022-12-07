import { WxLoginConfig } from "./Config";
import { isWeixinBrowser, isWxWorkBrowser } from "./wxJsSdkHelper";

/**
 * 加载js文件
 */
export function loadJS(url: string, callback?: ()=>void) {
    if(WxLoginConfig.EnableLog) console.log("loadJS: "+ url)
    var script = document.createElement('script')
    script.type = 'text/javascript';
    script.onload = function () {
        console.log("load done: " + url)
        if(callback)callback();
    };
    script.src = url;
    document.getElementsByTagName('head')[0].appendChild(script);
}

/**
 * bug: 当query参数在 #! 分隔的路径后面时无法解析处理
 */
export function getQueryString(name: string) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    let r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return decodeURIComponent(r[2]);
    };
    return null;
}

export function enableVConsole(enable: boolean){
    localStorage.setItem("vconsole", enable ? "1" : "0")
}
export function isVConsoleEnabled(){
    return localStorage.getItem("vconsole") === "1"
}
/**
 * 加载微信或企业微信js sdk
 * @params enableVConsoleMode 0 总是不加载vconsole  2：总是加载vconsole 1 取决于localstorage或query参数
 */
export function tryLoadWxJs(enableVConsoleMode: 0 | 1 | 2) {

    var protocol = window.location.protocol
    if (isWeixinBrowser()) {
        if(WxLoginConfig.EnableLog) console.log("to load: jweixin-1.6.0.js...")
        loadJS(protocol + "//res.wx.qq.com/open/js/jweixin-1.6.0.js")
    } else if (isWxWorkBrowser()) {
        if(WxLoginConfig.EnableLog) console.log("to load: jweixin-1.2.0.js and jwxwork-1.0.0.js ...")
        loadJS(protocol + "//res.wx.qq.com/open/js/jweixin-1.2.0.js")
        loadJS(protocol + "//open.work.weixin.qq.com/wwopen/js/jwxwork-1.0.0.js")
    } else {
        if(WxLoginConfig.EnableLog) console.log("tryLoadWxJs: not in wx, ignore")
    }

    //vconsole //cdn.bootcdn.net/ajax/libs/vConsole/3.11.2/vconsole.min.js
    //https://cdn.jsdelivr.net/npm/vconsole@latest/dist/vconsole.min.js
    if (enableVConsoleMode === 2 || (enableVConsoleMode === 1 && (isVConsoleEnabled() || getQueryString("vconsole") === '1'))){
        const url = protocol + "//cdn.jsdelivr.net/npm/vconsole@latest/dist/vconsole.min.js"
        console.log("try load vconsole@latest js...")
        loadJS(url, function () { 
            new VConsole(); 
            console.log("enable vconsole done!")
        })
    }
        

}