
import React, { useState } from 'react';

import { cachedPost, StorageType } from "@rwsbillyang/usecache";


import { SysAccountAuthBean } from './datatype/AuthBean';
import { myAlert, gotoUrl } from './PortLayer';
import { WebAppLoginHelper } from './WebAppLoginHelper';
import { WxAuthHelper } from './WxOauthHelper';
import { Loading, Page, WeButton } from './WeUIComponents';

export const UserPwdLoginPage: React.FC = (props: any) => {
    const [username, setUsername] = useState<string>();
    const [password, setPassword] = useState<string>();
    const [loginSuccess, setLoginSuccess] = useState(false);
    const loginParam = WebAppLoginHelper.getLoginParams()
    const from = loginParam?.from // /wx/webAdmin/login?from=/wx/admin/home

    const signIn = () => {
        if (!username || !password) {
            myAlert("请输入用户名和密码")
            return
        }

        cachedPost<SysAccountAuthBean>(`/api/u/login`,
            (data) => {
                const authStorageType = loginParam?.authStorageType || StorageType.BothStorage
                WxAuthHelper.saveAuthBean(false, data, authStorageType)
                if (from) {
                    console.log("jump to from=" + from)
                    gotoUrl(from)  //window.location.href = from 
                    //window.location.href = from //navigate跳不过去，改用此行
                    setLoginSuccess(true)
                } else
                    myAlert("登录成功，请自行打开管理页面")
            },
            { name: username, pwd: password })
    }

    return (loginSuccess ?
        <Loading text="跳转中..."/>
        :<Page>
            <div className="weui-msg">
                <div className="weui-msg__text-area">
                    <h2 className="weui-msg__title">用户登录</h2>
                    <p className="weui-msg__desc">请输入用户名和密码</p>

                    <p style={{ paddingTop: 20 }}>
                        <div className="weui-cells weui-cells_form">
                            <div className="weui-cell">
                                <div className="weui-cell__hd"><label className="weui-label">用户名</label></div>
                                <div className="weui-cell__bd">
                                    <input className="weui-input" value={username || ''} placeholder="请输入用户名"
                                        onInput={(e) => {
                                            const target = e.target as HTMLInputElement
                                            setUsername(target.value);
                                        }} />
                                </div>
                            </div>
                            <div className="weui-cell">
                                <div className="weui-cell__hd"><label className="weui-label">密码</label></div>
                                <div className="weui-cell__bd">
                                    <input className="weui-input" type="password" value={password || ''}
                                        onInput={(e) => {
                                            const target = e.target as HTMLInputElement
                                            setPassword(target.value);
                                        }} />
                                </div>
                            </div>
                        </div>
                    </p>
                </div>
                <div className="button-sp-area">
                    <WeButton name="登录" type="primary" onClick={signIn}/>
                </div>
                <div className="weui-msg__extra-area">
                    <div className="weui-footer">
                        <p className="weui-footer__text">Copyright &copy; 2022 版权所有</p>
                    </div>
                </div>
            </div>
        </Page>)
}
