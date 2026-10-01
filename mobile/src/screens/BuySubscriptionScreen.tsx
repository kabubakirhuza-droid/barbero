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
  ChevronRight,
  Lock,
  Smartphone,
  Info,
} from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { Button } from '../components/Button';

interface BuySubscriptionScreenProps {
  onBack: () => void;
}

export interface PlanOption {
  id: string;
  name: string;
  duration: string;
  price: string;
  priceNum: number;
  originalPrice?: string;
  periodText: string;
  validUntilDate: string;
  saveBadge?: string;
  isPopular?: boolean;
}

export type PaymentMethod = 'gpay' | 'click' | 'payme' | 'uzum' | 'card';

export const BuySubscriptionScreen: React.FC<BuySubscriptionScreenProps> = ({
  onBack,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('year');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('gpay');
  const [isPrePurchaseModalVisible, setIsPrePurchaseModalVisible] = useState(false);
  const [isGPaySheetVisible, setIsGPaySheetVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // Lower, highly accessible prices
  const plans: PlanOption[] = [
    {
      id: 'month',
      name: 'Oylik Start',
      duration: '1 oy',
      price: '29 000 uzs',
      originalPrice: '49 000 uzs',
      priceNum: 29000,
      periodText: 'oyiga',
      validUntilDate: '2026-yil 1-noyabrgacha',
    },
    {
      id: 'half_year',
      name: 'Yarim yillik Pro',
      duration: '6 oy',
      price: '139 000 uzs',
      originalPrice: '174 000 uzs',
      priceNum: 139000,
      periodText: '6 oy uchun (23 000 uzs/oy)',
      saveBadge: '20% tejamkor',
      validUntilDate: '2027-yil 1-aprelgacha',
    },
    {
      id: 'year',
      name: 'Yillik Premium VIP',
      duration: '12 oy',
      price: '249 000 uzs',
      originalPrice: '348 000 uzs',
      priceNum: 249000,
      periodText: '20 750 uzs / oy',
      saveBadge: 'Eng ommabop (-35%)',
      isPopular: true,
      validUntilDate: '2027-yil 1-oktabrgacha',
    },
  ];

  const benefits = [
    'Telegram Gateway orqali tezkor SMS va eslatmalar',
    'Cheksiz mijozlar va qabullar bazasi',
    'Shaxsiy onlayn booking havolasi (Instagram va Telegram uchun)',
    'Xaritada sartaroshxona bilan birlashish va yangi mijozlar oqimi',
    'Daromad, xizmatlar va mijozlar to‘liq analitikasi',
    '24/7 ustuvor texnik qo‘llab-quvvatlash',
  ];

  const selectedPlan =
    plans.find((p) => p.id === selectedPlanId) || plans[2];

  // Step 1 -> Step 2: Open Pre-purchase screen
  const handleProceedToPrePurchase = () => {
    setIsPrePurchaseModalVisible(true);
  };

  // Step 2 -> Step 3 or 4: Proceed from Pre-purchase
  const handleProceedPayment = () => {
    if (selectedPayment === 'gpay') {
      setIsGPaySheetVisible(true);
    } else {
      executeDirectPayment();
    }
  };

  // Execute payment simulation
  const executeDirectPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsGPaySheetVisible(false);
      setIsPrePurchaseModalVisible(false);
      setIsSuccessModalVisible(true);
    }, 1200);
  };

  return (
    <View style={styles.container}>
      {/* ============================================================ */}
      {/* SCREEN 1: ITEM SELECTION (Выбор товара / услуги) */}
      {/* ============================================================ */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tarif tanlash (Pro Obuna)</Text>
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
          <Text style={styles.topTitle}>BARBERO Pro Imkoniyatlari</Text>
          <Text style={styles.topSubtitle}>
            Mijozlaringizni oson boshqaring, Telegram orqali eslatmalar yuboring va daromadingizni oshiring.
          </Text>
        </View>

        {/* Tariffs List */}
        <Text style={styles.sectionHeading}>Tarifni tanlang (Item Selection)</Text>
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
                  {p.originalPrice && (
                    <Text style={styles.planOriginalPrice}>{p.originalPrice}</Text>
                  )}
                  <Text style={styles.planPeriod}>/ {p.periodText}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Included benefits */}
        <View style={styles.benefitsCard}>
          <View style={styles.benefitsHeader}>
            <Shield size={18} color={COLOR_PRIMARY} />
            <Text style={styles.benefitsTitle}>
              Tarifga kiritilgan barcha imkoniyatlar:
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

        {/* Primary Action: Select & Proceed */}
        <TouchableOpacity
          style={styles.payBtn}
          onPress={handleProceedToPrePurchase}
          activeOpacity={0.85}
        >
          <Zap size={20} color="#FFFFFF" />
          <Text style={styles.payBtnText}>
            {selectedPlan.name}ni tanlash ({selectedPlan.price}) →
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ============================================================ */}
      {/* SCREEN 2 & 3: PRE-PURCHASE & PAYMENT METHOD SELECTION MODAL */}
      {/* ============================================================ */}
      <Modal
        visible={isPrePurchaseModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPrePurchaseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.prePurchaseSheet}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Buyurtmani rasmiylashtirish</Text>
              <TouchableOpacity
                onPress={() => setIsPrePurchaseModalVisible(false)}
                style={styles.closeSheetBtn}
              >
                <Text style={styles.closeSheetBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* SCREEN 2: PRE-PURCHASE ORDER DETAILS */}
              <View style={styles.orderSummaryCard}>
                <View style={styles.orderSummaryHeader}>
                  <Crown size={20} color={COLOR_PRIMARY} />
                  <Text style={styles.orderItemName}>BARBERO Pro ({selectedPlan.name})</Text>
                </View>
                <Text style={styles.orderItemDuration}>Muddat: {selectedPlan.duration} ({selectedPlan.validUntilDate})</Text>

                <View style={styles.orderDivider} />

                <View style={styles.orderRow}>
                  <Text style={styles.orderLabel}>Asosiy narx:</Text>
                  <Text style={styles.orderValueOriginal}>{selectedPlan.originalPrice || selectedPlan.price}</Text>
                </View>

                {selectedPlan.saveBadge && (
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabelDiscount}>Chegirma:</Text>
                    <Text style={styles.orderValueDiscount}>{selectedPlan.saveBadge}</Text>
                  </View>
                )}

                <View style={styles.orderRowTotal}>
                  <Text style={styles.orderTotalLabel}>Jami to‘lov miqdori:</Text>
                  <Text style={styles.orderTotalValue}>{selectedPlan.price}</Text>
                </View>
              </View>

              {/* SCREEN 3: PAYMENT METHOD SCREEN (Экран выбора способа оплаты) */}
              <Text style={styles.paymentSectionTitle}>To‘lov usulini tanlang (Payment Method)</Text>

              {/* Featured Google Pay Button */}
              <TouchableOpacity
                style={[
                  styles.gPayFeaturedCard,
                  selectedPayment === 'gpay' && styles.gPayFeaturedCardSelected,
                ]}
                onPress={() => setSelectedPayment('gpay')}
                activeOpacity={0.85}
              >
                <View style={styles.gPayLogoRow}>
                  <View style={styles.gPayBadge}>
                    <Text style={styles.gPayGText}>G</Text>
                    <Text style={styles.gPayPayText}>Pay</Text>
                  </View>
                  <View style={styles.recommendedPill}>
                    <Text style={styles.recommendedPillText}>Tezkor va xavfsiz</Text>
                  </View>
                </View>
                <Text style={styles.gPaySubtext}>Google hisobingiz orqali 1-bosqichda to‘lang</Text>
                <View
                  style={[
                    styles.radioCircle,
                    selectedPayment === 'gpay' && styles.radioCircleActive,
                    { position: 'absolute', right: 16, top: 18 },
                  ]}
                >
                  {selectedPayment === 'gpay' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>

              {/* Other Payment Methods */}
              <View style={styles.otherPaymentsGrid}>
                {[
                  { id: 'click' as PaymentMethod, name: 'Click' },
                  { id: 'payme' as PaymentMethod, name: 'Payme' },
                  { id: 'uzum' as PaymentMethod, name: 'Uzum Bank' },
                  { id: 'card' as PaymentMethod, name: 'Bank Card' },
                ].map((pm) => {
                  const isSelected = selectedPayment === pm.id;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      style={[
                        styles.otherPaymentItem,
                        isSelected && styles.otherPaymentItemSelected,
                      ]}
                      onPress={() => setSelectedPayment(pm.id)}
                      activeOpacity={0.8}
                    >
                      <CreditCard size={18} color={isSelected ? COLOR_PRIMARY : colors.textSecondary} />
                      <Text style={[styles.otherPaymentName, isSelected && styles.otherPaymentNameSelected]}>
                        {pm.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Security info */}
              <View style={styles.secureBadgeRow}>
                <Lock size={14} color="#059669" />
                <Text style={styles.secureBadgeText}>To‘lovlar 256-bit SSL shifrlash bilan himoyalangan</Text>
              </View>

              {/* Action Button */}
              {selectedPayment === 'gpay' ? (
                <TouchableOpacity
                  style={styles.gPayOfficialButton}
                  onPress={handleProceedPayment}
                  activeOpacity={0.9}
                >
                  <Text style={styles.gPayButtonText}>Buy with</Text>
                  <View style={styles.gPayButtonLogoWrap}>
                    <Text style={styles.gPayButtonGText}>G</Text>
                    <Text style={styles.gPayButtonPayText}>Pay</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.payConfirmBtn}
                  onPress={handleProceedPayment}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.payConfirmBtnText}>
                      To‘lovni tasdiqlash ({selectedPlan.price}) →
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* SCREEN 4: GOOGLE PAY API PAYMENT SHEET (Шторка Google Pay) */}
      {/* ============================================================ */}
      <Modal
        visible={isGPaySheetVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsGPaySheetVisible(false)}
      >
        <View style={styles.gPayModalBackdrop}>
          <View style={styles.gPayNativeSheet}>
            {/* Header */}
            <View style={styles.gPaySheetTopBar}>
              <View style={styles.gPaySheetLogoWrap}>
                <Text style={styles.gPaySheetGText}>G</Text>
                <Text style={styles.gPaySheetPayText}>Pay</Text>
              </View>
              <Text style={styles.gPayAccountText}>user@gmail.com</Text>
            </View>

            <View style={styles.gPaySheetDivider} />

            {/* Merchant and Price Info */}
            <View style={styles.gPayMerchantRow}>
              <View>
                <Text style={styles.gPayMerchantName}>BARBERO CRM</Text>
                <Text style={styles.gPayPlanDesc}>{selectedPlan.name} ({selectedPlan.duration})</Text>
              </View>
              <Text style={styles.gPaySheetAmount}>{selectedPlan.price}</Text>
            </View>

            {/* Selected Card Selector */}
            <Text style={styles.gPayCardSectionTitle}>Payment method</Text>
            <View style={styles.gPayCardBox}>
              <View style={styles.mastercardBadge}>
                <View style={styles.mcCircleRed} />
                <View style={styles.mcCircleYellow} />
              </View>
              <View style={styles.gPayCardDetails}>
                <Text style={styles.gPayCardNumber}>Mastercard •••• 4242</Text>
                <Text style={styles.gPayCardExpiry}>Expires 12/28</Text>
              </View>
              <ChevronRight size={18} color="#5F6368" />
            </View>

            {/* Security Guarantee */}
            <View style={styles.gPaySecurityNote}>
              <Shield size={14} color="#5F6368" />
              <Text style={styles.gPaySecurityText}>
                Encrypted and securely processed by Google Pay API
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.gPayActionRow}>
              <TouchableOpacity
                style={styles.gPayCancelButton}
                onPress={() => setIsGPaySheetVisible(false)}
              >
                <Text style={styles.gPayCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gPaySubmitPayButton}
                onPress={executeDirectPayment}
                disabled={isProcessing}
                activeOpacity={0.85}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.gPaySubmitPayText}>Pay {selectedPlan.price}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={isSuccessModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Sparkles size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Obuna muvaffaqiyatli faollashtirildi!</Text>
            <Text style={styles.successSubtitle}>
              Siz {selectedPlan.name} tarifiga muvaffaqiyatli ulandingiz. Amal qilish muddati: {selectedPlan.validUntilDate}.
            </Text>
            <Button
              title="Ajoyib, bosh sahifaga qaytish"
              onPress={() => {
                setIsSuccessModalVisible(false);
                onBack();
              }}
              style={{ width: '100%', marginTop: 8 }}
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
    fontSize: 17,
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
    backgroundColor: '#1E1B18',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  topIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLOR_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  topTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  topSubtitle: {
    fontSize: 13,
    color: '#E0D8D0',
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 6,
  },
  plansContainer: {
    gap: 12,
  },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    padding: 18,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: COLOR_PRIMARY,
    backgroundColor: '#FFFDF9',
    shadowColor: COLOR_PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 3,
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
    marginBottom: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  planDuration: {
    fontSize: 12,
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
    gap: 8,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: COLOR_PRIMARY,
  },
  planOriginalPrice: {
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  planPeriod: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  benefitsCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    gap: 12,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  benefitList: {
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
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
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Pre-Purchase Modal (Screen 2 & 3) */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  prePurchaseSheet: {
    backgroundColor: colors.card,
    width: '100%',
    maxWidth: 520,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cardBorder,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeSheetBtn: {
    padding: 6,
  },
  closeSheetBtnText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '700',
  },
  orderSummaryCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  orderSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  orderItemDuration: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  orderDivider: {
    height: 1,
    backgroundColor: colors.cardBorderSubtle,
    marginVertical: 4,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  orderValueOriginal: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  orderLabelDiscount: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  orderValueDiscount: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
  },
  orderRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorderSubtle,
  },
  orderTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  orderTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLOR_PRIMARY,
  },
  paymentSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  gPayFeaturedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000000',
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  gPayFeaturedCardSelected: {
    borderColor: '#1A73E8',
    backgroundColor: '#F8FAFF',
  },
  gPayLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  gPayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  gPayGText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4285F4',
  },
  gPayPayText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 2,
  },
  recommendedPill: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recommendedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A73E8',
  },
  gPaySubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  otherPaymentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  otherPaymentItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  otherPaymentItemSelected: {
    borderColor: COLOR_PRIMARY,
    backgroundColor: '#FFFDF9',
  },
  otherPaymentName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  otherPaymentNameSelected: {
    color: COLOR_PRIMARY,
  },
  secureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  secureBadgeText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  gPayOfficialButton: {
    backgroundColor: '#000000',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  gPayButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  gPayButtonLogoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gPayButtonGText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4285F4',
  },
  gPayButtonPayText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 2,
  },
  payConfirmBtn: {
    backgroundColor: COLOR_PRIMARY,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payConfirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Google Pay Native API Sheet (Screen 4) */
  gPayModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gPayNativeSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 440,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    gap: 16,
  },
  gPaySheetTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gPaySheetLogoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gPaySheetGText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4285F4',
  },
  gPaySheetPayText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5F6368',
    marginLeft: 2,
  },
  gPayAccountText: {
    fontSize: 12,
    color: '#5F6368',
    fontWeight: '600',
  },
  gPaySheetDivider: {
    height: 1,
    backgroundColor: '#E8EAED',
  },
  gPayMerchantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gPayMerchantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202124',
  },
  gPayPlanDesc: {
    fontSize: 12,
    color: '#5F6368',
    marginTop: 2,
  },
  gPaySheetAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#202124',
  },
  gPayCardSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5F6368',
    marginTop: 4,
  },
  gPayCardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DADCE0',
    gap: 12,
  },
  mastercardBadge: {
    flexDirection: 'row',
    width: 32,
    height: 20,
    alignItems: 'center',
  },
  mcCircleRed: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EB001B',
    position: 'absolute',
    left: 0,
  },
  mcCircleYellow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F79E1B',
    position: 'absolute',
    left: 12,
    opacity: 0.9,
  },
  gPayCardDetails: {
    flex: 1,
  },
  gPayCardNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202124',
  },
  gPayCardExpiry: {
    fontSize: 11,
    color: '#5F6368',
  },
  gPaySecurityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F3F4',
    padding: 10,
    borderRadius: 10,
  },
  gPaySecurityText: {
    fontSize: 11,
    color: '#5F6368',
    flex: 1,
  },
  gPayActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  gPayCancelButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F3F4',
  },
  gPayCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3C4043',
  },
  gPaySubmitPayButton: {
    flex: 2,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#1A73E8',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  gPaySubmitPayText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Success Modal */
  successModalCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 26,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
});
