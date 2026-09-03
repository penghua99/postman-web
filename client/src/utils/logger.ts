/**
 * 平台无关的日志工具（standalone 部署版使用）。
 * 替代原 @lark-apaas/client-toolkit/logger。
 */
export const logger = {
  info: (message: string, ...args: unknown[]): void =>
    console.log(`[INFO] ${message}`, ...args),
  warn: (message: string, ...args: unknown[]): void =>
    console.warn(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: unknown[]): void =>
    console.error(`[ERROR] ${message}`, ...args),
  debug: (message: string, ...args: unknown[]): void =>
    console.debug(`[DEBUG] ${message}`, ...args),
};
