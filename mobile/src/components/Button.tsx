import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'outline' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      // ignore
    }
    onPress();
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'danger':
        return [styles.base, styles.danger, disabled && styles.dangerDisabled];
      case 'outline':
        return [styles.base, styles.outline, disabled && styles.disabled];
      case 'secondary':
        return [styles.base, styles.secondary, disabled && styles.disabled];
      default:
        return [styles.base, styles.primary, disabled && styles.primaryDisabled];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return [styles.baseText, styles.outlineText];
      case 'secondary':
        return [styles.baseText, styles.secondaryText];
      case 'danger':
        return [styles.baseText, styles.dangerText];
      default:
        return [styles.baseText, styles.primaryText];
    }
  };

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : '#FFFFFF'} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryDisabled: {
    backgroundColor: colors.primary,
    opacity: 0.4,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  dangerDisabled: {
    backgroundColor: colors.danger,
    opacity: 0.4,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primaryLight,
  },
  disabled: {
    opacity: 0.4,
  },
  baseText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: colors.primary,
  },
  secondaryText: {
    color: colors.primary,
  },
});
