/**
 * 运行时应用配置
 * 该配置可以在打包后的应用中直接修改 /app-config.json 文件
 */
export interface AppRuntimeConfig {
  /**
   * 应用标题
   */
  title: string;
}

const DEFAULT_TITLE = 'TTShang';

let runtimeConfig: AppRuntimeConfig | null = null;
let loadingPromise: Promise<AppRuntimeConfig> | null = null;

/**
 * 加载运行时配置
 */
export async function loadRuntimeConfig(): Promise<AppRuntimeConfig> {
  if (runtimeConfig) {
    return runtimeConfig;
  }

  // 如果正在加载，返回同一个 Promise
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      // 添加时间戳参数防止缓存
      const timestamp = new Date().getTime();
      const response = await fetch(`/app-config.json?t=${timestamp}`);
      if (!response.ok) {
        throw new Error('Failed to load app config');
      }
      const config = await response.json();
      
      // 验证配置结构
      if (!config || typeof config.title !== 'string') {
        throw new Error('Invalid app config structure');
      }
      
      runtimeConfig = config;
      return runtimeConfig;
    } catch (error) {
      console.warn('Failed to load runtime config, using default values:', error);
      // 返回默认配置
      runtimeConfig = {
        title: DEFAULT_TITLE,
      };
      return runtimeConfig;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * 获取运行时配置（同步方式）
 * 
 * 注意：此函数必须在 loadRuntimeConfig() 完成后调用。
 * 如果在配置加载过程中调用，将返回默认值。
 * 
 * 在应用初始化流程中，main.ts 确保了在调用 getOverridesPreferences() 之前
 * 已经完成 loadRuntimeConfig()，因此正常情况下会返回已加载的配置。
 */
export function getRuntimeConfig(): AppRuntimeConfig {
  if (!runtimeConfig) {
    // 如果配置未加载，返回默认值
    // 这种情况通常发生在模块初始化时，实际配置会在 loadRuntimeConfig 后更新
    return {
      title: DEFAULT_TITLE,
    };
  }
  return runtimeConfig;
}
