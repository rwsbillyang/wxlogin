
  //登录类型，与后端保持一致
  export const LoginType = {
    ACCOUNT: "account", //账户密码
    MOBILE: "mobile", // 验证码，暂不支持
    WECHAT: "wechat", //微信登录
    WXWORK: "wxWork", //企业微信登录
    SCAN_QRCODE: "scanQrcode" //扫码或企业微信扫码登录，根据指定的参数appId/corpId&agentId
  }