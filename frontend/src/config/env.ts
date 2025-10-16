/**
 * 环境配置模块
 * 
 * 根据不同的开发环境配置 API 基础地址
 */

/**
 * 开发环境配置
 * 
 * - 微信开发者工具调试: 使用 localhost
 * - 真机调试: 使用局域网 IP
 * 
 * 真机调试时的配置步骤：
 * 1. 在终端执行 `ifconfig`(Mac) 或 `ipconfig`(Windows) 查看本机 IP
 * 2. 找到局域网 IP（通常是 192.168.x.x）
 * 3. 将下方 DEV_API_BASE_URL 改为: `http://你的IP:3000/api`
 * 4. 确保手机和电脑在同一个 WiFi 网络下
 */

// 开发环境 API 地址
const DEV_API_BASE_URL = 'http://192.168.110.163:3000/api';

// 真机调试 API 地址（真机调试时修改这里）
// 示例: const DEVICE_API_BASE_URL = 'http://192.168.1.100:3000/api';
const DEVICE_API_BASE_URL = 'http://192.168.110.163:3000/api'; // ✅ 局域网 IP（已配置）

// 生产环境 API 地址
const PROD_API_BASE_URL = 'https://keep-account.mdice.top/api'; // ⚠️ 部署时修改为实际域名

/**
 * 获取当前环境的 API 基础地址
 * 
 * @param useDeviceIP - 是否使用局域网 IP（真机调试时设为 true）
 * @returns API 基础地址
 */
export function getApiBaseUrl(useDeviceIP: boolean = false): string {
  // 使用 Vite 的编译时环境变量（比 process.env.NODE_ENV 更可靠）
  // @ts-ignore
  const isDev = import.meta.env.DEV;
  
  if (!isDev) {
    return PROD_API_BASE_URL;
  }
  
  // 开发环境：根据参数决定使用 localhost 还是局域网 IP
  return useDeviceIP ? DEVICE_API_BASE_URL : DEV_API_BASE_URL;
}

/**
 * 导出配置对象
 */
export default {
  // 是否使用局域网 IP（真机调试时改为 true）
  USE_DEVICE_IP: true, // ✅ 已开启真机调试
  
  // API 基础地址
  get API_BASE_URL() {
    return getApiBaseUrl(this.USE_DEVICE_IP);
  },
  
  // 请求超时时间（毫秒）
  REQUEST_TIMEOUT: 10000,
  
  // 是否打印请求日志
  ENABLE_REQUEST_LOG: true
};

