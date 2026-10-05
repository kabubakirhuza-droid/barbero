import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Bell, Inbox, Calendar as CalendarIcon } from 'lucide-react-native';
import { colors } from '../theme/theme';
import { BarberoLogo } from './BarberoLogo';

interface HeaderProps {
  onCalendarPress?: () => void;
  onNotificationPress?: () => void;
  onRequestsPress?: () => void;
  hasNotification?: boolean;
  unreadCount?: number;
  requestsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onCalendarPress,
  onNotificationPress,
  onRequestsPress,
  hasNotification = false,
  unreadCount = 0,
  requestsCount = 0,
}) => {
  return (
    <View style={styles.container}>
      {/* Brand Logo with golden/blue emblem and title */}
      <View style={styles.logoContainer}>
        <BarberoLogo size="md" showSubtitle={true} />
      </View>

      {/* Right Action Icons: So'rovlar & Bell & Jadval */}
      <View style={styles.actionsContainer}>
        {/* So'rovlar (Booking requests with badge) */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onRequestsPress}
          activeOpacity={0.7}
          accessibilityLabel="So'rovlar"
        >
          <Inbox size={20} color={colors.textPrimary} />
          {requestsCount > 0 && (
            <View style={styles.requestsBadge}>
              <Text style={styles.badgeCountText}>{requestsCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Bildirishnomalar (Bell with badge) */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
          accessibilityLabel="Bildirishnomalar"
        >
          <Bell size={20} color={colors.textPrimary} />
          {(hasNotification || unreadCount > 0) && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeCountText}>{unreadCount > 0 ? unreadCount : ''}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Jadval quick jump */}
        {onCalendarPress && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onCalendarPress}
            activeOpacity={0.7}
            accessibilityLabel="Jadval"
          >
            <CalendarIcon size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 12 : 14,
    paddingBottom: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorderSubtle,
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  requestsBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
});
