import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  ActivityIndicator,
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
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Share2,
  ExternalLink,
  Send,
} from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { useTranslation } from '../i18n/LanguageContext';
import { webPushManager, PushStatusInfo } from '../utils/pushManager';
import { Button } from '../components/Button';

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

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'settings'>('all');
  const [dailyReminder, setDailyReminder] = useState(true);
  const [newRequestsToggle, setNewRequestsToggle] = useState(true);
  const [clientSms, setClientSms] = useState(true);

  // Push status state
  const [pushStatus, setPushStatus] = useState<PushStatusInfo | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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
      message: "Bugun 14:00 da Mijoz 1 (Soch + soqol) kutib olinadi. Iltimos, tayyor bo'ling.",
      time: '1 soat oldin',
      isRead: false,
      type: 'reminder',
    },
    {
      id: 'n-3',
      title: 'Xizmat yangilandi',
      message: 'Barbero ilovasida barcha funksiyalar to‘liq bepul ishlamoqda.',
      time: 'Kuni kecha',
      isRead: true,
      type: 'system',
    },
  ]);

  const loadPushStatus = async () => {
    const status = await webPushManager.getStatus();
    setPushStatus(status);
  };

  useEffect(() => {
    loadPushStatus();
    webPushManager.registerServiceWorker();
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleEnablePush = async () => {
    setIsSubscribing(true);
    setTestResult(null);
    try {
      const res = await webPushManager.subscribe();
      await loadPushStatus();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Xatolik yuz berdi',
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSendTestPush = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await webPushManager.sendTestNotification();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Xatolik',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
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
          <Text style={[styles.tabBtnText, activeTab === 'all' && styles.tabBtnTextActive]}>
            Xabarlar {unreadCount > 0 ? `(${unreadCount})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'settings' && styles.tabBtnActive]}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'settings' && styles.tabBtnTextActive]}>
            Sozlamalar va Push
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
                style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
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
          <View style={styles.settingsContainer}>
            {/* 1. Web Push Diagnostics Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Smartphone size={20} color={COLOR_PRIMARY} />
                <Text style={styles.cardTitle}>Push-bildirishnoma holati</Text>
              </View>

              <View style={styles.statusGrid}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Ruxsat:</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>
                      {pushStatus?.permission === 'granted'
                        ? t('pushStatusGranted')
                        : pushStatus?.permission === 'denied'
                        ? t('pushStatusDenied')
                        : 'So‘ralmagan'}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Obuna:</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      pushStatus?.isSubscribed && styles.statusBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        pushStatus?.isSubscribed && styles.statusBadgeActiveText,
                      ]}
                    >
                      {pushStatus?.isSubscribed ? t('pushActive') : t('pushInactive')}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Qurilma:</Text>
                  <Text style={styles.statusValue}>{pushStatus?.deviceInfo || 'Aniqlanmoqda'}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.pushActionsRow}>
                {!pushStatus?.isSubscribed && (
                  <Button
                    title={isSubscribing ? 'Ulanmoqda...' : t('pushEnableBtn')}
                    onPress={handleEnablePush}
                    disabled={isSubscribing}
                    style={{ flex: 1 }}
                  />
                )}

                <Button
                  title={isSendingTest ? 'Yuborilmoqda...' : t('testPushBtn')}
                  variant={pushStatus?.isSubscribed ? 'primary' : 'outline'}
                  onPress={handleSendTestPush}
                  disabled={isSendingTest}
                  style={{ flex: 1 }}
                />
              </View>

              {/* Test Result Message Banner */}
              {testResult && (
                <View
                  style={[
                    styles.resultBanner,
                    testResult.success ? styles.resultBannerSuccess : styles.resultBannerError,
                  ]}
                >
                  {testResult.success ? (
                    <CheckCircle2 size={18} color="#059669" />
                  ) : (
                    <AlertCircle size={18} color={colors.danger} />
                  )}
                  <Text
                    style={[
                      styles.resultBannerText,
                      testResult.success ? styles.resultBannerSuccessText : styles.resultBannerErrorText,
                    ]}
                  >
                    {testResult.message}
                  </Text>
                </View>
              )}
            </View>

            {/* 2. iPhone PWA Hint if iOS */}
            {pushStatus?.isIos && !pushStatus?.isStandalone && (
              <View style={styles.iosHintCard}>
                <View style={styles.iosHintHeader}>
                  <Share2 size={18} color="#D97706" />
                  <Text style={styles.iosHintTitle}>{t('iosPwaHintTitle')}</Text>
                </View>
                <Text style={styles.iosHintDesc}>{t('iosPwaHintDesc')}</Text>
              </View>
            )}

            {/* 3. In-App Browser warning if Telegram / Instagram */}
            {pushStatus?.isTelegramOrInstagram && (
              <View style={styles.iosHintCard}>
                <View style={styles.iosHintHeader}>
                  <ExternalLink size={18} color="#2563EB" />
                  <Text style={styles.iosHintTitle}>Tashqi brauzerda ochish</Text>
                </View>
                <Text style={styles.iosHintDesc}>
                  Push-bildirishnomalar ishlashi uchun ilovani Safari yoki Chrome brauzerida oching.
                </Text>
              </View>
            )}

            {/* 4. Notification Toggles Card */}
            <View style={styles.card}>
              <Text style={styles.sectionHeaderTitle}>{t('serviceNotificationsTitle')}</Text>

              {/* Yangi so'rovlar */}
              <View style={styles.itemRow}>
                <View style={styles.iconWrap}>
                  <CalendarCheck size={20} color={COLOR_PRIMARY} />
                </View>
                <View style={styles.itemTextCol}>
                  <Text style={styles.itemTitle}>Yangi so'rovlar</Text>
                  <Text style={styles.itemSubtitle}>
                    Mijoz onlayn yozilganda zudlik bilan push keladi
                  </Text>
                </View>
                <Switch
                  value={newRequestsToggle}
                  onValueChange={setNewRequestsToggle}
                  trackColor={{ false: colors.cardBorder, true: COLOR_PRIMARY }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.divider} />

              {/* Har kun ogohlantir (09:00) */}
              <View style={styles.itemRow}>
                <View style={styles.iconWrap}>
                  <Bell size={20} color={COLOR_PRIMARY} />
                </View>
                <View style={styles.itemTextCol}>
                  <Text style={styles.itemTitle}>{t('dailyReminderToggle')}</Text>
                  <Text style={styles.itemSubtitle}>{t('dailyReminderHint')}</Text>
                </View>
                <Switch
                  value={dailyReminder}
                  onValueChange={setDailyReminder}
                  trackColor={{ false: colors.cardBorder, true: COLOR_PRIMARY }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.divider} />

              {/* Mijozga eslatma */}
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
  settingsContainer: {
    gap: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statusGrid: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusBadge: {
    backgroundColor: colors.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusBadgeActiveText: {
    color: '#059669',
  },
  pushActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultBannerSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  resultBannerError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  resultBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  resultBannerSuccessText: {
    color: '#065F46',
  },
  resultBannerErrorText: {
    color: '#991B1B',
  },
  iosHintCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    gap: 6,
  },
  iosHintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iosHintTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  iosHintDesc: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 17,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
