import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Home, Calendar, Users, PhoneCall, User } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTranslation } from '../i18n/LanguageContext';

export type TabKey = 'jadval' | 'mijozlar' | 'qongiroqlar' | 'profil';

interface FloatingTabBarProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({ activeTab, onTabPress }) => {
  const { t } = useTranslation();

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'jadval', label: t('tabJadval', 'Jadval'), icon: Calendar },
    { key: 'mijozlar', label: t('tabMijozlar', 'Mijozlar'), icon: Users },
    { key: 'qongiroqlar', label: t('tabQongiroqlar', "Qo'ng'iroqlar"), icon: PhoneCall },
    { key: 'profil', label: t('tabProfil', 'Profil'), icon: User },
  ];

  return (
    <View style={styles.floatingWrapper}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const IconComponent = tab.icon;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
                <IconComponent
                  size={20}
                  color={isActive ? colors.primary : colors.textSecondary}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.activeTabLabel : styles.inactiveTabLabel,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 12,
    left: 12,
    right: 12,
    alignItems: 'center',
    zIndex: 99,
  },
  container: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  iconWrapper: {
    padding: 3,
    borderRadius: 10,
  },
  activeIconWrapper: {
    backgroundColor: colors.primaryLight,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  inactiveTabLabel: {
    color: colors.textSecondary,
  },
});
