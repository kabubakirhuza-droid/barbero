import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { Trash2, Phone, User as UserIcon, Coins } from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { Appointment } from '../types';

interface SwipeableAppointmentCardProps {
  appointment: Appointment;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onPress: () => void;
  onCancel: () => void;
  onCall: (phone?: string) => void;
}

export const SwipeableAppointmentCard: React.FC<SwipeableAppointmentCardProps> = ({
  appointment,
  isOpen,
  onOpen,
  onClose,
  onPress,
  onCancel,
  onCall,
}) => {
  const hasPhone =
    Boolean(appointment.clientPhone) &&
    appointment.clientPhone.trim() !== '' &&
    appointment.clientPhone !== '+998 90 000 00 00';

  // Width of buttons: each button is 68px + 8px gap
  const buttonWidth = 68;
  const maxTranslate = hasPhone ? -(buttonWidth * 2 + 8) : -buttonWidth;

  const translateX = useRef(new Animated.Value(isOpen ? maxTranslate : 0)).current;
  const isDraggingRef = useRef(false);
  const currentTranslateRef = useRef(isOpen ? maxTranslate : 0);

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: isOpen ? maxTranslate : 0,
      useNativeDriver: Platform.OS !== 'web',
      bounciness: 6,
      speed: 14,
    }).start();
    currentTranslateRef.current = isOpen ? maxTranslate : 0;
  }, [isOpen, maxTranslate]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture horizontal movements
        return Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dy) < 15;
      },
      onPanResponderGrant: () => {
        isDraggingRef.current = false;
      },
      onPanResponderMove: (_, gestureState) => {
        isDraggingRef.current = true;
        const base = isOpen ? maxTranslate : 0;
        let newX = base + gestureState.dx;
        // Limit bounds with resistance
        if (newX > 0) newX = newX * 0.15;
        if (newX < maxTranslate - 30) newX = maxTranslate - 30 + (newX - (maxTranslate - 30)) * 0.2;
        translateX.setValue(newX);
        currentTranslateRef.current = newX;
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = Math.abs(maxTranslate) / 3;
        // If pulled left past threshold or fast flick left
        if (gestureState.dx < -threshold || gestureState.vx < -0.5) {
          onOpen();
          Animated.spring(translateX, {
            toValue: maxTranslate,
            useNativeDriver: Platform.OS !== 'web',
            bounciness: 6,
            speed: 14,
          }).start();
          currentTranslateRef.current = maxTranslate;
        } else if (gestureState.dx > threshold || gestureState.vx > 0.5) {
          onClose();
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: Platform.OS !== 'web',
            bounciness: 6,
            speed: 14,
          }).start();
          currentTranslateRef.current = 0;
        } else {
          // Snap back to previous state
          Animated.spring(translateX, {
            toValue: isOpen ? maxTranslate : 0,
            useNativeDriver: Platform.OS !== 'web',
            bounciness: 6,
            speed: 14,
          }).start();
          currentTranslateRef.current = isOpen ? maxTranslate : 0;
        }
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 80);
      },
    })
  ).current;

  const handleCardClick = () => {
    if (isDraggingRef.current) return;
    if (isOpen) {
      onClose();
    } else {
      onPress();
    }
  };

  return (
    <View style={styles.container}>
      {/* Underlying Actions Container (revealed when swiped left) */}
      <View style={styles.actionsContainer}>
        {/* Red Bekor button */}
        <TouchableOpacity
          style={styles.actionBtnRed}
          onPress={onCancel}
          activeOpacity={0.8}
        >
          <Trash2 size={22} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.actionBtnText}>Bekor</Text>
        </TouchableOpacity>

        {/* Golden Qo'ng'iroq button (only if client has phone) */}
        {hasPhone && (
          <TouchableOpacity
            style={styles.actionBtnGold}
            onPress={() => onCall(appointment.clientPhone)}
            activeOpacity={0.8}
          >
            <Phone size={22} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.actionBtnText}>Qo'ng'iroq</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sliding Foreground Card */}
      <Animated.View
        style={[
          styles.card,
          {
            borderLeftColor: appointment.badgeColor || COLOR_PRIMARY,
            borderLeftWidth: 4,
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.cardInner}
          onPress={handleCardClick}
          activeOpacity={0.85}
        >
          <View style={styles.leftRow}>
            <View style={styles.avatar}>
              <UserIcon size={16} color={COLOR_PRIMARY} />
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.clientName}>{appointment.clientName}</Text>
              {hasPhone ? (
                <Text style={styles.clientPhone}>{appointment.clientPhone}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.rightCol}>
            <View
              style={[
                styles.badgePill,
                { backgroundColor: `${appointment.badgeColor || COLOR_PRIMARY}18` },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: appointment.badgeColor || COLOR_PRIMARY },
                ]}
              >
                {appointment.serviceName}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Coins size={13} color={COLOR_PRIMARY} />
              <Text style={styles.priceText}>
                {appointment.servicePrice.toLocaleString('uz-UZ')} uzs
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 72,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
  },
  actionBtnRed: {
    width: 68,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    cursor: 'pointer' as any,
  },
  actionBtnGold: {
    width: 68,
    height: 72,
    borderRadius: 16,
    backgroundColor: COLOR_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    cursor: 'pointer' as any,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  card: {
    width: '100%',
    height: 72,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 4,
  },
  cardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    gap: 2,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  clientPhone: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badgePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
