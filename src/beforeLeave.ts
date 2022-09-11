import { Router } from "framework7/types";
import { WxLoginConfig } from "./Config";


//https://forum.framework7.io/t/beforeleave-in-svelte/11107/4
export function beforeLeave(ctx: Router.RouteCallbackCtx) {
    if (ctx.app.data && ctx.app.data.dirty) {
      ctx.app.dialog.confirm('您的修改尚未保存，确定要放弃修改吗？',
        () => { ctx.app.data.dirty = false; ctx.resolve() }, //ok
        () => {//cancel
          ctx.reject()
          const url = WxLoginConfig.BrowserHistorySeparator + ctx.from.url
          history.pushState(history.state, '', url);
          ctx.router.allowPageChange = true;
        })
    } else
      ctx.resolve()
  }
  