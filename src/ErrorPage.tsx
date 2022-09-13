import React from 'react';

import { Page, Navbar, Block } from 'framework7-react';
import { WxLoginConfig } from './Config';



const ErrorPage = (props: any) => (
    <Page >
        {WxLoginConfig.hasNavBar ? <Navbar title="出错了" backLink={WxLoginConfig.TextBack} /> : null}
        <Block>
            {props.msg}
        </Block>
    </Page>
)


export default ErrorPage
