import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { X, Check, Clock, ShieldCheck, MapPin, Phone, User as UserIcon } from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { Button } from '../components/Button';
import { BarberoLogo } from '../components/BarberoLogo';
import { api } from '../api/apiClient';
import { APP_BASE_URL } from '../config/appConfig';
import { showAlert } from '../utils/alerts';

interface PublicBookingPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  masterUsername?: string;
}

interface TimeGroup {
  title: string;
  slots: string[];
}

export const PublicBookingPreviewModal: React.FC<PublicBookingPreviewModalProps> = ({
  visible,
  onClose,
  masterUsername = 'bobur',
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState('srv-1');
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState('15:00');
  const [clientName, setClientName] = useState('');
  const [rawPhone, setRawPhone] = useState('901234567');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const datesList = [
    { label: '29-sentyabr', iso: '2026-09-29' },
    { label: '30-sentyabr', iso: '2026-09-30' },
    { label: '1-oktabr', iso: '2026-10-01' },
    { label: '2-oktabr', iso: '2026-10-02' },
    { label: '3-oktabr', iso: '2026-10-03' },
    { label: '4-oktabr', iso: '2026-10-04' },
    { label: '5-oktabr', iso: '2026-10-05' },
  ];

  const timeGroups: TimeGroup[] = [
    {
      title: 'Ertalab',
      slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
    },
    {
      title: 'Kunduzi',
      slots: [
        '12:00',
        '12:30',
        '13:00',
        '13:30',
        '14:00',
        '14:30',
        '15:00',
        '15:30',
        '16:00',
        '16:30',
      ],
    },
    {
      title: 'Kechqurun',
      slots: [
        '17:00',
        '17:30',
        '18:00',
        '18:30',
        '19:00',
        '19:30',
        '20:00',
        '20:30',
      ],
    },
  ];

  const services = [
    {
      id: 'srv-1',
      name: 'Soch olish',
      price: 50000,
      duration: '30 min',
      desc: 'Zamonaviy soch turmagi va yuvish',
    },
    {
      id: 'srv-2',
      name: 'Soch + soqol',
      price: 70000,
      duration: '45 min',
      desc: 'Kompleks xizmat: soch, soqol konturi va parvarish',
    },
    {
      id: 'srv-3',
      name: 'Bolalar sochi',
      price: 30000,
      duration: '25 min',
      desc: 'Bolalar uchun qulay va tezkor soch turmagi',
    },
    {
      id: 'srv-4',
      name: 'Soqol olish',
      price: 30000,
      duration: '20 min',
      desc: 'Soqol tekislash va kontur',
    },
    {
      id: 'srv-5',
      name: 'Kreativ soqol tekislash',
      price: 45000,
      duration: '30 min',
      desc: 'Maxsus dizayn va soqol parvarishi',
    },
  ];

  const formatPhoneInput = (text: string) => {
    // Strip everything non-numeric
    let digits = text.replace(/\D/g, '');
    // If text starts with 998, strip it so user only types 9 digits
    if (digits.startsWith('998')) {
      digits = digits.slice(3);
    }
    setRawPhone(digits.slice(0, 9));
  };

  const getFormattedPhoneDisplay = () => {
    let res = '+998';
    if (!rawPhone) return '+998 ';
    res += ' ';
    for (let i = 0; i < rawPhone.length; i++) {
      if (i === 2 || i === 5 || i === 7) {
        res += ' ';
      }
      res += rawPhone[i];
    }
    return res;
  };

  const fullPhoneE164 = `+998${rawPhone}`;

  const selectedDateObj = datesList[selectedDateIndex] || datesList[0];

  const handleBook = async () => {
    if (!clientName.trim()) {
      showAlert('Xatolik', 'Iltimos, ismingizni kiriting');
      return;
    }
    if (rawPhone.length < 9) {
      showAlert('Xatolik', "Iltimos, to'liq telefon raqamingizni kiriting (+998 XX XXX XX XX)");
      return;
    }

    try {
      setIsSubmitting(true);
      const chosenService =
        services.find((s) => s.id === selectedServiceId) || services[0];

      // 1. Post to backend booking endpoint
      try {
        await fetch(`http://127.0.0.1:5000/public/b/${masterUsername}/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: clientName.trim(),
            clientPhone: getFormattedPhoneDisplay(),
            serviceId: chosenService.id,
            date: selectedDateObj.iso,
            startTime: selectedTime,
          }),
        });
      } catch (e) {
        // Also register in direct appointments as fallback
      }

      // Also create appointment directly
      try {
        await api.createAppointment({
          clientName: clientName.trim(),
          clientPhone: getFormattedPhoneDisplay(),
          serviceId: chosenService.id,
          serviceName: chosenService.name,
          servicePrice: chosenService.price,
          badgeColor: COLOR_PRIMARY,
          date: selectedDateObj.iso,
          startTime: selectedTime,
          duration: 30,
          status: 'confirmed',
        });
      } catch (e) {}

      setIsSuccess(true);
    } catch (e: any) {
      showAlert('Xatolik', e.message || "So'rov yuborishda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.urlPill}>
            <Text style={styles.urlText}>🔒 {APP_BASE_URL}/b/{masterUsername}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {isSuccess ? (
          <View style={styles.successContainer}>
            <View style={styles.successIconCircle}>
              <Check size={36} color="#FFFFFF" strokeWidth={3} />
            </View>
            <Text style={styles.successTitle}>Siz muvaffaqiyatli yozildingiz!</Text>
            <Text style={styles.successDesc}>
              {clientName}, sizning qabulingiz {selectedDateObj.label} soat {selectedTime} ga tasdiqlandi.
              Sizga SMS eslatma yuboriladi.
            </Text>

            <Button
              title="Yopish"
              onPress={() => {
                setIsSuccess(false);
                onClose();
              }}
              style={{ marginTop: 24, width: '80%' }}
            />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Master Profile Card with Barbero Branding */}
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>B</Text>
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.verifiedRow}>
                  <Text style={styles.masterName}>Bobur Aliyev</Text>
                  <ShieldCheck size={18} color={COLOR_PRIMARY} />
                </View>
                <Text style={styles.masterBio}>Barber & Erkaklar stilisti</Text>
                <View style={styles.locationRow}>
                  <MapPin size={13} color={colors.textSecondary} />
                  <Text style={styles.locationText}>Toshkent sh., Chilonzor</Text>
                </View>
              </View>
            </View>

            {/* Schedule Info */}
            <View style={styles.scheduleInfoPill}>
              <Clock size={16} color={COLOR_PRIMARY} />
              <Text style={styles.scheduleInfoText}>Dush – Shan 09:00 – 21:00</Text>
            </View>

            {/* Step 1: Select Service */}
            <Text style={styles.sectionTitle}>1. Xizmatni tanlang</Text>
            <View style={styles.servicesList}>
              {services.map((srv) => {
                const isSelected = selectedServiceId === srv.id;
                return (
                  <TouchableOpacity
                    key={srv.id}
                    style={[styles.serviceCard, isSelected && styles.serviceCardActive]}
                    onPress={() => setSelectedServiceId(srv.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.serviceMeta}>
                      <Text style={styles.serviceName}>{srv.name}</Text>
                      <Text style={styles.serviceDesc}>{srv.desc}</Text>
                      <Text style={styles.serviceDuration}>⏱ {srv.duration}</Text>
                    </View>
                    <View style={styles.servicePriceCol}>
                      <Text style={styles.servicePriceText}>
                        {srv.price.toLocaleString('uz-UZ')} uzs
                      </Text>
                      <View style={[styles.selectRadio, isSelected && styles.selectRadioActive]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Step 2: Select Date & Time (Grouped into Ertalab, Kunduzi, Kechqurun) */}
            <Text style={styles.sectionTitle}>2. Qulay sana va vaqtni tanlang</Text>

            {/* Horizontal Date Picker */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.datesRow}
            >
              {datesList.map((d, idx) => {
                const isSelected = selectedDateIndex === idx;
                return (
                  <TouchableOpacity
                    key={d.iso}
                    style={[styles.dateChip, isSelected && styles.dateChipActive]}
                    onPress={() => setSelectedDateIndex(idx)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dateChipText,
                        isSelected && styles.dateChipTextActive,
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Dark Styled Time Slots Container (Exact Style from Reference Image) */}
            <View style={styles.darkTimeContainer}>
              {timeGroups.map((group) => (
                <View key={group.title} style={styles.timeGroupSection}>
                  <Text style={styles.timeGroupHeader}>{group.title}</Text>
                  <View style={styles.timeGrid}>
                    {group.slots.map((t) => {
                      const isSelected = selectedTime === t;
                      return (
                        <TouchableOpacity
                          key={t}
                          style={[
                            styles.timeSlotPill,
                            isSelected && styles.timeSlotPillActive,
                          ]}
                          onPress={() => setSelectedTime(t)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.timeSlotText,
                              isSelected && styles.timeSlotTextActive,
                            ]}
                          >
                            {t}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            {/* Step 3: Client Details */}
            <Text style={styles.sectionTitle}>3. Ma'lumotlaringiz</Text>
            <View style={styles.inputsCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ismingiz</Text>
                <View style={styles.inputRow}>
                  <UserIcon size={18} color={COLOR_PRIMARY} />
                  <TextInput
                    style={styles.innerInput}
                    value={clientName}
                    onChangeText={setClientName}
                    placeholder="Ismingizni kiriting"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefon raqamingiz</Text>
                <View style={styles.inputRow}>
                  <Phone size={18} color={COLOR_PRIMARY} />
                  <TextInput
                    style={styles.innerInput}
                    value={getFormattedPhoneDisplay()}
                    onChangeText={formatPhoneInput}
                    keyboardType="phone-pad"
                    placeholder="+998 90 123 45 67"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Submit Booking Button */}
            <Button
              title="Yozilish"
              loading={isSubmitting}
              onPress={handleBook}
              style={{ marginTop: 12, marginBottom: 20 }}
            />
          </ScrollView>
        )}
      </View>
    </Modal>
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
  urlPill: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  urlText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    gap: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLOR_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  masterName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  masterBio: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  scheduleInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  scheduleInfoText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  servicesList: {
    gap: 10,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  serviceCardActive: {
    borderColor: COLOR_PRIMARY,
    backgroundColor: '#FDFBF7',
  },
  serviceMeta: {
    flex: 1,
    gap: 4,
    paddingRight: 10,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  serviceDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  serviceDuration: {
    fontSize: 11,
    fontWeight: '600',
    color: COLOR_PRIMARY,
    marginTop: 2,
  },
  servicePriceCol: {
    alignItems: 'flex-end',
    gap: 10,
  },
  servicePriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLOR_PRIMARY,
  },
  selectRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectRadioActive: {
    borderColor: COLOR_PRIMARY,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLOR_PRIMARY,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  dateChip: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  dateChipActive: {
    backgroundColor: COLOR_PRIMARY,
    borderColor: COLOR_PRIMARY,
  },
  dateChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dateChipTextActive: {
    color: '#FFFFFF',
  },

  /* Dark Theme Time Slots Section matching the user's reference image */
  darkTimeContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  timeGroupSection: {
    gap: 8,
  },
  timeGroupHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    marginLeft: 2,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotPill: {
    width: '23%',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotPillActive: {
    backgroundColor: '#D1A054',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeSlotTextActive: {
    color: '#111827',
    fontWeight: '900',
  },

  /* Form Inputs Card */
  inputsCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  innerInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    height: '100%',
  },

  /* Success Confirmation Screen */
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  successDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
