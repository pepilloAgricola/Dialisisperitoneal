import React, { useState, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Snackbar } from 'react-native-paper';

export type SnackbarType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const useToast = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SnackbarType>('info');
  const [action, setAction] = useState<{ label: string; onPress: () => void } | undefined>();

  const showToast = useCallback(
    (msg: string, toastType: SnackbarType = 'info', options?: ToastOptions) => {
      setMessage(msg);
      setType(toastType);
      setAction(options?.action);
      setVisible(true);
    },
    []
  );

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  return {
    visible,
    message,
    type,
    action,
    showToast,
    hideToast,
  };
};

interface ToastProps {
  visible: boolean;
  message: string;
  type: SnackbarType;
  action?: { label: string; onPress: () => void };
  onDismiss: () => void;
  theme: any;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type,
  action,
  onDismiss,
  theme,
}) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      default:
        return theme.colors.primary;
    }
  };

  const textColor = type === 'warning' ? '#1F2328' : '#FFFFFF';

  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={3200}
      style={[
        styles.snackbar,
        { backgroundColor: getBackgroundColor(), borderColor: 'rgba(255,255,255,0.28)' },
      ]}
      wrapperStyle={styles.wrapper}
      action={
        action
          ? {
              label: action.label,
              onPress: action.onPress,
              labelStyle: { color: textColor, fontWeight: '700' },
            }
          : undefined
      }
      theme={{ colors: { inverseOnSurface: textColor } }}
    >
      {message}
    </Snackbar>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  snackbar: {
    borderRadius: 16,
    borderWidth: 1,
  },
});
