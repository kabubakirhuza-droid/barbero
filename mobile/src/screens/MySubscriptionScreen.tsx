import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Crown,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Zap,
  Sparkles,
} from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';

interface MySubscriptionScreenProps {
  onBack: () => void;
  onOpenBuy: () => void;
}

export const MySubscriptionScreen: React.FC<MySubscriptionScreenProps> = ({
  onBack,
  onOpenBuy,
}) => {
  const features = [
    'Cheksiz mijozlar va yozuvlar yaratish',
    'Telegram Gateway orqali tezkor SMS xabarlar',
    'Shaxsiy brending bilan booking havolasi',
    'PostGIS orqali sartaroshxona bilan birlashish',
    'Daromad va mijozlar analitikasi (kunlik/oylik/yillik)',
    'Portfolio galereyasi va mijozlarga taqdim etish',
    '24/7 ustuvor texnik yordam',
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Obunalarim</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.crownCircle}>
            <Crown size={32} color="#FFFFFF" strokeWidth={2.4} />
          </View>
          <Text style={styles.planName}>Pro Usta Tarifi</Text>
          <View style={styles.activePill}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Faol obuna</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Calendar size={18} color={COLOR_PRIMARY} />
            <Text style={styles.infoLabel}>Amal qilish muddati:</Text>
            <Text style={styles.infoValue}>2026-yil 4-oktabrgacha</Text>
          </View>

          <View style={styles.infoRow}>
            <ShieldCheck size={18} color={COLOR_PRIMARY} />
            <Text style={styles.infoLabel}>Holat:</Text>
            <Text style={styles.infoValue}>To'liq ruxsat</Text>
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Sparkles size={18} color={COLOR_PRIMARY} />
            <Text style={styles.sectionTitle}>
              Sizning tarifingiz imkoniyatlari
            </Text>
          </View>
          <View style={styles.featuresList}>
            {features.map((item, idx) => (
              <View key={idx} style={styles.featureItem}>
                <CheckCircle2 size={18} color={COLOR_PRIMARY} />
                <Text style={styles.featureText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Button: Obunani uzaytirish / sotib olish */}
        <TouchableOpacity
          style={styles.extendBtn}
          onPress={onOpenBuy}
          activeOpacity={0.85}
        >
          <Zap size={20} color="#FFFFFF" />
          <Text style={styles.extendBtnText}>
            Obunani uzaytirish / Sotib olish →
          </Text>
        </TouchableOpacity>
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
    backgroundColor: colors.background,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 110,
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  crownCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLOR_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLOR_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  planName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 20,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  activeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.cardBorderSubtle,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 6,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  extendBtn: {
    backgroundColor: COLOR_PRIMARY,
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: COLOR_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  extendBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
