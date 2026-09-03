/**
 * 平台无关的确认弹窗（standalone 部署版使用）。
 * 替代原 @lark-apaas/client-toolkit 的 showConfirm。
 */
export interface ConfirmOptions {
  title: string;
  content?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'danger';
}

export async function showConfirm(options: ConfirmOptions | string): Promise<boolean> {
  const message =
    typeof options === 'string'
      ? options
      : options.content
        ? `${options.title}\n\n${options.content}`
        : options.title;
  return window.confirm(message);
}
