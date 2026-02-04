import { defineOverridesPreferences } from '@vben/preferences';

import { getRuntimeConfig } from './utils/runtime-config';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 * 
 * 注意：此函数在 main.ts 的 initApplication 中调用，
 * 在调用时 loadRuntimeConfig() 已经完成，因此 getRuntimeConfig() 会返回已加载的配置。
 */
export function getOverridesPreferences() {
  return defineOverridesPreferences({
    // overrides
    app: {
      /**
       * 不要动这里  后端路由模式
       */
      accessMode: 'backend',
      /**
       * 不需要refresh token 由后端处理
       */
      enableRefreshToken: false,
      /**
       * 这里可以设置默认头像 url链接或vite导入的图片链接
       */
      // defaultAvatar: '',
      /**
       * 应用标题从运行时配置文件加载
       * 可以在打包后修改 public/app-config.json 文件来更改站点名称
       */
      name: getRuntimeConfig().title,
      /**
       * 不支持modal模式 需要改动的地方太多
       * 1. 正常重新登录后不会再触发接口请求 即触发登录超时的页面为空数据
       * 2. 切换租户登录后不会重新加载菜单
       */
      // loginExpiredMode: 'modal',
    },
    footer: {
      /**
       * 不显示footer
       */
      enable: false,
    },
    tabbar: {
      /**
       * 标签tab 持久化 关闭
       */
      persist: false,
      // styleType: 'card',
    },
    theme: {
      /**
       * 浅色sidebar
       */
      semiDarkSidebar: false,
      /**
       * 圆角大小 换算比例为1.6px = 0.1radius
       * 这里为6px 与antd保持一致
       */
      radius: '0.375',
    },
    /**
     * !!! 更改配置后请清空浏览器缓存
     * 在这里更换logo
     * source可选值：
     * 1. 本地public目录下的图片 需要加上/ 比如：/logo.png
     * 2. 网络图片链接
     * 3. vite导入的图片 import xxx from 'xxx.png'
     *
     * !!! 更改配置后请清空浏览器缓存
     */
    // logo: {
    //   enable: true,
    //   source: '',
    // },
  });
}
