import { UseCacheConfig } from '@rwsbillyang/usecache';
//import { useRouter } from "react-router-manage";

export const showLoading = (text?: string) => {
    const f = UseCacheConfig?.showLoading
    if (f) f(text)
    else {
        console.log("TODO: showLoading")
    }
}

export const hideLoading = () => {
    const f = UseCacheConfig?.hideLoading
    if (f) f()
    else {
        console.log("TODO: hideLoading")
    }
}

export const toast = (text: string) => {
    const f = UseCacheConfig?.showToast
    if (f) f(text)
    else {
        console.log("TODO: hideLoading")
    }
}

export const myAlert = (text: string) => {
    alert(text)
}

export const gotoUrl = (url: string) => {
    // const { navigate } = useRouter() //gotoUrl的调用者一般都不不能调用hooks，故不能使用useRouter
    //navigate(url)
    window.location.href = url
}



