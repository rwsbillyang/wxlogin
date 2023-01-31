import { UseCacheConfig } from '@rwsbillyang/usecache';
import React from 'react';
import { useRouter } from 'react-router-manage';

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
   const f = UseCacheConfig.request?.showLoading
   if(f) f(text) 
   else{
    console.log("TODO: showLoading")
   }
}

export const hideLoading = () => {
    const f = UseCacheConfig.request?.hideLoading
    if(f) f() 
    else{
     console.log("TODO: hideLoading")
    }
}

export const toast = (text: string) => {
    const f = UseCacheConfig.request?.showToast
    if(f) f(text) 
    else{
     console.log("TODO: hideLoading")
    }
}

export const myAlert = (text: string) => {
    alert(text)
}

export const gotoUrl = (url: string) => {
  //props.f7router.navigate
  //f7.views.main.router.navigate(from)  //window.location.href = from
  const {navigate} = useRouter()
  navigate(url)
}

