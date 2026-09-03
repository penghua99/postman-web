export { showConfirm } from '@lark-apaas/client-toolkit';

export interface ConfirmOptions {
  title: string;
  content?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'danger';
}
