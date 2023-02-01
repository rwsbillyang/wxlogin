
import React, { useState } from 'react';

import { cachedPost, StorageType } from "@rwsbillyang/usecache";


import { SysAccountAuthBean } from './datatype/AuthBean';
import { gotoUrl, myAlert, Page } from './PortLayer';
import { WebAppLoginHelper } from './WebAppLoginHelper';
import { WxAuthHelper } from './WxOauthHelper';

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

        return (loginSuccess ? <div>跳转中...</div> :
            <Page>
                <div className="weui-form">
                    <div className="weui-form__text-area">
                        <h2 className="weui-form__title">用户登录</h2>

                        <div className="weui-form__control-area">
                            <div className="weui-cells__group weui-cells__group_form">
                                <div className="weui-cells">
                                    <label htmlFor="js_input1" className="weui-cell weui-cell_active">
                                        <div className="weui-cell__hd"><span className="weui-label">用户名</span></div>
                                        <div className="weui-cell__bd">
                                            <input className="weui-input" id="js_input1" value={username || ''}
                                                onInput={(e) => {
                                                    //const target = e.target as HTMLInputElement
                                                    setUsername(e.target.value);
                                                }} />
                                        </div>
                                    </label>

                                    <label htmlFor="js_input3" className="weui-cell weui-cell_active">
                                        <div className="weui-cell__hd"><span className="weui-label">密码</span></div>
                                        <div className="weui-cell__bd">
                                            <input id="js_input3" type="password" className="weui-input" value={password || ''}
                                                onInput={(e) => {
                                                    setPassword(e.target.value);
                                                }} />
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="weui-form__opr-area">
                            <a role="button" className="weui-btn weui-btn_primary" onClick={signIn}>登录</a>
                        </div>

                        <div className="weui-form__extra-area">
                            <div className="weui-footer">
                                <p className="weui-footer__text">Copyright © 版权所有 2021 </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Page>)
    }
