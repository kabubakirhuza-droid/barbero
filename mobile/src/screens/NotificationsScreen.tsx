import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import {
  ChevronLeft,
  Bell,
  Mic,
  MessageSquare,
  Clock,
  CalendarCheck,
  CheckCheck,
  Sparkles,
} from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { useTranslation } from '../i18n/LanguageContext';

interface NotificationsScreenProps {
  onBack: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'booking' | 'reminder' | 'system';
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onBack,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'settings'>('all');
  const [dailyReminder, setDailyReminder] = useState(true);
  const [aiMode, setAiMode] = useState(true);
  const [clientSms, setClientSms] = useState(true);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      title: 'Yangi qabul yozuvi!',
      message: 'Jasur (+998 90 777 88 99) 3-oktabr soat 15:00 ga "Soch olish" xizmatiga yozildi.',
      time: '10 daqiqa oldin',
      isRead: false,
      type: 'booking',
    },
    {
      id: 'n-2',
      title: 'Qabul eslatmasi',
      message: 'Bugun 14:00 da Mijoz 1 (Soch + soqol) kutib olinadi. Iltimos, tayyor bo\'ling.',
      time: '1 soat oldin',
      isRead: false,
      type: 'reminder',
    },
    {
      id: 'n-3',
      title: 'Obuna holati',
      message: 'Sizning "Pro Usta" tarifingiz faol holatda. Barcha imkoniyatlar cheksiz.',
      time: 'Kuni kecha',
      isRead: true,
      type: 'system',
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirishnomalar</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.readAllBtn}
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
          >
            <CheckCheck size={18} color={COLOR_PRIMARY} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Tabs: [ Xabarlar (2) ] | [ Sozlamalar ] */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'all' && styles.tabBtnTextActive,
            ]}
          >
            Xabarlar {unreadCount > 0 ? `(${unreadCount})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === 'settings' && styles.tabBtnActive,
          ]}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'settings' && styles.tabBtnTextActive,
            ]}
          >
            Sozlamalar
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'all' ? (
          <View style={styles.notificationsList}>
            {notifications.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.notifCard,
                  !item.isRead && styles.notifCardUnread,
                ]}
              >
                <View style={styles.notifIconWrap}>
                  {item.type === 'booking' ? (
                    <CalendarCheck size={20} color={COLOR_PRIMARY} />
                  ) : item.type === 'reminder' ? (
                    <Clock size={20} color="#2563EB" />
                  ) : (
                    <Sparkles size={20} color="#10B981" />
                  )}
                </View>

                <View style={styles.notifContent}>
                  <View style={styles.notifTopRow}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.notifMessage}>{item.message}</Text>
                </View>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            {/* 1. Har kun ogohlantir */}
            <View style={styles.itemRow}>
              <View style={styles.iconWrap}>
                <Bell size={20} color={COLOR_PRIMARY} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>{t('dailyReminderToggle')}</Text>
                <Text style={styles.itemSubtitle}>
                  {t('dailyReminderHint')}
                </Text>
              </View>
              <Switch
                value={dailyReminder}
                onValueChange={setDailyReminder}
                trackColor={{ false: colors.cardBorder, true: COLOR_PRIMARY }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            {/* 2. AI rejimi */}
            <View style={styles.itemRow}>
              <View style={styles.iconWrap}>
                <Mic size={20} color={COLOR_PRIMARY} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>{t('aiModeToggle')}</Text>
                <Text style={styles.itemSubtitle}>{t('aiModeHint')}</Text>
              </View>
              <Switch
                value={aiMode}
                onValueChange={setAiMode}
                trackColor={{ false: colors.cardBorder, true: COLOR_PRIMARY }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            {/* 3. Mijozga eslatma */}
            <View style={styles.itemRow}>
              <View style={styles.iconWrap}>
                <MessageSquare size={20} color={COLOR_PRIMARY} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>{t('clientSmsToggle')}</Text>
                <Text style={styles.itemSubtitle}>{t('clientSmsHint')}</Text>
              </View>
              <Switch
                value={clientSms}
                onValueChange={setClientSms}
                trackColor={{ false: colors.cardBorder, true: COLOR_PRIMARY }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 14 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorderSubtle,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  readAllBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: COLOR_PRIMARY,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  notificationsList: {
    gap: 12,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 12,
  },
  notifCardUnread: {
    borderColor: COLOR_PRIMARY,
    backgroundColor: '#FFFDF9',
  },
  notifIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
    gap: 4,
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notifTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  notifMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLOR_PRIMARY,
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextCol: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorderSubtle,
  },
});
