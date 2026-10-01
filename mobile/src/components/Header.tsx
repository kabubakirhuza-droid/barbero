import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Bell, Calendar as CalendarIcon } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { BarberoLogo } from './BarberoLogo';

interface HeaderProps {
  onCalendarPress?: () => void;
  onNotificationPress?: () => void;
  hasNotification?: boolean;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onCalendarPress,
  onNotificationPress,
  hasNotification = true,
  unreadCount = 2,
}) => {
  return (
    <View style={styles.container}>
      {/* Brand Logo with golden 'B' emblem and title */}
      <View style={styles.logoContainer}>
        <BarberoLogo size="md" showSubtitle={true} />
      </View>

      {/* Right Action Icons: Bell & Calendar */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <Bell size={20} color={colors.textPrimary} />
          {hasNotification && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeCountText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onCalendarPress}
          activeOpacity={0.7}
        >
          <CalendarIcon size={20} color={colors.textPrimary} />
        </TouchableOpacity>
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
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: colors.danger,
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
