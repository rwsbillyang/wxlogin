
/***
 * 返回url中的query参数object，不提供参数url，则使用window.location.href
 * https://github.com/framework7io/framework7/blob/ce7a2dc21b29a05d6c782bd53a4155f542867d9c/src/core/shared/utils.js
 */
export function parseUrlQuery(url?: string) {
    const query: object = {};
    let urlToParse = url || window.location.href;
    let i;
    let params;
    let param;
    let length;
    if (typeof urlToParse === 'string' && urlToParse.length) {
      urlToParse = urlToParse.indexOf('?') > -1 ? urlToParse.replace(/\S*\?/, '') : '';
      params = urlToParse.split('&').filter((paramsPart) => paramsPart !== '');
      length = params.length;
  
      for (i = 0; i < length; i += 1) {
        param = params[i].replace(/#\S+/g, '').split('=');
        query[decodeURIComponent(param[0])] =
          typeof param[1] === 'undefined'
            ? undefined
            : decodeURIComponent(param.slice(1).join('=')) || '';
      }
    }
    return query;
  }

  /**
   * 返回url中或当前window.location.href中某个参数的值
   * @param paramKey 
   * @param url 
   * @returns 
   */
  export function getQueryString(paramKey: string, url?: string | undefined) {
    if (!url) {
        url = window.location.href
    }

    var index = url.indexOf(paramKey + "=");
    if (index == -1) {
        return "";
    }
    var getParamStr = url.slice(paramKey.length + index + 1);
    var nextparam = getParamStr.indexOf("&");
    if (nextparam != -1) {
        getParamStr = getParamStr.slice(0, nextparam);
    }
    return decodeURIComponent(getParamStr);
}

/**
 * 使用正则查找当前url中的query的某个参数的值
 * bug: 当query参数在 #! 分隔的路径后面时无法解析处理
 */
export function getQueryStringByRegx(name: string) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    let r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return decodeURIComponent(r[2]);
    };
    return null;
}



const random = (length: number, chars: string) => {
    var result: string = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

export const randomNumber = (length: number) => random(length, '0123456789')
export const randomAlphabet =  (length: number) => random(length, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
export const randomAlphabetNumber =  (length: number) => random(length, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')