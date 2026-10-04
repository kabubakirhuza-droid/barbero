import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Platform,
} from 'react-native';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface AlertOptions {
  title: string;
  message: string;
  buttonText?: string;
  onClose?: () => void;
}

interface ModalToastContextType {
  showToast: (options: ToastOptions | string) => void;
  showConfirm: (options: ConfirmOptions) => void;
  showAlert: (options: AlertOptions | string, title?: string) => void;
}

const ModalToastContext = createContext<ModalToastContextType>({
  showToast: () => {},
  showConfirm: () => {},
  showAlert: () => {},
});

let globalShowToast: ((options: ToastOptions | string) => void) | null = null;
let globalShowConfirm: ((options: ConfirmOptions) => void) | null = null;
let globalShowAlert: ((options: AlertOptions | string, title?: string) => void) | null = null;

export const triggerGlobalToast = (options: ToastOptions | string) => {
  if (globalShowToast) globalShowToast(options);
};

export const triggerGlobalConfirm = (options: ConfirmOptions) => {
  if (globalShowConfirm) globalShowConfirm(options);
};

export const triggerGlobalAlert = (options: AlertOptions | string, title?: string) => {
  if (globalShowAlert) globalShowAlert(options, title);
};

export const ModalToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Toast state
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    isDestructive: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Ha',
    cancelText: 'Bekor',
    isDestructive: false,
    onConfirm: () => {},
  });

  // Alert Modal state
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttonText: string;
    onClose?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    buttonText: 'Tushundim',
  });

  const showToast = useCallback((options: ToastOptions | string) => {
    const opts: ToastOptions =
      typeof options === 'string' ? { message: options, type: 'info' } : options;
    setToast({
      visible: true,
      message: opts.message,
      type: opts.type || 'info',
    });

    const duration = opts.duration || 3000;
    setTimeout(() => {
      setToast((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    }, duration);
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions) => {
    setConfirmModal({
      visible: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Ha',
      cancelText: options.cancelText || 'Bekor',
      isDestructive: !!options.isDestructive,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    });
  }, []);

  const showAlert = useCallback((options: AlertOptions | string, title?: string) => {
    if (typeof options === 'string') {
      setAlertModal({
        visible: true,
        title: title || 'Eslatma',
        message: options,
        buttonText: 'OK',
      });
    } else {
      setAlertModal({
        visible: true,
        title: options.title || 'Eslatma',
        message: options.message,
        buttonText: options.buttonText || 'Tushundim',
        onClose: options.onClose,
      });
    }
  }, []);

  // Set global callbacks
  globalShowToast = showToast;
  globalShowConfirm = showConfirm;
  globalShowAlert = showAlert;

  const handleConfirmAction = async () => {
    const fn = confirmModal.onConfirm;
    setConfirmModal((prev) => ({ ...prev, visible: false }));
    try {
      await fn();
    } catch (e) {
      console.warn('Confirm action error:', e);
    }
  };

  const handleCancelAction = () => {
    if (confirmModal.onCancel) confirmModal.onCancel();
    setConfirmModal((prev) => ({ ...prev, visible: false }));
  };

  const handleAlertClose = () => {
    if (alertModal.onClose) alertModal.onClose();
    setAlertModal((prev) => ({ ...prev, visible: false }));
  };

  return (
    <ModalToastContext.Provider value={{ showToast, showConfirm, showAlert }}>
      {children}

      {/* 1. Global Toast Banner */}
      {toast.visible && (
        <View style={styles.toastOverlay} pointerEvents="box-none">
          <View
            style={[
              styles.toastCard,
              toast.type === 'success' && styles.toastSuccess,
              toast.type === 'error' && styles.toastError,
              toast.type === 'info' && styles.toastInfo,
            ]}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} color="#059669" />}
            {toast.type === 'error' && <AlertTriangle size={18} color="#DC2626" />}
            {toast.type === 'info' && <Info size={18} color={COLOR_PRIMARY} />}
            <Text
              style={[
                styles.toastText,
                toast.type === 'success' && { color: '#065F46' },
                toast.type === 'error' && { color: '#991B1B' },
                toast.type === 'info' && { color: '#856121' },
              ]}
            >
              {toast.message}
            </Text>
            <TouchableOpacity
              onPress={() => setToast((prev) => ({ ...prev, visible: false }))}
              style={styles.toastCloseBtn}
            >
              <X size={15} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2. Custom Confirm Modal */}
      <Modal
        visible={confirmModal.visible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelAction}
      >
        <TouchableWithoutFeedback onPress={handleCancelAction}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{confirmModal.title}</Text>
                <Text style={styles.modalMessage}>{confirmModal.message}</Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.cancelBtn]}
                    onPress={handleCancelAction}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>{confirmModal.cancelText}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      confirmModal.isDestructive ? styles.destructiveBtn : styles.primaryBtn,
                    ]}
                    onPress={handleConfirmAction}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnText}>{confirmModal.confirmText}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 3. Custom Alert Modal */}
      <Modal
        visible={alertModal.visible}
        transparent
        animationType="fade"
        onRequestClose={handleAlertClose}
      >
        <TouchableWithoutFeedback onPress={handleAlertClose}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{alertModal.title}</Text>
                <Text style={styles.modalMessage}>{alertModal.message}</Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.primaryBtn, { flex: 1 }]}
                    onPress={handleAlertClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnText}>{alertModal.buttonText}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ModalToastContext.Provider>
  );
};

export const useModalToast = () => useContext(ModalToastContext);

const styles = StyleSheet.create({
  toastOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 16,
    right: 16,
    zIndex: 999999,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#EFE9DF',
    maxWidth: 480,
    width: '100%',
  },
  toastSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  toastError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  toastInfo: {
    backgroundColor: '#FAF6F0',
    borderColor: '#EFE9DF',
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  toastCloseBtn: {
    padding: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#EFE9DF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B18',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B645A',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#FAF6F0',
    borderWidth: 1,
    borderColor: '#EFE9DF',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B645A',
  },
  primaryBtn: {
    backgroundColor: COLOR_PRIMARY,
  },
  destructiveBtn: {
    backgroundColor: '#C8383A',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
