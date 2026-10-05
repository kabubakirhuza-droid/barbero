import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
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
  Search,
  Zap,
  Coffee,
  Calendar,
  Sparkles,
  Clipboard,
  Contact,
  PhoneIncoming,
  WifiOff,
} from 'lucide-react-native';
import { colors, COLOR_PRIMARY, COLOR_DANGER } from '../theme/theme';
import { useTranslation } from '../i18n/LanguageContext';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { SwipeableAppointmentCard } from '../components/SwipeableAppointmentCard';
import { Appointment, Service, Client, BlockedSlot, CallLogItem } from '../types';
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

const DEFAULT_SERVICES: Service[] = [
  { id: 'srv-1', name: 'Soch olish', price: 50000, duration: 30, badgeColor: '#2563EB', isActive: true },
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
  const [clients, setClients] = useState<Client[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [callLogs, setCallLogs] = useState<CallLogItem[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Edit Sheet State
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [isEditSheetVisible, setIsEditSheetVisible] = useState(false);
  const [editClientName, setEditClientName] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editSelectedServiceId, setEditSelectedServiceId] = useState('srv-1');
  const [editNotes, setEditNotes] = useState('');

  // Reschedule Sheet State
  const [isRescheduleVisible, setIsRescheduleVisible] = useState(false);
  const [rescheduleTargetDate, setRescheduleTargetDate] = useState('');
  const [rescheduleTargetTime, setRescheduleTargetTime] = useState('');

  // Tezkor Yozuv (Quick Add Modal) State
  const [isTezkorSheetVisible, setIsTezkorSheetVisible] = useState(false);
  const [tezkorPhone, setTezkorPhone] = useState('+998 ');
  const [tezkorName, setTezkorName] = useState('');
  const [tezkorSelectedSlot, setTezkorSelectedSlot] = useState('');
  const [clipboardPhone, setClipboardPhone] = useState<string | null>(null);

  // Currently swiped appointment ID
  const [swipedAptId, setSwipedAptId] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const currentDateObj = daysStrip[selectedDateIndex] || daysStrip[0];

  const allTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

  // Load appointments, services, clients, blocked slots, call logs
  const loadData = async () => {
    try {
      const [aptRes, srvRes, clientsRes, blockedRes, callLogsRes] = await Promise.all([
        api.getAppointments().catch(() => null),
        api.getServices().catch(() => null),
        api.getClients().catch(() => null),
        api.getBlockedSlots().catch(() => null),
        api.getCallLogs(20).catch(() => null),
      ]);

      if (aptRes?.appointments) {
        setAppointments(aptRes.appointments);
        setIsOffline(false);
      }
      if (srvRes?.services && srvRes.services.length > 0) {
        setServices(srvRes.services);
      }
      if (clientsRes?.clients) {
        setClients(clientsRes.clients);
      }
      if (blockedRes?.blockedSlots) {
        setBlockedSlots(blockedRes.blockedSlots);
      }
      if (callLogsRes?.callLogs) {
        setCallLogs(callLogsRes.callLogs);
      }
    } catch (e) {
      setIsOffline(true);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, []);

  // Filter appointments for current date
  const dayAppointments = appointments.filter(
    (a) => a.date === currentDateObj.fullDate && a.status !== 'cancelled'
  );

  const dayBlockedSlots = blockedSlots.filter(
    (b) => b.appointmentDate === currentDateObj.fullDate
  );

  const dayTotalAmount = dayAppointments
    .filter((a) => a.status !== 'no_show')
    .reduce((sum, item) => sum + (Number(item.servicePrice) || 0), 0);

  // Compute available slots for today
  const availableSlotsForDate = allTimeSlots.filter((slot) => {
    const isBooked = dayAppointments.some((a) => a.startTime === slot);
    const isBlocked = dayBlockedSlots.some((b) => b.startTime === slot);
    return !isBooked && !isBlocked;
  });

  // Check clipboard when opening Tezkor sheet
  const checkClipboard = async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).clipboard?.readText) {
      try {
        const text = await (navigator as any).clipboard.readText();
        const clean = text.replace(/\D/g, '');
        if (clean.includes('998') && clean.length >= 9) {
          const digits = clean.slice(-9);
          setClipboardPhone(`+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`);
        }
      } catch (_) {}
    }
  };

  const handleOpenTezkor = () => {
    setTezkorPhone('+998 ');
    setTezkorName('');
    const firstFree = availableSlotsForDate[0] || '09:00';
    setTezkorSelectedSlot(firstFree);
    checkClipboard();
    setIsTezkorSheetVisible(true);
  };

  // Contacts picker API (where supported on Android/Chrome)
  const handlePickContact = async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'contacts' in navigator && (navigator as any).contacts?.select) {
      try {
        const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: false });
        if (contacts && contacts[0]) {
          const c = contacts[0];
          if (c.name && c.name[0]) setTezkorName(c.name[0]);
          if (c.tel && c.tel[0]) {
            const raw = c.tel[0].replace(/\D/g, '').slice(-9);
            setTezkorPhone(`+998 ${raw.slice(0, 2)} ${raw.slice(2, 5)} ${raw.slice(5, 7)} ${raw.slice(7, 9)}`);
          }
        }
      } catch (_) {}
    } else {
      showToast('Kontaktlar faqat mos brauzerlarda qo‘llab-quvvatlanadi', 'info');
    }
  };

  // 1-CLICK INSTANT BOOKING ON FREE SLOT
  const handleQuickBook = async (slotTime: string) => {
    setSwipedAptId(null);
    const nextNumber = appointments.length + 1;
    const defaultSrv = services[0] || DEFAULT_SERVICES[0];

    const tempId = `apt-${Date.now()}`;
    const newApt: Appointment = {
      id: tempId,
      clientId: `c-${Date.now()}`,
      clientName: `Mijoz ${nextNumber}`,
      clientPhone: '',
      serviceId: defaultSrv.id,
      serviceName: defaultSrv.name,
      servicePrice: defaultSrv.price,
      badgeColor: defaultSrv.badgeColor,
      date: currentDateObj.fullDate,
      startTime: slotTime,
      endTime: `${slotTime}`,
      duration: defaultSrv.duration || 30,
      status: 'confirmed',
    };

    setAppointments((prev) => [...prev, newApt]);
    showToast(`Yozuv qo'shildi (${slotTime}) · Ism qo'shish uchun bosing`, 'info');

    try {
      const res = await api.createAppointment({
        date: currentDateObj.fullDate,
        startTime: slotTime,
        serviceId: defaultSrv.id,
        serviceName: defaultSrv.name,
        servicePrice: defaultSrv.price,
        badgeColor: defaultSrv.badgeColor,
        clientName: `Mijoz ${nextNumber}`,
        duration: defaultSrv.duration || 30,
      });
      if (res?.appointment) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === tempId ? res.appointment : a))
        );
      }
    } catch (err: any) {
      console.warn('Quick booking error:', err);
    }
  };

  // Submit Tezkor Yozuv (Section 7: 3-clicks booking)
  const handleSubmitTezkor = async () => {
    const targetSlot = tezkorSelectedSlot || availableSlotsForDate[0] || '09:00';
    const cleanPhone = tezkorPhone.trim() === '+998' ? '' : tezkorPhone.trim();
    const finalName = tezkorName.trim() || `Mijoz ${appointments.length + 1}`;
    const defaultSrv = services[0] || DEFAULT_SERVICES[0];

    setIsTezkorSheetVisible(false);

    try {
      const res = await api.createAppointment({
        date: currentDateObj.fullDate,
        startTime: targetSlot,
        clientName: finalName,
        clientPhone: cleanPhone,
        serviceId: defaultSrv.id,
        serviceName: defaultSrv.name,
        servicePrice: defaultSrv.price,
        badgeColor: defaultSrv.badgeColor,
        duration: defaultSrv.duration || 30,
      });

      if (res?.appointment) {
        setAppointments((prev) => [...prev, res.appointment]);
        showToast(`Yozuv qo'shildi: ${finalName} (${targetSlot})`, 'success');

        // Log call if phone present
        if (cleanPhone) {
          api.addCallLog(cleanPhone, finalName, 'incoming_manual').catch(() => {});
        }
      }
    } catch (e: any) {
      showToast(e.message || "Yozuv qo'shishda xatolik yuz berdi", 'error');
    }
  };

  // Format phone mask
  const formatPhoneInput = (text: string, setter: (val: string) => void) => {
    let digits = text.replace(/\D/g, '');
    if (digits.startsWith('998')) {
      digits = digits.slice(3);
    }
    const raw = digits.slice(0, 9);
    let res = '+998';
    if (!raw) {
      setter('+998 ');
      return;
    }
    res += ' ';
    for (let i = 0; i < raw.length; i++) {
      if (i === 2 || i === 5 || i === 7) {
        res += ' ';
      }
      res += raw[i];
    }
    setter(res);

    // Auto match client
    if (raw.length >= 4) {
      const match = clients.find((c) => c.phone.replace(/\D/g, '').includes(raw));
      if (match && !tezkorName) {
        setTezkorName(match.name);
      }
    }
  };

  // Tap on card -> Edit sheet
  const handleCardPress = (apt: Appointment) => {
    if (swipedAptId) {
      setSwipedAptId(null);
      return;
    }
    setEditingApt(apt);
    setEditClientName(apt.clientName);
    setEditClientPhone(apt.clientPhone || '+998 ');
    setEditSelectedServiceId(apt.serviceId || 'srv-1');
    setEditNotes(apt.note || '');
    setIsEditSheetVisible(true);
  };

  // Save changes from Edit Sheet
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
      note: editNotes,
    };

    setAppointments((prev) =>
      prev.map((a) => (a.id === editingApt.id ? updatedApt : a))
    );
    setIsEditSheetVisible(false);

    try {
      await api.updateAppointment(editingApt.id, updatedApt);
      showToast('Yozuv muvaffaqiyatli saqlandi', 'success');
    } catch (e: any) {
      showToast(e.message || 'Saqlashda xatolik yuz berdi', 'error');
    }
  };

  // Status Change ("Keldi", "Tugadi", "Kelmadi")
  const handleStatusChange = async (status: 'arrived' | 'done' | 'no_show') => {
    if (!editingApt) return;
    const updatedStatus = status === 'done' ? 'completed' : status;
    setAppointments((prev) =>
      prev.map((a) => (a.id === editingApt.id ? { ...a, status: updatedStatus as any } : a))
    );
    setIsEditSheetVisible(false);

    try {
      await api.updateAppointmentStatus(editingApt.id, status);
      showToast(`Status yangilandi: ${status === 'arrived' ? 'Keldi' : status === 'done' ? 'Tugadi' : 'Kelmadi'}`, 'info');
    } catch (_) {}
  };

  // Long press on empty slot: Dam olish (Block slot)
  const handleLongPressSlot = async (slotTime: string) => {
    confirmAction(
      'Dam olish vaqtini yopish',
      `${currentDateObj.dayNumber}-${currentDateObj.monthName}, soat ${slotTime} vaqtini "Dam olish" deb belgilamoqchimisiz?`,
      async () => {
        try {
          const res = await api.createBlockedSlot({
            appointmentDate: currentDateObj.fullDate,
            startTime: slotTime,
            reason: 'Dam olish',
          });
          if (res?.blockedSlot) {
            setBlockedSlots((prev) => [...prev, res.blockedSlot]);
            showToast(`Vaqt yopildi: ${slotTime} (Dam olish)`, 'info');
          }
        } catch (e: any) {
          showToast(e.message || 'Xatolik yuz berdi', 'error');
        }
      },
      'Ha, yopish',
      'Bekor qilish'
    );
  };

  // Unblock slot
  const handleUnblockSlot = async (blockedId: string) => {
    confirmAction(
      'Vaqtni qayta ochish',
      'Ushbu vaqtni qayta bo‘shatmoqchimisiz?',
      async () => {
        try {
          await api.deleteBlockedSlot(blockedId);
          setBlockedSlots((prev) => prev.filter((b) => b.id !== blockedId));
          showToast('Vaqt qayta ochildi', 'success');
        } catch (_) {}
      }
    );
  };

  // Reschedule Action
  const handleReschedule = async () => {
    if (!editingApt || !rescheduleTargetDate || !rescheduleTargetTime) return;
    try {
      await api.rescheduleAppointment(editingApt.id, rescheduleTargetDate, rescheduleTargetTime);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === editingApt.id
            ? { ...a, date: rescheduleTargetDate, startTime: rescheduleTargetTime }
            : a
        )
      );
      setIsRescheduleVisible(false);
      setIsEditSheetVisible(false);
      showToast(`Yozuv ${rescheduleTargetDate} soat ${rescheduleTargetTime} ga koʻchirildi`, 'success');
    } catch (e: any) {
      showToast(e.message || "Yozuvni ko'chirishda xatolik", 'error');
    }
  };

  // Cancel Appointment
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
          setAppointments(previousApts);
          showToast(e.message || "Yozuvni bekor qilib bo'lmadi", 'error');
        }
      },
      'Ha, bekor qilish',
      "Yo'q",
      true
    );
  };

  // Call Client
  const handleCallClient = (phone?: string, name?: string) => {
    if (!phone || phone.trim() === '' || phone === '+998') {
      showToast('Iltimos, avval mijoz telefon raqamini kiriting', 'error');
      return;
    }
    const cleanPhone = phone.replace(/[^\d+]/g, '');

    // Record in call log
    api.addCallLog(cleanPhone, name, 'outgoing_call').catch(() => {});

    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      showToast(`${phone} raqamiga qo'ng'iroq qilinmoqda...`, 'info');
    });
  };

  // Filtered slots by search query
  const filteredAppointments = searchQuery.trim()
    ? dayAppointments.filter(
        (a) =>
          a.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.clientPhone.replace(/\D/g, '').includes(searchQuery.replace(/\D/g, ''))
      )
    : dayAppointments;

  return (
    <TouchableWithoutFeedback onPress={() => setSwipedAptId(null)}>
      <View style={styles.container}>
        {/* Offline notice */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <WifiOff size={14} color="#FFFFFF" />
            <Text style={styles.offlineText}>Internet yo'q · Keshdan ko'rsatilmoqda</Text>
          </View>
        )}

        {/* 1. Top Header: Month selector & Income toggle */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.monthSelector} activeOpacity={0.7}>
            <Text style={styles.monthText}>{`${currentDateObj.monthName}, ${currentDateObj.year}`}</Text>
            <ChevronDown size={18} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.topRightRow}>
            <TouchableOpacity
              style={styles.searchToggleBtn}
              onPress={() => setIsSearchOpen(!isSearchOpen)}
              activeOpacity={0.7}
            >
              <Search size={18} color={isSearchOpen ? COLOR_PRIMARY : colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.incomeCounter}
              onPress={() => setShowIncome(!showIncome)}
              activeOpacity={0.7}
            >
              {showIncome ? (
                <Eye size={16} color={colors.textSecondary} />
              ) : (
                <EyeOff size={16} color={colors.textSecondary} />
              )}
              <Text style={styles.incomeAmountText}>
                {showIncome ? `${dayTotalAmount.toLocaleString('uz-UZ')} uzs` : '•••• uzs'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search input bar */}
        {isSearchOpen && (
          <View style={styles.searchBar}>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Ism yoki raqam bo'yicha qidirish..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        )}

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
          ref={scrollViewRef}
          style={styles.slotsScrollView}
          contentContainerStyle={styles.slotsScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {allTimeSlots.map((time) => {
            const bookedApt = filteredAppointments.find((a) => a.startTime === time);
            const blockedSlot = dayBlockedSlots.find((b) => b.startTime === time);
            const isSwiped = Boolean(bookedApt && swipedAptId === bookedApt.id);

            // Blocked / Break Slot
            if (blockedSlot) {
              return (
                <View key={time} style={styles.slotRowContainer}>
                  <View style={styles.slotTimeCol}>
                    <Text style={styles.slotTimeLabel}>{time}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.blockedSlotCard}
                    onPress={() => handleUnblockSlot(blockedSlot.id)}
                    activeOpacity={0.7}
                  >
                    <Coffee size={16} color={colors.textMuted} />
                    <Text style={styles.blockedSlotText}>Dam olish (Bosing ochish uchun)</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            // Occupied Appointment
            if (bookedApt) {
              return (
                <View key={time} style={styles.slotRowContainer}>
                  <View style={styles.slotTimeCol}>
                    <Text style={styles.slotTimeLabel}>{time}</Text>
                  </View>
                  <SwipeableAppointmentCard
                    appointment={bookedApt}
                    isOpen={isSwiped}
                    onOpen={() => setSwipedAptId(bookedApt.id)}
                    onClose={() => setSwipedAptId(null)}
                    onPress={() => handleCardPress(bookedApt)}
                    onCancel={() => handleCancelApt(bookedApt.id)}
                    onCall={(phone) => handleCallClient(phone, bookedApt.clientName)}
                  />
                </View>
              );
            }

            // Empty Slot (1-Click Booking or Long Press for Dam olish)
            return (
              <View key={time} style={styles.slotRowContainer}>
                <View style={styles.slotTimeCol}>
                  <Text style={styles.slotTimeLabel}>{time}</Text>
                </View>
                <TouchableOpacity
                  style={styles.freeSlotCard}
                  onPress={() => handleQuickBook(time)}
                  onLongPress={() => handleLongPressSlot(time)}
                  delayLongPress={450}
                  activeOpacity={0.65}
                >
                  <Plus size={16} color={COLOR_PRIMARY} />
                  <Text style={styles.freeSlotText}>Bo'sh vaqt</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>

        {/* 4. Floating Action Button: TEZKOR YOZUV (Instant Add) */}
        <TouchableOpacity
          style={styles.fabTezkor}
          onPress={handleOpenTezkor}
          activeOpacity={0.85}
          accessibilityLabel="Tezkor yozuv"
        >
          <Zap size={22} color="#FFFFFF" />
          <Text style={styles.fabTezkorText}>Tezkor yozuv</Text>
        </TouchableOpacity>

        {/* 5. BOTTOM SHEET: TEZKOR YOZUV (Section 7) */}
        <BottomSheet
          visible={isTezkorSheetVisible}
          onClose={() => setIsTezkorSheetVisible(false)}
          title="⚡ Tezkor yozuv"
        >
          <View style={styles.tezkorContent}>
            {/* Phone input */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mijoz telefon raqami</Text>
              <View style={styles.inputWithIcon}>
                <Phone size={18} color={COLOR_PRIMARY} />
                <TextInput
                  style={styles.textInputInside}
                  value={tezkorPhone}
                  onChangeText={(val) => formatPhoneInput(val, setTezkorPhone)}
                  keyboardType="phone-pad"
                  placeholder="+998 90 123 45 67"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />
              </View>
            </View>

            {/* Client name input (optional) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Ismi (ixtiyoriy)</Text>
              <View style={styles.inputWithIcon}>
                <UserIcon size={18} color={COLOR_PRIMARY} />
                <TextInput
                  style={styles.textInputInside}
                  value={tezkorName}
                  onChangeText={setTezkorName}
                  placeholder="Mijoz ismi"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Fast source chips */}
            <View style={styles.quickSourcesRow}>
              {clipboardPhone && (
                <TouchableOpacity
                  style={styles.sourceChip}
                  onPress={() => setTezkorPhone(clipboardPhone)}
                >
                  <Clipboard size={14} color={COLOR_PRIMARY} />
                  <Text style={styles.sourceChipText}>Nusxalangan: {clipboardPhone.slice(-8)}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.sourceChip} onPress={handlePickContact}>
                <Contact size={14} color={COLOR_PRIMARY} />
                <Text style={styles.sourceChipText}>Kontaktlardan</Text>
              </TouchableOpacity>
            </View>

            {/* Free slots chips: Eng yaqin bo'sh vaqt */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Qabul vaqti</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotChipsRow}>
                {availableSlotsForDate.slice(0, 4).map((slot, index) => {
                  const isSelected = tezkorSelectedSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                      onPress={() => setTezkorSelectedSlot(slot)}
                    >
                      <Clock size={13} color={isSelected ? '#FFFFFF' : COLOR_PRIMARY} />
                      <Text style={[styles.slotChipText, isSelected && styles.slotChipTextSelected]}>
                        {index === 0 ? `Eng yaqin (${slot})` : slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Oxirgi qo'ng'iroqlar (Last 20 unique callers in past 30 days) */}
            {callLogs.length > 0 && (
              <View style={styles.callLogsSection}>
                <Text style={styles.sectionSubTitle}>Oxirgi qo'ng'iroqlar</Text>
                <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
                  {callLogs.slice(0, 6).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.callLogRow}
                      onPress={() => {
                        setTezkorPhone(item.phone);
                        if (item.name && item.name !== "Noma'lum") {
                          setTezkorName(item.name);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.callLogAvatar}>
                        <Text style={styles.avatarLetter}>{(item.name || item.phone)[0].toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.callerName}>{item.name}</Text>
                        <Text style={styles.callerPhone}>{item.phone}</Text>
                      </View>
                      {item.isClient && (
                        <View style={styles.mijozBadge}>
                          <Text style={styles.mijozBadgeText}>Mijoz</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Large 3-clicks Add Button */}
            <Button
              title="Qo'shish (3 ta bosishda)"
              onPress={handleSubmitTezkor}
              style={{ marginTop: 14, minHeight: 48 }}
            />
          </View>
        </BottomSheet>

        {/* 6. BOTTOM SHEET: EDIT APPOINTMENT */}
        {editingApt && (
          <BottomSheet
            visible={isEditSheetVisible}
            onClose={() => setIsEditSheetVisible(false)}
            title="Yozuvni tahrirlash"
          >
            <View style={styles.editSheetContent}>
              <View style={styles.goldenTimePill}>
                <Clock size={16} color={COLOR_PRIMARY} />
                <Text style={styles.goldenTimeText}>
                  {currentDateObj.dayNumber}-{currentDateObj.monthName}, {editingApt.startTime}
                </Text>
              </View>

              {/* Status Action Buttons: Keldi, Tugadi, Kelmadi */}
              <View style={styles.statusButtonsRow}>
                <TouchableOpacity
                  style={[styles.statusBtn, { backgroundColor: '#DCFCE7' }]}
                  onPress={() => handleStatusChange('arrived')}
                >
                  <Text style={[styles.statusBtnText, { color: '#16A34A' }]}>Keldi</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusBtn, { backgroundColor: '#DBEAFE' }]}
                  onPress={() => handleStatusChange('done')}
                >
                  <Text style={[styles.statusBtnText, { color: '#2563EB' }]}>Tugadi</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusBtn, { backgroundColor: '#FEE2E2' }]}
                  onPress={() => handleStatusChange('no_show')}
                >
                  <Text style={[styles.statusBtnText, { color: '#DC2626' }]}>Kelmadi</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Mijoz ismi</Text>
                <View style={styles.inputWithIcon}>
                  <UserIcon size={18} color={COLOR_PRIMARY} />
                  <TextInput
                    style={styles.textInputInside}
                    value={editClientName}
                    onChangeText={setEditClientName}
                    placeholder="Mijoz ismi"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Telefon raqami</Text>
                <View style={styles.inputWithIcon}>
                  <Phone size={18} color={COLOR_PRIMARY} />
                  <TextInput
                    style={styles.textInputInside}
                    value={editClientPhone}
                    onChangeText={(val) => formatPhoneInput(val, setEditClientPhone)}
                    keyboardType="phone-pad"
                    placeholder="+998 90 123 45 67"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Xizmatni tanlang</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesChipsRow}>
                  {services.map((srv) => {
                    const isSelected = editSelectedServiceId === srv.id;
                    return (
                      <TouchableOpacity
                        key={srv.id}
                        style={[styles.serviceChip, isSelected && styles.serviceChipSelected]}
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

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Izoh / Eslatma</Text>
                <TextInput
                  style={styles.notesInput}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Masalan: Soqol uchun maxsus moy ishlatish..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
              </View>

              {/* Actions row: Ko'chirish + Saqlash */}
              <View style={styles.actionsBottomRow}>
                <TouchableOpacity
                  style={styles.rescheduleBtn}
                  onPress={() => {
                    setRescheduleTargetDate(editingApt.date);
                    setRescheduleTargetTime(editingApt.startTime);
                    setIsRescheduleVisible(true);
                  }}
                >
                  <Calendar size={18} color={COLOR_PRIMARY} />
                  <Text style={styles.rescheduleBtnText}>Ko'chirish</Text>
                </TouchableOpacity>

                <Button
                  title="Saqlash"
                  onPress={handleSaveEdit}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </BottomSheet>
        )}

        {/* 7. BOTTOM SHEET: RESCHEDULE (Ko'chirish) */}
        <BottomSheet
          visible={isRescheduleVisible}
          onClose={() => setIsRescheduleVisible(false)}
          title="Yozuvni ko'chirish"
        >
          <View style={styles.rescheduleContent}>
            <Text style={styles.formLabel}>Yangi qabul vaqtini tanlang:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotChipsRow}>
              {availableSlotsForDate.map((slot) => {
                const isSelected = rescheduleTargetTime === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                    onPress={() => setRescheduleTargetTime(slot)}
                  >
                    <Text style={[styles.slotChipText, isSelected && styles.slotChipTextSelected]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Button
              title="Ko'chirishni tasdiqlash"
              onPress={handleReschedule}
              style={{ marginTop: 20 }}
            />
          </View>
        </BottomSheet>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textSecondary,
    paddingVertical: 5,
    gap: 6,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
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
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
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
    color: COLOR_PRIMARY,
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
  },
  dateCardActive: {
    backgroundColor: COLOR_PRIMARY,
    borderColor: COLOR_PRIMARY,
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
    paddingBottom: 120,
    gap: 10,
    paddingTop: 6,
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
  freeSlotCard: {
    flex: 1,
    height: 62,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: 'rgba(241, 245, 249, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  freeSlotText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  blockedSlotCard: {
    flex: 1,
    height: 62,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  blockedSlotText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  fabTezkor: {
    position: 'absolute',
    right: 18,
    bottom: 84,
    backgroundColor: COLOR_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 8,
    shadowColor: COLOR_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 99,
  },
  fabTezkorText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  tezkorContent: {
    paddingBottom: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  textInputInside: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    padding: 0,
  },
  quickSourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  sourceChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLOR_PRIMARY,
  },
  slotChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    gap: 6,
  },
  slotChipSelected: {
    backgroundColor: COLOR_PRIMARY,
  },
  slotChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  slotChipTextSelected: {
    color: '#FFFFFF',
  },
  callLogsSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: 8,
  },
  sectionSubTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  callLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  callLogAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: '800',
    color: COLOR_PRIMARY,
  },
  callerName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  callerPhone: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  mijozBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mijozBadgeText: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '700',
  },
  editSheetContent: {
    paddingBottom: 16,
  },
  goldenTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 14,
  },
  goldenTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  statusBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  servicesChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  serviceChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: COLOR_PRIMARY,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chipNameSelected: {
    color: COLOR_PRIMARY,
    fontWeight: '800',
  },
  chipPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  notesInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  actionsBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  rescheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: COLOR_PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
    minHeight: 48,
  },
  rescheduleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  rescheduleContent: {
    paddingBottom: 20,
  },
});
