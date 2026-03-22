import { Animated } from 'react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

type ToastListener = (toast: Toast | null) => void;

let _listener: ToastListener | null = null;
let _hideTimer: ReturnType<typeof setTimeout> | null = null;

export function registerToastListener(listener: ToastListener) {
  _listener = listener;
}

export function showToast(message: string, type: ToastType = 'info', duration = 3000) {
  if (_hideTimer) clearTimeout(_hideTimer);

  const toast: Toast = {
    id: Math.random().toString(36).substring(2),
    message,
    type,
    duration,
  };

  _listener?.(toast);

  _hideTimer = setTimeout(() => {
    _listener?.(null);
  }, duration);
}

export const toast = {
  success: (msg: string) => showToast(msg, 'success'),
  error: (msg: string) => showToast(msg, 'error', 4000),
  info: (msg: string) => showToast(msg, 'info'),
  warning: (msg: string) => showToast(msg, 'warning', 4000),
};
