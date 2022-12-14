import { Block, Link } from 'framework7-react';
import React from 'react';
import { WxLoginConfig } from './Config';
import { pageCenter } from './style';

//TODO: 仍旧跳转不过去
export const  JumpHandly: React.FC<{from?: string, msg?: string}> = ({from, msg}) => from? <Block style={pageCenter}>
    
    <p>登录成功，自动跳转中...</p>
    <p>若自动跳转失败，手动 <Link onClick={()=>
    window.location.href = "/" + WxLoginConfig.BrowserHistorySeparator  + from
    //f7.views.main.router.navigate(from)
    }>跳转</Link></p>
    
</Block> : <Block>{msg || "登录成功"}</Block>