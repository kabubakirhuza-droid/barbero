import {
  triggerGlobalConfirm,
  triggerGlobalAlert,
  triggerGlobalToast,
} from '../context/ModalToastContext';

export const confirmAction = (
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  confirmText = 'Ha',
  cancelText = "Yo'q",
  isDestructive = true
) => {
  triggerGlobalConfirm({
    title,
    message,
    confirmText,
    cancelText,
    isDestructive,
    onConfirm,
  });
};

export const showAlert = (title: string, message: string, buttonText = 'Tushundim') => {
  triggerGlobalAlert({
    title,
    message,
    buttonText,
  });
};

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  triggerGlobalToast({
    message,
    type,
  });
};
