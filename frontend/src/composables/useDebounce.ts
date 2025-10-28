import { ref } from 'vue';

/**
 * 基于时间戳的防抖 Hook
 * 
 * 用于防止短时间内重复调用异步函数
 * 
 * @param delayMs - 防抖延迟时间（毫秒），默认 500ms
 * @returns 包含防抖包装函数和重置方法的对象
 * 
 * @example
 * ```typescript
 * const { debounce, reset } = useDebounce(500);
 * 
 * const fetchData = debounce(async () => {
 *   const data = await api.getData();
 *   return data;
 * });
 * 
 * // 短时间内多次调用，只有第一次执行
 * await fetchData(); // ✅ 执行
 * await fetchData(); // ⏸️  跳过
 * 
 * // 组件卸载时重置
 * onUnload(() => reset());
 * ```
 */
export function useDebounce(delayMs = 500) {
  const lastTimestamp = ref(0);
  
  /**
   * 包装异步函数，添加防抖逻辑
   * 
   * @param fn - 需要防抖的异步函数
   * @returns 包装后的函数
   */
  function debounce<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
      const now = Date.now();
      const elapsed = now - lastTimestamp.value;
      
      if (elapsed < delayMs) {
        // @ts-ignore
        if (import.meta.env.DEV) {
          console.log(`[防抖] 请求过于频繁，跳过（距上次调用 ${elapsed}ms）`);
        }
        return undefined;
      }
      
      // 更新时间戳
      lastTimestamp.value = now;
      
      // 执行原函数
      return await fn(...args);
    }) as T;
  }
  
  /**
   * 重置防抖状态
   * 
   * 通常在组件卸载时调用，确保下次进入页面时状态干净
   */
  function reset() {
    lastTimestamp.value = 0;
  }
  
  /**
   * 检查是否可以执行（不实际执行）
   * 
   * @returns 如果可以执行返回 true，否则返回 false
   */
  function canExecute(): boolean {
    const now = Date.now();
    return now - lastTimestamp.value >= delayMs;
  }
  
  return {
    debounce,
    reset,
    canExecute
  };
}

/**
 * 基于计数的请求锁 Hook
 * 
 * 用于严格防止并发执行（同一时间只能有一个请求在执行）
 * 
 * @returns 包含锁包装函数的对象
 * 
 * @example
 * ```typescript
 * const { withLock } = useRequestLock();
 * 
 * const fetchData = withLock(async () => {
 *   const data = await api.getData();
 *   return data;
 * });
 * 
 * // 并发调用时，只有第一个执行，其余等待或跳过
 * fetchData(); // ✅ 执行
 * fetchData(); // ⏸️  等待（根据 waitIfLocked 参数）
 * ```
 */
export function useRequestLock() {
  const lockCount = ref(0);
  
  /**
   * 包装异步函数，添加锁保护
   * 
   * @param fn - 需要加锁的异步函数
   * @param options - 配置选项
   * @returns 包装后的函数
   */
  function withLock<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: { waitIfLocked?: boolean } = {}
  ): T {
    const { waitIfLocked = false } = options;
    
    return (async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
      // 检查是否已锁定
      if (lockCount.value > 0) {
        // @ts-ignore
        if (import.meta.env.DEV) {
          console.log('[请求锁] 已有请求进行中，跳过');
        }
        return undefined;
      }
      
      try {
        lockCount.value++;
        return await fn(...args);
      } finally {
        lockCount.value--;
      }
    }) as T;
  }
  
  /**
   * 检查是否已锁定
   */
  function isLocked(): boolean {
    return lockCount.value > 0;
  }
  
  return {
    withLock,
    isLocked
  };
}

