import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { confirmAction } from '../utils/alerts';
import {
  Copy,
  Crown,
  ChevronRight,
  Scissors,
  Link as LinkIcon,
  CalendarCheck,
  CreditCard,
  ShoppingBag,
  Clock,
  Bell,
  Video,
  Store,
  Globe,
  Sun,
  Shield,
  HelpCircle,
  FileCheck,
  LogOut,
  Sparkles,
} from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { useTranslation } from '../i18n/LanguageContext';
import { BookingLinkScreen } from './BookingLinkScreen';
import { WorkingHoursScreen } from './WorkingHoursScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { LanguageSelectScreen } from './LanguageSelectScreen';
import { SecurityScreen } from './SecurityScreen';
import { MySalonScreen } from './MySalonScreen';
import { BookingRequestsScreen } from './BookingRequestsScreen';
import { MySubscriptionScreen } from './MySubscriptionScreen';
import { BuySubscriptionScreen } from './BuySubscriptionScreen';
import { PublicBookingPreviewModal } from './PublicBookingPreviewModal';
import { HelpModal } from './HelpModal';
import { LegalDocsModal } from './LegalDocsModal';
import { APP_NAME, APP_BASE_URL } from '../config/appConfig';
import { api } from '../api/apiClient';

interface ProfilScreenProps {
  onLogout: () => void;
  onOpenAddService: () => void;
}

type SubScreen =
  | null
  | 'bookingLink'
  | 'workingHours'
  | 'notifications'
  | 'language'
  | 'security'
  | 'mySalon'
  | 'bookingRequests'
  | 'mySubscription'
  | 'buySubscription';

export const ProfilScreen: React.FC<ProfilScreenProps> = ({ onLogout, onOpenAddService }) => {
  const { t, language } = useTranslation();
  const [activeSubScreen, setActiveSubScreen] = useState<SubScreen>(null);
  const [isClientPreviewVisible, setIsClientPreviewVisible] = useState(false);
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [isLegalDocsVisible, setIsLegalDocsVisible] = useState(false);
  const [userData, setUserData] = useState<{ ism: string; familiya: string; phone: string }>({
    ism: 'Bobur',
    familiya: 'Aliyev',
    phone: '+998 90 033 51 02',
  });

  useEffect(() => {
    api.getProfile().then((res) => {
      if (res?.user) {
        setUserData({
          ism: res.user.ism || 'Bobur',
          familiya: res.user.familiya || 'Aliyev',
          phone: res.user.phone || '+998 90 033 51 02',
        });
      }
    }).catch(() => {});
  }, []);

  const fullName = `${userData.ism} ${userData.familiya}`.trim();
  const initial = (userData.ism[0] || 'U').toUpperCase();
  const username = userData.ism.toLowerCase() || 'bobur';
  const bookingUrl = `${APP_BASE_URL}/b/${username}`;

  const handleCopyLink = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(bookingUrl);
      }
    } catch (e) {}
    Alert.alert("Nusxalandi!", bookingUrl);
  };

  const handleLogoutPress = () => {
    confirmAction(
      "Hisobdan chiqasizmi?",
      "Haqiqatan ham hisobdan chiqmoqchimisiz?",
      async () => {
        api.clearToken();
        onLogout();
      },
      'Chiqish',
      'Bekor qilish'
    );
  };

  // Render subscreen if active
  if (activeSubScreen === 'bookingRequests') {
    return <BookingRequestsScreen onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'mySubscription') {
    return (
      <MySubscriptionScreen
        onBack={() => setActiveSubScreen(null)}
        onOpenBuy={() => setActiveSubScreen('buySubscription')}
      />
    );
  }

  if (activeSubScreen === 'buySubscription') {
    return <BuySubscriptionScreen onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'mySalon') {
    return <MySalonScreen onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'bookingLink') {
    return (
      <>
        <BookingLinkScreen
          onBack={() => setActiveSubScreen(null)}
          onOpenClientPreview={() => setIsClientPreviewVisible(true)}
        />
        <PublicBookingPreviewModal
          visible={isClientPreviewVisible}
          onClose={() => setIsClientPreviewVisible(false)}
        />
      </>
    );
  }

  if (activeSubScreen === 'workingHours') {
    return <WorkingHoursScreen onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'notifications') {
    return <NotificationsScreen onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'language') {
    return <LanguageSelectScreen onBack={() => setActiveSubScreen(null)} />;
  }

  if (activeSubScreen === 'security') {
    return <SecurityScreen onBack={() => setActiveSubScreen(null)} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. User Profile Card with Avatar initial & Ism Familiya */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarInitial}>{initial}</Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userPhone}>{userData.phone}</Text>

            {/* Copyable booking link */}
            <TouchableOpacity
              style={styles.linkRow}
              onPress={handleCopyLink}
              activeOpacity={0.7}
            >
              <Text style={styles.linkUrlText}>{bookingUrl}</Text>
              <Copy size={13} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Orange → Yellow Gradient Premium Banner */}
        <View style={styles.premiumBanner}>
          <View style={styles.premiumLeft}>
            <View style={styles.crownWrap}>
              <Crown size={22} color="#FFFFFF" strokeWidth={2.4} />
            </View>
            <View style={styles.premiumTexts}>
              <Text style={styles.premiumTitle}>{t('premiumBannerTitle')}</Text>
              <Text style={styles.premiumValid}>{t('premiumValidUntil')}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.premiumBtn}
            onPress={() => setActiveSubScreen('mySubscription')}
            activeOpacity={0.8}
          >
            <Sparkles size={14} color={COLOR_PRIMARY} />
            <Text style={styles.premiumBtnText}>Boshqarish</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Group: XIZMATLAR */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>{t('groupServices')}</Text>
          <View style={styles.menuGroupCard}>
            {/* Xizmat turlari */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={onOpenAddService}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <Scissors size={20} color={COLOR_PRIMARY} />
                </View>
                <Text style={styles.menuItemLabel}>{t('serviceTypes')}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Booking link */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveSubScreen('bookingLink')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <LinkIcon size={20} color={COLOR_PRIMARY} />
                </View>
                <Text style={styles.menuItemLabel}>{t('bookingLink')}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Bron so'rovlari */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveSubScreen('bookingRequests')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <CalendarCheck size={20} color={COLOR_PRIMARY} />
                </View>
                <Text style={styles.menuItemLabel}>{t('bookingRequests')}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Obunalarim */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveSubScreen('mySubscription')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <CreditCard size={20} color={COLOR_PRIMARY} />
                </View>
                <Text style={styles.menuItemLabel}>{t('mySubscriptions')}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Obuna sotib olish */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveSubScreen('buySubscription')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <ShoppingBag size={20} color={COLOR_PRIMARY} />
                </View>
                <Text style={styles.menuItemLabel}>{t('buySubscription')}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Ish vaqti */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveSubScreen('workingHours')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <Clock size={20} color={COLOR_PRIMARY} />
                </View>
                <Text style={styles.menuItemLabel}>{t('workingHours')}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Bildirishnomalar */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveSubScreen('notifications')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <Bell size={20} color={COLOR_PRIMARY} />
                </View>
                <Text style={styles.menuItemLabel}>{t('notifications')}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Sartaroshxonam */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveSubScreen('mySalon')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <Store size={20} color={COLOR_PRIMARY} />
                </View>
                <Text style={styles.menuItemLabel}>Sartaroshxonam</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Video darsliklar (Tez kunda) */}
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <Video size={20} color={COLOR_PRIMARY} />
                </View>
                <Text style={styles.menuItemLabel}>{t('videoTutorials')}</Text>
              </View>
              <View style={styles.soonBadge}>
                <Text style={styles.soonBadgeText}>{t('soon')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. Group: SOZLAMALAR */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>{t('groupSettings')}</Text>
          <View style={styles.menuGroupCard}>
            {/* Til */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveSubScreen('language')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <Globe size={20} color={COLOR_PRIMARY} />
                </View>
                <Text style={styles.menuItemLabel}>{t('language')}</Text>
              </View>
              <View style={styles.valueRow}>
                <Text style={styles.valueText}>
                  {language === 'uz' ? "O'zbekcha" : 'Русский'}
                </Text>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Ko'rinish */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert(t('appearance'), "Yorug' mavzu faol")}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <Sun size={20} color={COLOR_PRIMARY} />
                </View>
                <Text style={styles.menuItemLabel}>{t('appearance')}</Text>
              </View>
              <View style={styles.valueRow}>
                <Text style={styles.valueText}>{t('lightMode')}</Text>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Xavfsizlik */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveSubScreen('security')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <Shield size={20} color={COLOR_PRIMARY} />
                </View>
                <Text style={styles.menuItemLabel}>{t('security')}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Yordam */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setIsHelpVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <HelpCircle size={20} color={COLOR_PRIMARY} />
                </View>
                <Text style={styles.menuItemLabel}>{t('help')}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Huquqiy hujjatlar */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setIsLegalDocsVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <FileCheck size={20} color={COLOR_PRIMARY} />
                </View>
                <Text style={styles.menuItemLabel}>{t('legalDocs')}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Chiqish (Red Dangerous Button: light pink #FCEBEB, red text, NO black border, radius 20) */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogoutPress}
          activeOpacity={0.8}
        >
          <LogOut size={20} color="#C8383A" />
          <Text style={styles.logoutButtonText}>{t('logout')}</Text>
        </TouchableOpacity>

        {/* Version text */}
        <Text style={styles.versionFooterText}>{t('versionText')}</Text>
      </ScrollView>

      {/* Public booking preview modal */}
      <PublicBookingPreviewModal
        visible={isClientPreviewVisible}
        onClose={() => setIsClientPreviewVisible(false)}
      />

      {/* Help / Support modal */}
      <HelpModal
        visible={isHelpVisible}
        onClose={() => setIsHelpVisible(false)}
      />

      {/* Legal Documents modal */}
      <LegalDocsModal
        visible={isLegalDocsVisible}
        onClose={() => setIsLegalDocsVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 110,
    paddingTop: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  userAvatarInitial: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  userPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  linkUrlText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F97316',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  premiumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  crownWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTexts: {
    gap: 2,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  premiumValid: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  premiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  premiumBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  section: {
    gap: 8,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  menuGroupCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FAF6F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.cardBorderSubtle,
    marginLeft: 72,
  },
  soonBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  soonBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valueText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FCEBEB',
    borderRadius: 20,
    paddingVertical: 16,
    marginTop: 8,
    borderWidth: 0,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C8383A',
  },
  versionFooterText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
});
