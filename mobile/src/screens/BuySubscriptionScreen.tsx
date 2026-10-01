import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  Check,
  Sparkles,
  Shield,
  Zap,
  CreditCard,
  Crown,
} from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { Button } from '../components/Button';

interface BuySubscriptionScreenProps {
  onBack: () => void;
}

interface PlanOption {
  id: string;
  name: string;
  duration: string;
  price: string;
  priceNum: number;
  periodText: string;
  validUntilDate: string;
  saveBadge?: string;
  isPopular?: boolean;
}

type PaymentMethod = 'click' | 'payme' | 'uzum';

export const BuySubscriptionScreen: React.FC<BuySubscriptionScreenProps> = ({
  onBack,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('year');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('click');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const plans: PlanOption[] = [
    {
      id: 'month',
      name: 'Oylik tarif',
      duration: '1 oy',
      price: '49 000 uzs',
      priceNum: 49000,
      periodText: 'oyiga',
      validUntilDate: '2026-yil 1-noyabrgacha',
    },
    {
      id: 'half_year',
      name: 'Yarim yillik',
      duration: '6 oy',
      price: '249 000 uzs',
      priceNum: 249000,
      periodText: '6 oy uchun',
      saveBadge: '15% tejamkor',
      validUntilDate: '2027-yil 1-aprelgacha',
    },
    {
      id: 'year',
      name: 'Yillik Premium',
      duration: '12 oy',
      price: '420 000 uzs',
      priceNum: 420000,
      periodText: '35 000 uzs / oy',
      saveBadge: 'Eng foydali (-30%)',
      isPopular: true,
      validUntilDate: '2027-yil 1-oktabrgacha',
    },
  ];

  const benefits = [
    'Telegram orqali real kod va mijozlarga eslatmalar',
    'Cheksiz mijozlar bazasi va yozuvlar tarixi',
    'Shaxsiy onlayn booking sahifasi (Instagram/Telegram uchun)',
    'PostGIS geolokatsiya orqali umumiy sartaroshxonaga qo\'shilish',
    'To\'liq moliyaviy va daromad hisob-kitoblari',
    '24/7 texnik yordam va ustuvor qo\'llab-quvvatlash',
  ];

  const selectedPlan =
    plans.find((p) => p.id === selectedPlanId) || plans[2];

  const handleSubscribe = async () => {
    setIsProcessing(true);
    // Simulate real quick payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccessModalVisible(true);
    }, 900);
  };

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
        <Text style={styles.headerTitle}>Obuna sotib olish</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.topCard}>
          <View style={styles.topIconWrap}>
            <Crown size={28} color="#FFFFFF" strokeWidth={2.4} />
          </View>
          <Text style={styles.topTitle}>Cheksiz imkoniyatlarni oching</Text>
          <Text style={styles.topSubtitle}>
            Mijozlaringizni oson boshqaring, Telegram orqali xabardor qiling va daromadingizni oshiring.
          </Text>
        </View>

        {/* Tariffs List */}
        <Text style={styles.sectionHeading}>Tarifni tanlang</Text>
        <View style={styles.plansContainer}>
          {plans.map((p) => {
            const isSelected = selectedPlanId === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlanId(p.id)}
                activeOpacity={0.8}
              >
                {p.saveBadge && (
                  <View
                    style={[
                      styles.badge,
                      p.isPopular && styles.popularBadge,
                    ]}
                  >
                    <Text style={styles.badgeText}>{p.saveBadge}</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planName}>{p.name}</Text>
                    <Text style={styles.planDuration}>{p.duration}</Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleActive,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </View>

                <View style={styles.planPriceRow}>
                  <Text style={styles.planPrice}>{p.price}</Text>
                  <Text style={styles.planPeriod}>/ {p.periodText}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Payment Methods Selection */}
        <Text style={styles.sectionHeading}>To'lov usuli</Text>
        <View style={styles.paymentMethodsRow}>
          {[
            { id: 'click' as PaymentMethod, name: 'Click' },
            { id: 'payme' as PaymentMethod, name: 'Payme' },
            { id: 'uzum' as PaymentMethod, name: 'Uzum Bank' },
          ].map((pm) => {
            const isSelected = selectedPayment === pm.id;
            return (
              <TouchableOpacity
                key={pm.id}
                style={[
                  styles.paymentCard,
                  isSelected && styles.paymentCardActive,
                ]}
                onPress={() => setSelectedPayment(pm.id)}
                activeOpacity={0.8}
              >
                <CreditCard
                  size={20}
                  color={isSelected ? COLOR_PRIMARY : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.paymentName,
                    isSelected && styles.paymentNameActive,
                  ]}
                >
                  {pm.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Included benefits */}
        <View style={styles.benefitsCard}>
          <View style={styles.benefitsHeader}>
            <Shield size={18} color={COLOR_PRIMARY} />
            <Text style={styles.benefitsTitle}>
              Barcha tariflarga kiritilgan:
            </Text>
          </View>
          <View style={styles.benefitList}>
            {benefits.map((b, i) => (
              <View key={i} style={styles.benefitItem}>
                <View style={styles.checkCircle}>
                  <Check size={14} color={COLOR_PRIMARY} strokeWidth={2.5} />
                </View>
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.payBtn}
          onPress={handleSubscribe}
          disabled={isProcessing}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Zap size={20} color="#FFFFFF" />
              <Text style={styles.payBtnText}>
                {selectedPlan.price} — Obunani faollashtirish
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.guaranteeText}>
          Istalgan vaqtda bekor qilish imkoniyati. Xavfsiz to'lov kafolatlanadi.
        </Text>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={isSuccessModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successBox}>
            <View style={styles.successIconCircle}>
              <Crown size={38} color="#FFFFFF" strokeWidth={2.4} />
            </View>
            <Text style={styles.successTitle}>
              Obuna muvaffaqiyatli faollashtirildi! 🎉
            </Text>
            <Text style={styles.successDesc}>
              Sizning "{selectedPlan.name}" obunangiz muvaffaqiyatli to'landi va {selectedPlan.validUntilDate} amal qiladi.
            </Text>
            <Button
              title="Ajoyib, tushunarli!"
              onPress={() => {
                setIsSuccessModalVisible(false);
                onBack();
              }}
              style={{ marginTop: 16, width: '100%' }}
            />
          </View>
        </View>
      </Modal>
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
  topCard: {
    backgroundColor: COLOR_PRIMARY,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: COLOR_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  topIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  topSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginLeft: 4,
    marginTop: 4,
  },
  plansContainer: {
    gap: 12,
  },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    padding: 16,
    gap: 10,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: COLOR_PRIMARY,
    backgroundColor: '#FFFDF9',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#EAB308',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularBadge: {
    backgroundColor: COLOR_PRIMARY,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  planDuration: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: COLOR_PRIMARY,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLOR_PRIMARY,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  planPeriod: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    gap: 6,
  },
  paymentCardActive: {
    borderColor: COLOR_PRIMARY,
    backgroundColor: '#FFFDF9',
  },
  paymentName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paymentNameActive: {
    color: COLOR_PRIMARY,
  },
  benefitsCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 18,
    gap: 14,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  benefitList: {
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  payBtn: {
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
  payBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  guaranteeText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successBox: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLOR_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
