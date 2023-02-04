import React from 'react';


import { Page } from './PortLayer';


const ErrorPage = (props: any) => (
    <Page>
        <div className="weui-msg">
            <div className="weui-msg__icon-area"><i className="weui-icon-warn weui-icon_msg"></i></div>
            <div className="weui-msg__text-area">
                <h2 className="weui-msg__title">出错了</h2>
                <p className="weui-msg__desc">{props.msg}</p>
            </div>
        </div>
    </Page>
)


export default ErrorPage
