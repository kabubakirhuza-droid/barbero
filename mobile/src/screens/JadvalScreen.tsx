import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Linking,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  Eye,
  EyeOff,
  Plus,
  Coins,
  Phone,
  Trash2,
  User as UserIcon,
  Clock,
  ChevronDown,
} from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { useTranslation } from '../i18n/LanguageContext';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { SwipeableAppointmentCard } from '../components/SwipeableAppointmentCard';
import { Appointment, Service } from '../types';
import { api } from '../api/apiClient';
import { confirmAction, showToast } from '../utils/alerts';

interface JadvalScreenProps {
  onAddServicePress?: () => void;
}

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const UZ_DAYS = ['Yak', 'Dush', 'Se', 'Cho', 'Pay', 'Jum', 'Sha'];

const generateDateStrip = (daysBefore = 7, daysAfter = 21) => {
  const strip = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - daysBefore);

  for (let i = 0; i <= daysBefore + daysAfter; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const fullDate = `${year}-${month}-${day}`;

    strip.push({
      dayNumber: String(d.getDate()),
      dayName: UZ_DAYS[d.getDay()],
      monthName: UZ_MONTHS[d.getMonth()],
      year: d.getFullYear(),
      fullDate,
      isToday: i === daysBefore,
    });
  }
  return strip;
};

// 5 default services as specified in prompt v2
const DEFAULT_SERVICES: Service[] = [
  { id: 'srv-1', name: 'Soch olish', price: 50000, duration: 30, badgeColor: '#A67C2E', isActive: true },
  { id: 'srv-2', name: 'Soch + soqol', price: 70000, duration: 30, badgeColor: '#2563EB', isActive: true },
  { id: 'srv-3', name: 'Bolalar sochi', price: 30000, duration: 30, badgeColor: '#10B981', isActive: true },
  { id: 'srv-4', name: 'Soqol olish', price: 30000, duration: 30, badgeColor: '#F59E0B', isActive: true },
  { id: 'srv-5', name: 'Kreativ soqol tekislash', price: 45000, duration: 30, badgeColor: '#8B5CF6', isActive: true },
];

export const JadvalScreen: React.FC<JadvalScreenProps> = () => {
  const { t } = useTranslation();
  const [showIncome, setShowIncome] = useState(true);
  const [daysStrip] = useState(() => generateDateStrip(7, 21));
  const [selectedDateIndex, setSelectedDateIndex] = useState(7); // Today by default
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);

  // Edit Sheet State (opened on second click of an appointment)
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [isEditSheetVisible, setIsEditSheetVisible] = useState(false);
  const [editClientName, setEditClientName] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editSelectedServiceId, setEditSelectedServiceId] = useState('srv-1');

  // Currently swiped appointment ID
  const [swipedAptId, setSwipedAptId] = useState<string | null>(null);

  const currentDateObj = daysStrip[selectedDateIndex] || daysStrip[0];

  // 30-min time slots from 09:00 to 20:30
  const allTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

  // Load appointments
  const loadAppointments = async () => {
    try {
      const res = await api.getAppointments();
      if (res?.appointments) {
        setAppointments(res.appointments);
      }
      const srvRes = await api.getServices();
      if (srvRes?.services && srvRes.services.length > 0) {
        setServices(srvRes.services);
      }
    } catch (e) {
      // Offline fallback initial appointment
      setAppointments((prev) =>
        prev.length > 0
          ? prev
          : [
              {
                id: 'apt-1',
                clientId: 'c-1',
                clientName: 'Mijoz 1',
                clientPhone: '+998 90 123 45 67',
                serviceId: 'srv-1',
                serviceName: 'Soch olish',
                servicePrice: 50000,
                badgeColor: '#A67C2E',
                date: '2026-09-29',
                startTime: '09:30',
                endTime: '10:00',
                duration: 30,
                status: 'confirmed',
              },
            ]
      );
    }
  };

  useEffect(() => {
    loadAppointments();
    const interval = setInterval(loadAppointments, 3000);
    return () => clearInterval(interval);
  }, []);

  const dayAppointments = appointments.filter(
    (a) => a.date === currentDateObj.fullDate && a.status !== 'cancelled'
  );

  const dayTotalAmount = dayAppointments.reduce((sum, item) => sum + item.servicePrice, 0);

  // 1-CLICK BOOKING (CRITICAL PROMPT REQUIREMENT)
  // Single click on empty slot immediately creates appointment: "Mijoz N", default "Soch olish" 50 000 uzs
  const handleQuickBook = async (slotTime: string) => {
    setSwipedAptId(null);
    const nextNumber = appointments.length + 1;
    const defaultSrv = services[0] || DEFAULT_SERVICES[0];

    const tempId = `apt-${Date.now()}`;
    const newApt: Appointment = {
      id: tempId,
      clientId: `c-${Date.now()}`,
      clientName: `Mijoz ${nextNumber}`,
      clientPhone: '', // Initial has no phone until edited
      serviceId: defaultSrv.id,
      serviceName: defaultSrv.name,
      servicePrice: defaultSrv.price,
      badgeColor: defaultSrv.badgeColor,
      date: currentDateObj.fullDate,
      startTime: slotTime,
      endTime: `${slotTime} + 30`,
      duration: 30,
      status: 'confirmed',
    };

    // Instant UI update
    setAppointments((prev) => [...prev, newApt]);

    try {
      const res = await api.quickBookAppointment({
        date: currentDateObj.fullDate,
        startTime: slotTime,
        serviceId: defaultSrv.id,
      });
      if (res?.appointment) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === tempId ? res.appointment : a))
        );
      }
    } catch (err) {
      console.warn('Quick booking offline fallback');
    }
  };

  // Format phone mask: +998 XX XXX XX XX
  const formatPhoneInput = (text: string) => {
    let digits = text.replace(/\D/g, '');
    if (digits.startsWith('998')) {
      digits = digits.slice(3);
    }
    const raw = digits.slice(0, 9);
    let res = '+998';
    if (!raw) {
      setEditClientPhone('+998 ');
      return;
    }
    res += ' ';
    for (let i = 0; i < raw.length; i++) {
      if (i === 2 || i === 5 || i === 7) {
        res += ' ';
      }
      res += raw[i];
    }
    setEditClientPhone(res);
  };

  // REPEAT CLICK ON OCCUPIED APPOINTMENT: Open Edit Bottom Sheet
  const handleCardPress = (apt: Appointment) => {
    if (swipedAptId === apt.id) {
      // If already swiped open, tap closes swipe
      setSwipedAptId(null);
      return;
    }
    if (swipedAptId) {
      // Tap outside closing current swipe
      setSwipedAptId(null);
      return;
    }

    setEditingApt(apt);
    setEditClientName(apt.clientName);
    
    // Ensure +998 is pre-filled
    let initialPhone = apt.clientPhone || '';
    if (!initialPhone || initialPhone.trim() === '') {
      initialPhone = '+998 90 ';
    }
    setEditClientPhone(initialPhone);
    setEditSelectedServiceId(apt.serviceId || 'srv-1');
    setIsEditSheetVisible(true);
  };

  // Toggle swipe for item
  const handleToggleSwipe = (aptId: string) => {
    setSwipedAptId((prev) => (prev === aptId ? null : aptId));
  };

  // Save changes from Edit Bottom Sheet
  const handleSaveEdit = async () => {
    if (!editingApt) return;

    const matchedService = services.find((s) => s.id === editSelectedServiceId) || services[0] || DEFAULT_SERVICES[0];

    const updatedApt: Appointment = {
      ...editingApt,
      clientName: editClientName.trim() || editingApt.clientName,
      clientPhone: editClientPhone.trim(),
      serviceId: matchedService.id,
      serviceName: matchedService.name,
      servicePrice: matchedService.price,
      badgeColor: matchedService.badgeColor,
    };

    setAppointments((prev) =>
      prev.map((a) => (a.id === editingApt.id ? updatedApt : a))
    );
    setIsEditSheetVisible(false);

    try {
      await api.updateAppointment(editingApt.id, updatedApt);
    } catch (e) {
      // offline fallback
    }
  };

  // Cancel Appointment with Optimistic UI and Rollback
  const handleCancelApt = (aptId: string) => {
    const targetApt = appointments.find((a) => a.id === aptId);
    confirmAction(
      'Yozuvni bekor qilish',
      targetApt
        ? `${targetApt.clientName} (${targetApt.startTime}) yozuvini bekor qilmoqchimisiz?`
        : 'Haqiqatan ham ushbu yozuvni bekor qilmoqchimisiz?',
      async () => {
        const previousApts = [...appointments];
        setAppointments((prev) => prev.filter((a) => a.id !== aptId));
        setSwipedAptId(null);
        try {
          await api.deleteAppointment(aptId);
          showToast('Yozuv bekor qilindi', 'info');
        } catch (e: any) {
          // Rollback on error
          setAppointments(previousApts);
          showToast(e.message || "Yozuvni bekor qilib bo'lmadi. Qayta urinib ko'ring", 'error');
        }
      },
      'Ha, bekor qilish',
      "Yo'q",
      true
    );
  };

  // Call Client
  const handleCallClient = (phone?: string) => {
    if (!phone || phone.trim() === '' || phone === '+998 90 000 00 00') {
      showToast('Iltimos, avval mijoz telefon raqamini kiriting', 'error');
      return;
    }
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      showToast(`${phone} raqamiga qo'ng'iroq qilinmoqda...`, 'info');
    });
  };

  return (
    <TouchableWithoutFeedback onPress={() => setSwipedAptId(null)}>
      <View style={styles.container}>
        {/* 1. Header Bar: Month dropdown & Day Total with Eye toggle */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.monthSelector} activeOpacity={0.7}>
            <Text style={styles.monthText}>{`${currentDateObj.monthName}, ${currentDateObj.year}`}</Text>
            <ChevronDown size={18} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.incomeCounter}
            onPress={() => setShowIncome(!showIncome)}
            activeOpacity={0.7}
          >
            {showIncome ? (
              <Eye size={18} color={colors.textSecondary} />
            ) : (
              <EyeOff size={18} color={colors.textSecondary} />
            )}
            <Text style={styles.incomeAmountText}>
              {showIncome ? `${dayTotalAmount.toLocaleString('uz-UZ')} uzs` : '•••• uzs'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Horizontal Date Strip */}
        <View style={styles.dateStripWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStripContent}
          >
            {daysStrip.map((item, idx) => {
              const isSelected = selectedDateIndex === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dateCard, isSelected && styles.dateCardActive]}
                  onPress={() => {
                    setSelectedDateIndex(idx);
                    setSwipedAptId(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayNumberText, isSelected && styles.dayNumberActiveText]}>
                    {item.dayNumber}
                  </Text>
                  <Text style={[styles.dayNameText, isSelected && styles.dayNameActiveText]}>
                    {item.dayName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. Time Slots List */}
        <ScrollView
          style={styles.slotsScrollView}
          contentContainerStyle={styles.slotsScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {allTimeSlots.map((time) => {
            const bookedApt = dayAppointments.find((a) => a.startTime === time);
            const isSwiped = Boolean(bookedApt && swipedAptId === bookedApt.id);

            if (bookedApt) {
              return (
                <View key={time} style={styles.slotRowContainer}>
                  {/* Time Indicator */}
                  <View style={styles.slotTimeCol}>
                    <Text style={styles.slotTimeLabel}>{time}</Text>
                  </View>

                  {/* Real Swipeable Appointment Card */}
                  <SwipeableAppointmentCard
                    appointment={bookedApt}
                    isOpen={isSwiped}
                    onOpen={() => setSwipedAptId(bookedApt.id)}
                    onClose={() => setSwipedAptId(null)}
                    onPress={() => handleCardPress(bookedApt)}
                    onCancel={() => handleCancelApt(bookedApt.id)}
                    onCall={(phone) => handleCallClient(phone)}
                  />
                </View>
              );
            }

            {/* Empty Slot: Click IMMEDIATELY creates booking! */}
            return (
              <View key={time} style={styles.slotRowContainer}>
                <View style={styles.slotTimeCol}>
                  <Text style={styles.slotTimeLabel}>{time}</Text>
                </View>

                <TouchableOpacity
                  style={styles.freeSlotCard}
                  onPress={() => handleQuickBook(time)}
                  activeOpacity={0.65}
                >
                  <Plus size={16} color={COLOR_PRIMARY} />
                  <Text style={styles.freeSlotText}>Bo'sh vaqt</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>

        {/* 4. BOTTOM SHEET: EDIT APPOINTMENT (Yozuvni tahrirlash) */}
        {editingApt && (
          <BottomSheet
            visible={isEditSheetVisible}
            onClose={() => setIsEditSheetVisible(false)}
            title="Yozuvni tahrirlash"
          >
            <View style={styles.editSheetContent}>
              {/* Golden Time Pill: e.g. "29-sentyabr, 09:30" */}
              <View style={styles.goldenTimePill}>
                <Clock size={16} color={colors.primary} />
                <Text style={styles.goldenTimeText}>
                  {currentDateObj.dayNumber}-sentyabr, {editingApt.startTime}
                </Text>
              </View>

              {/* Field: Mijoz ismi */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Mijoz ismi</Text>
                <View style={styles.inputWithIcon}>
                  <UserIcon size={18} color={colors.primary} />
                  <TextInput
                    style={styles.textInputInside}
                    value={editClientName}
                    onChangeText={setEditClientName}
                    placeholder="Mijoz 5"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {/* Field: Telefon raqami */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Telefon raqami</Text>
                <View style={styles.inputWithIcon}>
                  <Phone size={18} color={colors.primary} />
                  <TextInput
                    style={styles.textInputInside}
                    value={editClientPhone}
                    onChangeText={formatPhoneInput}
                    keyboardType="phone-pad"
                    placeholder="+998 90 123 45 67"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {/* Block: Xizmatni tanlang (Chips) */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Xizmatni tanlang</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.servicesChipsRow}
                >
                  {services.map((srv) => {
                    const isSelected = editSelectedServiceId === srv.id;
                    return (
                      <TouchableOpacity
                        key={srv.id}
                        style={[
                          styles.serviceChip,
                          isSelected && styles.serviceChipSelected,
                        ]}
                        onPress={() => setEditSelectedServiceId(srv.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.chipDot, { backgroundColor: srv.badgeColor }]} />
                        <Text style={[styles.chipName, isSelected && styles.chipNameSelected]}>
                          {srv.name}
                        </Text>
                        <Text style={styles.chipPrice}>
                          {srv.price.toLocaleString()} uzs
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Wide Golden Save Button */}
              <Button
                title="Saqlash"
                onPress={handleSaveEdit}
                style={{ marginTop: 18 }}
              />
            </View>
          </BottomSheet>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  incomeCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  incomeAmountText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  dateStripWrapper: {
    marginBottom: 8,
  },
  dateStripContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  dateCard: {
    width: 58,
    height: 68,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  dateCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayNumberText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dayNumberActiveText: {
    color: '#FFFFFF',
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  dayNameActiveText: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  slotsScrollView: {
    flex: 1,
  },
  slotsScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 12,
    paddingTop: 8,
  },
  slotRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotTimeCol: {
    width: 48,
  },
  slotTimeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  swipeContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
  },
  revealedActionsRow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 1,
  },
  actionSquareRed: {
    width: 68,
    height: '100%',
    borderRadius: 16,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionSquareGold: {
    width: 68,
    height: '100%',
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionSquareText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  occupiedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF6F0',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 2,
  },
  occupiedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clientAvatarMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  occupiedInfo: {
    gap: 2,
  },
  clientNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  clientPhoneMini: {
    fontSize: 11,
    color: colors.textMuted,
  },
  occupiedRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  serviceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  serviceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  freeSlotCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 18,
    height: 54,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderStyle: 'dashed',
  },
  freeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  editSheetContent: {
    paddingBottom: 20,
  },
  goldenTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorderSubtle,
    alignSelf: 'flex-start',
  },
  goldenTimeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  textInputInside: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },
  servicesChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  serviceChip: {
    backgroundColor: colors.inputBackground,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    minWidth: 100,
    gap: 4,
  },
  serviceChipSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFFBF5',
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  chipName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chipNameSelected: {
    color: colors.primary,
  },
  chipPrice: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
});
