import React from 'react';


import {Page} from './PortLayer';


const ErrorPage = (props: any) => (
    <Page title="Error" subTitle="something wrong">
            {props.msg}
    </Page>
)


export default ErrorPage
