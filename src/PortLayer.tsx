import { UseCacheConfig } from '@rwsbillyang/usecache';
import React from 'react';

import 'weui'; //https://www.kancloud.cn/ywfwj2008/weui/274515

export const Page = (props) => {
    const {title, subTitle, spacing, className, children, footer} = props;

        return (
            <section className={`page ${className}`}>
                <div className="page__hd">
                    <h1 className="page__title">{title}</h1>
                    <p className="page__desc">{subTitle}</p>
                </div>
                <div className={`page__bd ${spacing ? 'page__bd_spacing' : ''}`}>
                    {children}
                </div>
                { footer ?
                <div className="page__ft">
                    {footer}
                </div> : false }
            </section>
        ); 
}

export const showLoading = (text?: string) => {
   const f = UseCacheConfig?.showLoading
   if(f) f(text) 
   else{
    console.log("TODO: showLoading")
   }
}

export const hideLoading = () => {
    const f = UseCacheConfig?.hideLoading
    if(f) f() 
    else{
     console.log("TODO: hideLoading")
    }
}

export const toast = (text: string) => {
    const f = UseCacheConfig?.showToast
    if(f) f(text) 
    else{
     console.log("TODO: hideLoading")
    }
}

export const myAlert = (text: string) => {
    alert(text)
}

export const gotoUrl = (url: string) => {
  window.location.href = url
}

