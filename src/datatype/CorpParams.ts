/**
 * 从url中提取路径中的参数, 或者哪个企业微信的agent
 * 用于：
 * （1）构建cacheKey
 * （2）传递url的query参数
 * （3）某些地方向后端发出请求时的参数
 */
 export interface CorpParams{
    appId?: string, //公众号 appId
    corpId?: string, //企业微信 corpId
    suiteId?: string,
    agentId?: number
}