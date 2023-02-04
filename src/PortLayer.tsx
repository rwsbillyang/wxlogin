import { UseCacheConfig } from '@rwsbillyang/usecache';


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

// export const useGotoUrl2 = (url: string) => {
//     // const { navigate } = useRouter()
//     //navigate(url)
//     window.location.href = url
// }



