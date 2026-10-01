import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Calendar, BarChart3, Image as ImageIcon, ShoppingBag, User } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTranslation } from '../i18n/LanguageContext';

export type TabKey = 'jadval' | 'analitika' | 'portfolio' | 'profil';

interface FloatingTabBarProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({ activeTab, onTabPress }) => {
  const { t } = useTranslation();

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'jadval', label: t('tabJadval'), icon: Calendar },
    { key: 'analitika', label: t('tabAnalitika'), icon: BarChart3 },
    { key: 'portfolio', label: t('tabPortfolio'), icon: ImageIcon },
    { key: 'profil', label: t('tabProfil'), icon: User },
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
                  size={22}
                  color={isActive ? colors.primary : colors.textSecondary}
                  strokeWidth={isActive ? 2.3 : 1.8}
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
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 99,
  },
  container: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
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
    padding: 4,
    borderRadius: 12,
  },
  activeIconWrapper: {
    backgroundColor: colors.primaryLight,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  inactiveTabLabel: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
