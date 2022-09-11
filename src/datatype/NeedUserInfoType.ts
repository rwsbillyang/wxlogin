/**
 * 前后端共同协调完成下列策略，后端已在ktorKit中实现
 * 若已有登录信息，NeedIfNo...NeedByUserSettings则不生效，因为发现已登录则跳过直接进入
 * */
 export const NeedUserInfoType = {
    Force_Not_Need : 0, // 明确不需要
    NeedIfNo : 1, //尽量不获取，有fan记录（不管有没有头像或昵称）就不获取，没有fan记录时则获取
    NeedIfNoNameOrImg : 2, //尽量不获取，有fan记录、且有头像和昵称则不获取，但没有头像或名称获取
    NeedByUserSettings : 3, //由后端用户配置是否获取，后端用户 由参数owner指定
    ForceNeed : 4 //直接进入step2，用户授权获取信息操作
  }