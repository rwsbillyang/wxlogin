
import React, { useEffect, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

import { cachedGet, CODE, currentHref, DataBox, getDataFromBox, serializeObject, StorageType } from "@rwsbillyang/usecache";

import QRCode from 'qrcode.react';

import 'weui'; //https://www.kancloud.cn/ywfwj2008/weui/274515
import { WxLoginConfig } from './Config';
import { WxOaAccountAuthBean, WxWorkAccountAuthBean } from './datatype/AuthBean';
import { LoginParam } from './datatype/LoginParam';
import { NeedUserInfoType } from './datatype/NeedUserInfoType';
import { gotoUrl, myAlert, Page, toast } from './PortLayer';
import { rolesNeededByPath } from './securedRoute';
import { pageCenter, pageCenter3 } from './style';
import { parseUrlQuery } from './utils';
import { WebAppLoginHelper } from './WebAppLoginHelper';
import { isWeixinBrowser, isWxWorkBrowser } from './wxJsSdkHelper';
import { saveValue, WxAuthHelper } from './WxOauthHelper';

export const scanQrcodeIdKey = "ScanQrcodeIdKey"

//缩短编码, PC端将参数编码到二维码中，手机扫码解析出参数，然后恢复LoginParam corpParam
interface ShrinkedLoginParam {
    id: string //socket Session id
    p0?: string // owner 用于判断用户设置是否获取用户信息
    p1?: string //appId 
    p2?: string //corpId
    p3?: string // suiteId
    p4?: string // agentId
    t1: number //needUserInfo
    t2: number  //authStorageType
}
/**
 * 收到确认显示二维码后，得到一个特殊的id，编码到二维码中，此id将在手机扫码登录时获取，
 * 并登录时提交给后台，后台根据此找到对应的socket的session，从而发消息给PC，通知登录成功
 * PC上显示二维码：wssocket建立连接后，将确认页面编码成二维码，
 * 
 * https://github.com/robtaussig/react-use-websocket
 * npm install react-use-websocket
 * 
 * https://wx.niukid.com/#!/wx/scanLogin/show?corpId=ww5f4c472a66331eeb&agentId=1000006&from=/wx/admin/home
 * https://wx.niukid.com/#!/wx/scanLogin/show?appId=xxxx&from=/wx/admin/home
 * https://wx.niukid.com/#!/wx/scanLogin/show?corpId=ww5f4c472a66331eeb&agentId=1000006&from=/afterSale/ww5f4c472a66331eeb/admin/customer/list
 * 
 * @param props 
 * @returns 
 */
export const PcShowQrcodePage: React.FC = (props: any) => {
    const ELAPSE = 180

    const [err, setErr] = useState<string | undefined>()
    const [url, setUrl] = useState<string | undefined>()
    const [elapse, setElapse] = useState(ELAPSE)
    const [loginSuccess, setLoginSuccess] = useState(false);

    const loginParam = WebAppLoginHelper.getLoginParams()
    const from = loginParam?.from || props.from

  
    const host = window.location.host
    // This can also be an async getter function. See notes below on Async Urls.
    const socketUrl = 'wss://' + host + '/api/u/scanQrcodeLogin';
    const {
        sendMessage,
        lastMessage,
        readyState,
    } = useWebSocket(socketUrl);

    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];


    useEffect(() => {
        const timer = setInterval(() => {
            setElapse(elapse - 1);
        }, 1000);
        return () => clearInterval(timer);  // clearing interval
    });

    useEffect(() => {
        if ((!loginParam?.corpId || !loginParam?.agentId) && !loginParam?.suiteId && !loginParam?.appId) {
            setErr("no corpID=xxx&agentId=xxx or appId=xxx or suiteId=xxxx")
        } else if (readyState === ReadyState.OPEN) {
            sendMessage("getId") //发送消息
        }
    }, [readyState]);

    useEffect(() => {
        if (lastMessage !== null) {
            const text: string = lastMessage.data

            console.log("from remote get text=" + text)

            if (text.indexOf("id=") >= 0) { //得到回复
                const id = text.substring(3) //得到socket Session id

                //参数来自url路径中的query或者传递过来的props,准备再次编码传递给手机端
                const params: ShrinkedLoginParam = {
                    id,
                    p0: props.owner || loginParam?.owner,
                    p1: loginParam?.appId,
                    p2: loginParam?.corpId,
                    p3: loginParam?.suiteId,
                    p4: loginParam?.agentId,
                    t1: props.needUserInfo || loginParam?.needUserInfo,
                    t2: props.authStorageType || loginParam?.authStorageType
                }

                const s = WxLoginConfig.BrowserHistorySeparator
                if(s) "/"+s 
                const url = currentHref() +(s? "/"+s : "") + "/wx/scanLogin/confirm?" + serializeObject(params)

                console.log("qrcode url: " + url)

                setUrl(url)
                setTimeout(() => {
                    setUrl(undefined)
                    sendMessage("bye, id=" + id)
                }, ELAPSE * 1000)//3分钟后超时发送关闭连接消息，关闭二维码
            } else if (text.indexOf('cancel') >= 0) {
                console.log("cancel login")
                setErr("手机端取消了扫码登录")
                setUrl(undefined)
            } else if (text.indexOf("json=") >= 0) {//登录成功返回的认证字符串
                if (WxLoginConfig.EnableLog) console.log("get json authbean from remote: " + text)

                const json = text.substring(5)
                const box: DataBox<WxWorkAccountAuthBean | WxOaAccountAuthBean> = JSON.parse(json)
                if (box.code == CODE.OK) {
                    const authBean = getDataFromBox(box)
                    if (authBean) {
                        //默认使用BothStorage
                        const authStorageType = props.authStorageType || StorageType.BothStorage
                        //console.log("PcShowQrcodePage: authStorageType="+authStorageType)
                        WxAuthHelper.saveAuthBean(false, authBean, authStorageType)


                        const needRoles = rolesNeededByPath(from)
                        if (needRoles) {
                            if (WxAuthHelper.hasRoles(needRoles)) {
                                setLoginSuccess(true)
                                toast("登录成功！")
                                gotoUrl(from)
                                //f7.views.main.router.navigate(from)  //window.location.href = from
                            } else {
                                if (WxLoginConfig.EnableLog) console.log(`PcShowQrcodePage no permission: need ${needRoles}, but ${JSON.stringify(authBean)}`)
                                myAlert("没有权限，请联系管理员")
                            }
                        } else {
                            if (WxLoginConfig.EnableLog) console.log("navigate non-admin page: " + from)
                            setLoginSuccess(true)
                            toast("登录成功！")
                            gotoUrl(from)
                        }
                    } else {
                        console.log("no data in box: " + box.msg)
                    }
                } else {
                    console.log("not ok in box: " + box.msg)
                }
            } else {
                console.log("not support format, no json=: " + text)
            }
        }
    }, [lastMessage]);


    return (
        <Page>
            {loginSuccess ? <div>正在跳转...</div> : <div style={pageCenter}>
                <p>
                    {
                        url && <QRCode
                            id="qrCode"
                            value={url}
                            size={300} // 二维码的大小
                            fgColor="#000000" // 二维码的颜色
                        />
                    }</p>
                <p className='text-align-center'>{err ? err : (elapse > 0 ? elapse + "秒后失效" : "已失效！")}</p>
                <p className='text-align-center'>{url ? (<><span style={{ fontWeight: "bold" }}>{loginParam?.corpId ? "企业微信" : "微信"}</span>  <span>扫一扫登录</span> </>) : connectionStatus}</p>
            </div>}

        </Page>
    )
}

/**
 * 手机扫码登录，适合微信和企业微信扫码
 * 手机微信或企业微信打开confirm页面后，确认登录之后跳转到admin页面，导致登录授权跳转
 * 
 * /wx/scanLogin/confirm
 * @param props 
 * @returns 
 */
export const WxScanQrcodeLoginConfirmPage: React.FC = (props: any) => {
    const [err, setErr] = useState<string | undefined>()
    const query = parseUrlQuery()
    const id = query["id"] //socket Session id
    /*
    const params: ShrinkedLoginParam = {
                    id, 
                    p0: props.owner||query.owner,
                    p1: corpParams.appId, 
                    p2: corpParams.corpId,
                    p3: corpParams.suiteId, 
                    p4: corpParams.agentId,
                    t1: props.needUserInfo || query.needUserInfo, 
                    t2: props.authStorageType||query.authStorageType}
    */
    //         //qrcode url: https://wx.niukid.com/#!/wx/scanLogin/confirm?id=gf2EsRm4qc9TVFv2oUs&p2=ww5f4c472a66331eeb&p4=1000005&t2=3
    //PC端将这些参数编码到url二维码中，收件端扫码解析还原出来

    const loginParam: LoginParam = {
        appId: query["p1"], 
        corpId: query["p2"], 
        agentId: query["p4"], 
        suiteId: query["p3"] ,
        owner: query["p0"],
        needUserInfo: query["t1"] ? +query["t1"] : NeedUserInfoType.Force_Not_Need,
        authStorageType: query["t2"] ? +query["t2"] : StorageType.BothStorage
    }

    if ((!loginParam.corpId || !loginParam.agentId) && !loginParam.suiteId && !loginParam.appId) {
        console.log("no corpID=xxx&agentId=xxx or appId=xxx or suiteId=xxxx")
        setErr("no corpID=xxx&agentId=xxx or appId=xxx or suiteId=xxxx")
    } else {
        WebAppLoginHelper.setLoginParams(loginParam) //为WxScanQrcodeLoginDonePage做准备
    }

    if (isWxWorkBrowser()) {
        if (!loginParam.corpId && !loginParam.suiteId) {
            setErr("该应用为企业应用，请用企业微信扫一扫")
        }
    } else if (isWeixinBrowser()) {
        if (!loginParam.appId) {
            setErr("该应用为微信应用，请用微信扫一扫")
        }
    }

    const cancelLogin = () => {
        cachedGet("/api/u/cancelQrcodeLogin?id=" + id, () => { })
        return false
    }

    const confirmLogin = () => {
        if (err) {
            toast(err)
        } else {
            //清除登录缓存，避免因缓存而不进行远程登录
            WxAuthHelper.onSignout(false)
            WxAuthHelper.onSignout(true)

            saveValue(scanQrcodeIdKey, id) //设置扫码登录标志，导致微信登录时采用不同的登录参数


            //将导致微信或企业微信授权登录
            gotoUrl("/wx/scanLogin/user/done?" + serializeObject(loginParam))
        }
    }
    return (
        <Page>
            <div style={pageCenter3}>
                <p className="text-align-center">{err ? err : "您正在进行扫码登录"}</p>
                <div className="button-sp-area">
                    <a onClick={cancelLogin} role="button" className="weui-btn weui-btn_plain-default">取消登录</a>
                    <a onClick={confirmLogin} role="button" className="weui-btn weui-btn_plain-primary">确认登录</a>
                </div>
            </div>
        </Page>
    )
}

/**
 * 登录成功后返回
 * @param props 
 * @returns 
 */
export const WxScanQrcodeLoginDonePage: React.FC = (props: any) => {
    return (
        <Page>
            <div className="weui-msg">
                <div className="weui-msg__icon-area"><i className="weui-icon-success weui-icon_msg"></i></div>
                <div className="weui-msg__text-area">
                    <h2 className="weui-msg__title">扫码认证成功</h2>
                </div>
                <div className="weui-msg__opr-area">
                    <p className="weui-btn-area">
                        <a onClick={() => wx.closeWindow()} role="button" className="weui-btn weui-btn_primary">关闭</a>
                    </p>
                </div>
            </div>
        </Page>
    )
}

