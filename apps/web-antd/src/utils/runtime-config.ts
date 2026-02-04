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

let runtimeConfig: AppRuntimeConfig | null = null;

/**
 * 加载运行时配置
 */
export async function loadRuntimeConfig(): Promise<AppRuntimeConfig> {
  if (runtimeConfig) {
    return runtimeConfig;
  }

  try {
    const response = await fetch('/app-config.json');
    if (!response.ok) {
      throw new Error('Failed to load app config');
    }
    runtimeConfig = await response.json();
    return runtimeConfig;
  } catch (error) {
    console.warn('Failed to load runtime config, using default values:', error);
    // 返回默认配置
    runtimeConfig = {
      title: 'TTShang',
    };
    return runtimeConfig;
  }
}

/**
 * 获取运行时配置（同步方式，需要先调用 loadRuntimeConfig）
 */
export function getRuntimeConfig(): AppRuntimeConfig {
  if (!runtimeConfig) {
    // 如果配置未加载，返回默认值
    // 这种情况通常发生在模块初始化时，实际配置会在 loadRuntimeConfig 后更新
    return {
      title: 'TTShang',
    };
  }
  return runtimeConfig;
}
