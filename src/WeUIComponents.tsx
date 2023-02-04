import React from "react";

import 'weui'; //https://www.kancloud.cn/ywfwj2008/weui/274515


export const Page = (props) => {
    const { spacing, children } = props;

    return (
        <div className={`page__bd ${spacing ? 'page__bd_spacing' : ''}`}>
            {children}
        </div>
    );
}

export const Loading: React.FC<{ text?: string }> = ({ text }) => <div className="weui-loadmore">
    <i className="weui-loading"></i>
    <span className="weui-loadmore__tips">{text || "加载中..."}</span>
</div>


export const LoadingToast: React.FC<{ text?: string }> = ({ text }) => <div id="loadingToast">
    <div className="weui-mask_transparent"></div>
    <div className="weui-toast">
        <i className="weui-loading weui-icon_toast"></i>
        <p className="weui-toast__content">{text}</p>
    </div>
</div>

export const OkMsg: React.FC<{ title: string, msg?: string }> = ({ title, msg }) => <div className="weui-msg">
    <div className="weui-msg__icon-area"><i className="weui-icon-success weui-icon_msg"></i></div>
    <div className="weui-msg__text-area">
        <h2 className="weui-msg__title">{title}</h2>
        <p className="weui-msg__desc">{msg}</p>
    </div>
</div>

export const ErrMsg: React.FC<{ title?: string, errMsg?: string }> = ({ title, errMsg }) => <div className="weui-msg">
    <div className="weui-msg__icon-area"><i className="weui-icon-warn weui-icon_msg"></i></div>
    <div className="weui-msg__text-area">
        <h2 className="weui-msg__title">{title || "出错了"}</h2>
        <p className="weui-msg__desc">{errMsg}</p>
    </div>
</div>

export const WeButton: React.FC<{
    name: string, type?: "primary" | "default" | "warn",
    plain?: boolean, mini?: boolean, disabled?: boolean,
    onClick?: () => void
}> = ({ name, type, plain, mini, disabled, onClick }) => {
    const t = (type || "default")
    let c = "weui-btn"
    if (mini) c += " weui-btn_mini"

    if (plain) {
        c += (" weui-btn_plain-" + t) //weui-btn_plain-primary
        if (disabled) c += " weui-btn_plain-disabled"//weui-btn_plain-disabled
    } else {
        c += (" weui-btn_" + t) //weui-btn_primary
        if (disabled) c += " weui-btn_disabled" //weui-btn_disabled
    }

    return <a role="button" onClick={onClick} className={c} style={{width: "62%"}}>{name}</a>
}



export const ErrorPage = () => (
    <Page>
       <ErrMsg />
    </Page>
)
