import React, { useEffect, useState } from 'react';
import { Block, Button, f7, Page } from 'framework7-react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

import {CODE, DataBox, fetchWithLoading, getDataFromBox, StorageType, UseCacheConfig} from "@rwsbillyang/usecache"

import QRCode from 'qrcode.react';

import { saveValue, WxAuthHelper, WxGuestAuthHelper } from './WxOauthHelper'
import { WebAppHelper } from './WebAppHelper';
import { CorpParams } from './datatype/CorpParams';
import { LoginParam } from './datatype/LoginParam';
import { AuthBean } from './datatype/AuthBean';
import { isWeixinBrowser, isWxWorkBrowser } from './wxJsSdkHelper';
import { pageCenter, pageCenter3 } from './style';



//缩短编码, PC端将参数编码到二维码中，手机扫码解析出参数，然后恢复LoginParam corpParam
interface ShrinkedLoginParam {
    id: string //socket Session id
    p0?: string // owner 用于判断用户设置是否获取用户信息
    p1?: string //appId 
    p2?: string //corpId
    p3?: string // suiteId
    p4?: number // agentId
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
 * https://wx.niukid.com/#!/wx/scanLogin/show?corpId=ww5f4c472a66331eeb&agentId=1000006&from=/wx/super/admin/home
 * https://wx.niukid.com/#!/wx/scanLogin/show?appId=xxxx&from=/wx/super/admin/home
 * https://wx.niukid.com/#!/wx/scanLogin/show?corpId=ww5f4c472a66331eeb&agentId=1000006&from=/afterSale/ww5f4c472a66331eeb/admin/customer/list
 * 
 * @param props 
 * @returns 
 */
export const PcShowQrcodePage: React.FC<LoginParam> = (props: any) => {
    const ELAPSE = 180

    const [err, setErr] = useState<string | undefined>()
    const [url, setUrl] = useState<string | undefined>()
    const [elapse, setElapse] = useState(ELAPSE)


    const query = props.f7route.query
    const from = query.from || props.from

    //参数来自url路径中的query或者传递过来的props
    const corpParams: CorpParams = { corpId: props.id||query.corpId, agentId: props.agentId || query.agentId, suiteId: props.suiteId || query.suiteId, appId: props.appId || query.appId }

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
        if ((!corpParams.corpId || !corpParams.agentId) && !corpParams.suiteId && !corpParams.appId) {
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
                    p0: props.owner||query.owner,
                    p1: corpParams.appId, 
                    p2: corpParams.corpId,
                    p3: corpParams.suiteId, 
                    p4: corpParams.agentId,
                    t1: props.needUserInfo || query.needUserInfo, 
                    t2: props.authStorageType||query.authStorageType}

                const url = window.location.protocol + "//" + host + "/#!/wx/scanLogin/confirm?" + f7.utils.serializeObject(params)

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
                const json = text.substring(5)
                const box: DataBox<AuthBean> = JSON.parse(json)
                if (box.code == CODE.OK) {
                    const authBean = getDataFromBox(box)
                    if (authBean) {
                        //默认使用BothStorage
                        const authStorageType = props.authStorageType || StorageType.BothStorage
                        //console.log("PcShowQrcodePage: authStorageType="+authStorageType)
                        WxAuthHelper.onAuthenticated(authBean, authStorageType)
                        
                        //跳转到目的地
                        if(from){
                            //window.location.href = from 
                             props.f7router.navigate(from) 
                        } 
                        else f7.toast.show({text:"登录成功！"})
                    } else {
                        console.log(box.msg)
                    }
                }
            }
        }
    }, [lastMessage]);


    return (
        <Page name="scanQrcodelogin" >
            <Block style={pageCenter}>
                <p>
                    {
                        url && <QRCode
                            id="qrCode"
                            value={url}
                            size={300} // 二维码的大小
                            fgColor="#000000" // 二维码的颜色
                        />
                    }</p>
                <p className='text-align-center'>{err? err : (elapse > 0 ? elapse + "秒后失效" : "已失效！")}</p>
                <p className='text-align-center'>{url ? (<><span style={{ fontWeight: "bold" }}>{corpParams.corpId ? "企业微信" : "微信"}</span>  <span>扫一扫登录</span> </>) : connectionStatus}</p>
            </Block>

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
    const query = props.f7route.query
    const id = query.id //socket Session id
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
    //PC端将这些参数编码到url二维码中，收件端扫码解析还原出来
    const corpParams: CorpParams = {appId: query.p1, corpId: query.p2, agentId: query.p4, suiteId: query.p3}
    const loginParam: LoginParam = {
        appId: corpParams.appId || corpParams.corpId || corpParams.suiteId,
        owner: query.p0,
        needUserInfo: query.t1,
        authStorageType: query.t2
    }
    if ((!corpParams.corpId || !corpParams.agentId) && !corpParams.suiteId && !corpParams.appId) {
        console.log("no corpID=xxx&agentId=xxx or appId=xxx or suiteId=xxxx")
        setErr("no corpID=xxx&agentId=xxx or appId=xxx or suiteId=xxxx")
    } else {
        WebAppHelper.setCorpParams(corpParams) //为WxScanQrcodeLoginDonePage做准备
    }

    if (isWxWorkBrowser()) {
        if (!corpParams.corpId && !corpParams.suiteId) {
            setErr("该应用为企业应用，请用企业微信扫一扫")
        }
    } else if (isWeixinBrowser()) {
        if (!corpParams.appId) {
            setErr("该应用为微信应用，请用微信扫一扫")
        }
    }

    return (
        <Page name="confirmScanQrcodelogin" >
            <Block style={pageCenter3}>
                <p className="text-align-center">{err ? err : "您正在进行扫码登录"}</p>
                <p>
                    <Button large outline color="gray" onClick={() => {
                        const p = UseCacheConfig.request?.getWithouAuth
                        if (!p) {
                            console.warn("useWxJsSdk: not config UseCacheConfig.request?.getWithouAuth?")
                            return false
                        }else{
                            fetchWithLoading(() => p("/api/u/cancelQrcodeLogin?id=" + id), ()=>{})
                        }
                        return false
                    }}>取消登录</Button>
                </p>
                <p>
                    <Button large fill onClick={() => {
                        if(err){
                            f7.toast.show({text:err})
                        }else{
                            //清除登录缓存，避免因缓存而不进行远程登录
                            WxAuthHelper.onSignout()
                            WxGuestAuthHelper.onSignout()

                            saveValue("scanQrcodeId", id) //设置扫码登录标志，导致微信登录时采用不同的登录参数

                            //将导致微信或企业微信授权登录
                            f7.views.main.router.navigate("/wx/scanLogin/user/done?" + f7.utils.serializeObject(loginParam))
                        }
                        
                    }}>确认登录</Button>
                </p>
            </Block>
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
        <Page name="scanQrcodeLoginDone" >
            <Block style={pageCenter3}>
                <p className="text-align-center">扫码登录成功</p>
                <p>
                <Button large fill onClick={() => wx.closeWindow()}>关闭</Button>
                </p>
            </Block>
        </Page>
    )
}

