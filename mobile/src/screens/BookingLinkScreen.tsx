import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import {
  ChevronLeft,
  Copy,
  Share2,
  ExternalLink,
  CheckCircle2,
  Globe,
  Clock,
  Sparkles,
  Calendar,
} from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { useTranslation } from '../i18n/LanguageContext';
import { Button } from '../components/Button';
import { APP_BASE_URL } from '../config/appConfig';

interface BookingLinkScreenProps {
  onBack: () => void;
  onOpenClientPreview: () => void;
}

export const BookingLinkScreen: React.FC<BookingLinkScreenProps> = ({
  onBack,
  onOpenClientPreview,
}) => {
  const { t } = useTranslation();
  const [isLinkActive, setIsLinkActive] = useState(true);
  const [allowCustomTime, setAllowCustomTime] = useState(false);
  const [allowLunchBooking, setAllowLunchBooking] = useState(false);
  const [copied, setCopied] = useState(false);

  const bookingUrl = `${APP_BASE_URL}/b/bobur`;

  const handleCopy = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(bookingUrl);
      }
    } catch (e) {
      // ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    Alert.alert("Nusxalandi!", bookingUrl);
  };

  const handleShare = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: "Barbero - Shaxsiy yozilish havolasi",
          url: bookingUrl,
        });
        return;
      }
    } catch (e) {
      // cancelled or unsupported
    }
    handleCopy();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('bookingLink')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Status Card with Link */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, !isLinkActive && { backgroundColor: '#FEE2E2' }]}>
              <CheckCircle2 size={16} color={isLinkActive ? "#059669" : "#DC2626"} />
              <Text style={[styles.statusText, !isLinkActive && { color: "#DC2626" }]}>
                {isLinkActive ? "Havolangiz ishlayapti" : "Havola faol emas"}
              </Text>
            </View>
          </View>

          <View style={styles.linkBox}>
            <Globe size={18} color={colors.primary} />
            <Text style={styles.linkText}>{bookingUrl}</Text>
            <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} activeOpacity={0.7}>
              <Copy size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Share Link Button */}
          <Button
            title={t('shareLinkBtn')}
            onPress={handleShare}
            style={styles.shareBtn}
            icon={<Share2 size={16} color="#FFFFFF" />}
          />
          <Text style={styles.shareHint}>{t('shareLinkHint')}</Text>
        </View>

        {/* 2. Client View Preview Block */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>{t('whatClientSees')}</Text>
            <TouchableOpacity
              style={styles.openPageBtn}
              onPress={onOpenClientPreview}
              activeOpacity={0.7}
            >
              <Text style={styles.openPageText}>{t('openPageBtn')}</Text>
              <ExternalLink size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.previewDetails}>
            <View style={styles.previewItem}>
              <Sparkles size={16} color={colors.primary} />
              <Text style={styles.previewItemText}>2 ta xizmat mavjud</Text>
            </View>
            <View style={styles.previewItem}>
              <Clock size={16} color={colors.primary} />
              <Text style={styles.previewItemText}>Dush – Shan 09:00 – 21:00</Text>
            </View>
            <View style={styles.previewItem}>
              <Calendar size={16} color={colors.primary} />
              <Text style={styles.previewItemText}>14 kun oldindan band qilish</Text>
            </View>
          </View>
        </View>

        {/* 3. Toggles Section */}
        <View style={styles.togglesCard}>
          {/* Link faol */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>{t('linkActiveToggle')}</Text>
              <Text style={styles.toggleSub}>Mijozlar havolaga kirishi mumkin</Text>
            </View>
            <Switch
              value={isLinkActive}
              onValueChange={setIsLinkActive}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.dividerH} />

          {/* Xohlagan vaqtga so'rov */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>{t('customTimeRequestToggle')}</Text>
              <Text style={styles.toggleSub}>Band vaqtlar uchun ham so'rov qoldirish</Text>
            </View>
            <Switch
              value={allowCustomTime}
              onValueChange={setAllowCustomTime}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.dividerH} />

          {/* Tushlik vaqtiga ham yozilsin */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>{t('lunchTimeBookingToggle')}</Text>
              <Text style={styles.toggleSub}>13:00 – 14:00 tushlik vaqtida yozilish</Text>
            </View>
            <Switch
              value={allowLunchBooking}
              onValueChange={setAllowLunchBooking}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 48 : 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorderSubtle,
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
  placeholder: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginHorizontal: 10,
  },
  copyBtn: {
    padding: 4,
  },
  shareBtn: {
    height: 46,
    borderRadius: 14,
  },
  shareHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 14,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  openPageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  openPageText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  previewDetails: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  togglesCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTextCol: {
    flex: 1,
    marginRight: 12,
    gap: 2,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  toggleSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dividerH: {
    height: 1,
    backgroundColor: colors.cardBorderSubtle,
  },
});
