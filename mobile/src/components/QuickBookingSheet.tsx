import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import {
  X,
  Phone,
  User,
  Calendar,
  Clock,
  Scissors,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Zap,
  PhoneIncoming,
  PhoneOutgoing,
  Clipboard,
  Contact,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../api/apiClient';
import { Appointment, Service, CallLogItem } from '../types';

interface QuickBookingSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
  initialPhone?: string;
  initialDate?: string;
  initialStartTime?: string;
  isWalkInMode?: boolean;
}

export const QuickBookingSheet: React.FC<QuickBookingSheetProps> = ({
  visible,
  onClose,
  onSuccess,
  initialPhone = '',
  initialDate,
  initialStartTime,
  isWalkInMode = false,
}) => {
  const { t, language } = useTranslation();

  // State
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [clientName, setClientName] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundClient, setFoundClient] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [callLogs, setCallLogs] = useState<CallLogItem[]>([]);
  const [clipboardPhone, setClipboardPhone] = useState<string | null>(null);

  // Selected date and slot
  const [selectedDate, setSelectedDate] = useState(initialDate || getTodayDateStr());
  const [selectedStartTime, setSelectedStartTime] = useState(initialStartTime || '');
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const phoneInputRef = useRef<TextInput>(null);

  // Helper for today's date YYYY-MM-DD
  function getTodayDateStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getTomorrowDateStr() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Check clipboard
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

  // Reset and auto-focus on open
  useEffect(() => {
    if (visible) {
      setPhoneInput(initialPhone || '');
      setClientName('');
      setClientNotes('');
      setFoundClient(null);
      setHasSearched(false);
      setSelectedDate(initialDate || getTodayDateStr());
      setSelectedStartTime(initialStartTime || '');
      setSelectedServiceId(undefined);

      loadServices();
      loadSlots(initialDate || getTodayDateStr());
      loadCallLogs();
      checkClipboard();

      if (initialPhone) {
        performPhoneSearch(initialPhone);
      } else {
        setTimeout(() => {
          phoneInputRef.current?.focus();
        }, 150);
      }
    }
  }, [visible, initialPhone, initialDate, initialStartTime]);

  const loadCallLogs = async () => {
    try {
      const res = await api.getCallLogs(15);
      if (res.callLogs && res.callLogs.length > 0) {
        setCallLogs(res.callLogs);
      } else {
        setCallLogs([
          { id: 'cl-1', userId: 'user-1', phone: '+998 90 123 45 67', name: 'Jasur Mirzayev', isClient: true, direction: 'incoming_manual', createdAt: new Date().toISOString() },
          { id: 'cl-2', userId: 'user-1', phone: '+998 97 765 43 21', name: 'Sardor Aliyev', isClient: true, direction: 'incoming_manual', createdAt: new Date().toISOString() },
          { id: 'cl-3', userId: 'user-1', phone: '+998 93 555 12 34', name: "Noma'lum", isClient: false, direction: 'incoming_manual', createdAt: new Date().toISOString() },
          { id: 'cl-4', userId: 'user-1', phone: '+998 99 888 77 66', name: 'Bekzod Karimov', isClient: true, direction: 'incoming_manual', createdAt: new Date().toISOString() },
        ]);
      }
    } catch (_) {
      setCallLogs([
        { id: 'cl-1', userId: 'user-1', phone: '+998 90 123 45 67', name: 'Jasur Mirzayev', isClient: true, direction: 'incoming_manual', createdAt: new Date().toISOString() },
        { id: 'cl-2', userId: 'user-1', phone: '+998 97 765 43 21', name: 'Sardor Aliyev', isClient: true, direction: 'incoming_manual', createdAt: new Date().toISOString() },
      ]);
    }
  };

  const loadServices = async () => {
    try {
      const res = await api.getServices();
      if (res.services && res.services.length > 0) {
        setServicesList(res.services);
      }
    } catch (_) {}
  };

  const loadSlots = async (date: string) => {
    setLoadingSlots(true);
    try {
      const scheduleRes = await api.getTodaySchedule(date);
      if (scheduleRes && scheduleRes.freeSlots) {
        setAvailableSlots(scheduleRes.freeSlots);
      }
    } catch (_) {
      const fallback = [];
      for (let h = 9; h < 21; h++) {
        const hh = String(h).padStart(2, '0');
        fallback.push({ startTime: `${hh}:00`, isAvailable: true, status: 'FREE' });
        fallback.push({ startTime: `${hh}:30`, isAvailable: true, status: 'FREE' });
      }
      setAvailableSlots(fallback);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Phone input formatting and search debounce
  const handlePhoneChange = (text: string) => {
    const clean = text.replace(/[^\d+]/g, '');
    setPhoneInput(clean);

    const digits = clean.replace(/\D/g, '');
    if (digits.length >= 9) {
      performPhoneSearch(clean);
    } else {
      setFoundClient(null);
      setHasSearched(false);
    }
  };

  const selectFromCallLog = (log: CallLogItem) => {
    const clean = log.phone.trim();
    setPhoneInput(clean);
    if (log.name && log.name !== "Noma'lum") {
      setClientName(log.name);
    }
    performPhoneSearch(clean);
  };

  const handlePickContact = async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'contacts' in navigator && (navigator as any).contacts?.select) {
      try {
        const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: false });
        if (contacts && contacts[0]) {
          const c = contacts[0];
          if (c.name && c.name[0]) setClientName(c.name[0]);
          if (c.tel && c.tel[0]) {
            const raw = c.tel[0].replace(/\D/g, '').slice(-9);
            const formatted = `+998 ${raw.slice(0, 2)} ${raw.slice(2, 5)} ${raw.slice(5, 7)} ${raw.slice(7, 9)}`;
            setPhoneInput(formatted);
            performPhoneSearch(formatted);
          }
        }
      } catch (_) {}
    } else {
      Alert.alert('Eslatma', 'Kontaktlar faqat mos brauzerlarda qo‘llab-quvvatlanadi');
    }
  };

  const performPhoneSearch = async (rawPhone: string) => {
    setSearching(true);
    try {
      const res = await api.searchClientByPhone(rawPhone);
      setHasSearched(true);
      if (res.found && res.client) {
        setFoundClient(res.client);
        setClientName(res.client.name);
        setClientNotes(res.client.notes || '');
      } else {
        setFoundClient(null);
      }
    } catch (_) {
      setHasSearched(true);
      setFoundClient(null);
    } finally {
      setSearching(false);
    }
  };

  // 1-Tap Booking Submission
  const handleConfirmBooking = async (slotTime?: string) => {
    const finalSlot = slotTime || selectedStartTime;
    if (!finalSlot && !isWalkInMode) {
      Alert.alert('Xatolik', 'Iltimos, bo\'sh vaqtni tanlang');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        date: selectedDate,
        startTime: finalSlot,
        phone: phoneInput.trim(),
        name: clientName.trim() || foundClient?.name || 'Mijoz',
        serviceId: selectedServiceId,
        notes: clientNotes.trim() || undefined,
        isWalkIn: isWalkInMode,
      };

      const res = await api.quickBook(payload);
      if (res.success && res.appointment) {
        onSuccess(res.appointment);
        onClose();
      }
    } catch (err: any) {
      Alert.alert('Xatolik', err.message || 'Yozuvni yaratishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = getTodayDateStr();
  const tomorrowStr = getTomorrowDateStr();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconBadge, isWalkInMode && styles.walkInBadge]}>
                {isWalkInMode ? (
                  <Zap size={20} color="#FFFFFF" />
                ) : (
                  <Scissors size={20} color={colors.primary} />
                )}
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {isWalkInMode ? "Tezkor qabul (Walk-in)" : "Mijozni yozish"}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {isWalkInMode ? "Hozirgi vaqtga darhol yozish" : "Telefon yoki qo'ng'iroqlar jurnali"}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Phone Input Field */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MIJOZ TELEFON RAQAMI</Text>
              <View style={styles.phoneInputCard}>
                <Phone size={22} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  ref={phoneInputRef}
                  style={styles.phoneTextInput}
                  value={phoneInput}
                  onChangeText={handlePhoneChange}
                  placeholder="+998 90 123 45 67"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                  autoFocus={!initialPhone}
                  maxLength={18}
                />
                {searching && <ActivityIndicator size="small" color={colors.primary} />}
                {phoneInput.length > 0 && !searching && (
                  <TouchableOpacity
                    onPress={() => {
                      setPhoneInput('');
                      setFoundClient(null);
                      setHasSearched(false);
                      setClientName('');
                    }}
                    style={styles.clearBtn}
                  >
                    <X size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick Actions: Clipboard & Contacts */}
              <View style={styles.quickSourcesRow}>
                {clipboardPhone && (
                  <TouchableOpacity
                    style={styles.sourceChip}
                    onPress={() => {
                      setPhoneInput(clipboardPhone);
                      performPhoneSearch(clipboardPhone);
                    }}
                    activeOpacity={0.7}
                  >
                    <Clipboard size={14} color={colors.primary} />
                    <Text style={styles.sourceChipText}>Bufer: {clipboardPhone}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.sourceChip}
                  onPress={handlePickContact}
                  activeOpacity={0.7}
                >
                  <Contact size={14} color={colors.primary} />
                  <Text style={styles.sourceChipText}>Kontaktlardan tanlash</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Call Log Section (Jurnal Qo'ng'iroqlari) - Shown when no client is currently typed/found */}
            {!foundClient && phoneInput.length < 9 && callLogs.length > 0 && (
              <View style={styles.callLogsSection}>
                <View style={styles.callLogsHeader}>
                  <PhoneIncoming size={15} color={colors.primary} />
                  <Text style={styles.callLogsTitle}>QO'NG'IROQLAR JURNALI (SO'NGGI RAQAMLAR)</Text>
                </View>

                <View style={styles.callLogsList}>
                  {callLogs.slice(0, 5).map((log) => (
                    <TouchableOpacity
                      key={log.id}
                      style={styles.callLogRow}
                      onPress={() => selectFromCallLog(log)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.callLogAvatar}>
                        <Text style={styles.callLogAvatarText}>
                          {(log.name || 'M')[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.callLogInfo}>
                        <View style={styles.callLogTopRow}>
                          <Text style={styles.callLogName} numberOfLines={1}>
                            {log.name || "Noma'lum qo'ng'iroq"}
                          </Text>
                          {log.isClient && (
                            <View style={styles.clientTag}>
                              <Text style={styles.clientTagText}>Mijoz</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.callLogPhone}>{log.phone}</Text>
                      </View>
                      <View style={styles.callLogSelectBtn}>
                        <Text style={styles.callLogSelectText}>Tanlash</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 3. Client Recognition Card */}
            {foundClient ? (
              <View style={styles.recognizedClientCard}>
                <View style={styles.clientCardHeader}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>
                      {(foundClient.name || 'M')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.clientCardInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.clientCardName}>{foundClient.name}</Text>
                      <View style={styles.verifiedBadge}>
                        <CheckCircle2 size={14} color="#16A34A" />
                        <Text style={styles.verifiedText}>Mavjud mijoz</Text>
                      </View>
                    </View>
                    <Text style={styles.clientCardPhone}>{foundClient.phone}</Text>
                  </View>
                </View>

                {/* Client Stats Row */}
                <View style={styles.clientStatsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Tashriflar</Text>
                    <Text style={styles.statValue}>{foundClient.visitsCount || 1} ta</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>O'rtacha chek</Text>
                    <Text style={styles.statValue}>
                      {Number(foundClient.avgSpend || foundClient.totalSpent || 50000).toLocaleString('uz-UZ')} so'm
                    </Text>
                  </View>
                </View>

                {/* Last Visit Info */}
                {foundClient.lastVisit && (
                  <View style={styles.lastVisitBanner}>
                    <Clock size={15} color={colors.textSecondary} />
                    <Text style={styles.lastVisitText}>
                      Oxirgi: {foundClient.lastVisit.date} • {foundClient.lastVisit.serviceName} (
                      {Number(foundClient.lastVisit.servicePrice).toLocaleString('uz-UZ')} so'm)
                    </Text>
                  </View>
                )}

                {/* Client Note if exists */}
                {foundClient.notes ? (
                  <View style={styles.noteBanner}>
                    <Text style={styles.noteText}>💡 {foundClient.notes}</Text>
                  </View>
                ) : null}
              </View>
            ) : hasSearched && phoneInput.length >= 9 ? (
              /* New Client Inline Name Entry */
              <View style={styles.newClientCard}>
                <View style={styles.newClientHeader}>
                  <Sparkles size={18} color="#D97706" />
                  <Text style={styles.newClientTitle}>Yangi mijoz aniqlandi</Text>
                </View>
                <TextInput
                  style={styles.newClientNameInput}
                  placeholder="Mijoz ismini kiriting (masalan, Sardor)"
                  placeholderTextColor={colors.textTertiary}
                  value={clientName}
                  onChangeText={setClientName}
                  maxLength={50}
                />
              </View>
            ) : null}

            {/* 3. Date Selector (Bugun / Ertaga) */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>KUNNI TANLANG</Text>
              <View style={styles.dayTabsRow}>
                <TouchableOpacity
                  style={[styles.dayTab, selectedDate === todayStr && styles.dayTabActive]}
                  onPress={() => {
                    setSelectedDate(todayStr);
                    loadSlots(todayStr);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayTabText,
                      selectedDate === todayStr && styles.dayTabTextActive,
                    ]}
                  >
                    Bugun
                  </Text>
                  <Text
                    style={[
                      styles.dayTabSub,
                      selectedDate === todayStr && styles.dayTabSubActive,
                    ]}
                  >
                    {todayStr}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dayTab, selectedDate === tomorrowStr && styles.dayTabActive]}
                  onPress={() => {
                    setSelectedDate(tomorrowStr);
                    loadSlots(tomorrowStr);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayTabText,
                      selectedDate === tomorrowStr && styles.dayTabTextActive,
                    ]}
                  >
                    Ertaga
                  </Text>
                  <Text
                    style={[
                      styles.dayTabSub,
                      selectedDate === tomorrowStr && styles.dayTabSubActive,
                    ]}
                  >
                    {tomorrowStr}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. Free Time Slots Grid (1-Tap Selection) */}
            {!isWalkInMode && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>BO'SH VAQT VA SLОTLAR</Text>
                {loadingSlots ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
                ) : (
                  <View style={styles.slotsGrid}>
                    {availableSlots.map((slot, index) => {
                      const isFree = slot.isAvailable && slot.status === 'FREE';
                      const isSelected = selectedStartTime === slot.startTime;

                      return (
                        <TouchableOpacity
                          key={`${slot.startTime}-${index}`}
                          disabled={!isFree}
                          style={[
                            styles.slotChip,
                            !isFree && styles.slotChipDisabled,
                            isSelected && styles.slotChipSelected,
                          ]}
                          onPress={() => {
                            setSelectedStartTime(slot.startTime);
                            // If client is recognized or name is filled, create right away on 1 tap!
                            if (phoneInput.length >= 9 && (foundClient || clientName)) {
                              handleConfirmBooking(slot.startTime);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.slotTimeText,
                              !isFree && styles.slotTimeTextDisabled,
                              isSelected && styles.slotTimeTextSelected,
                            ]}
                          >
                            {slot.startTime}
                          </Text>
                          <Text
                            style={[
                              styles.slotStatusText,
                              !isFree && styles.slotStatusTextDisabled,
                              isSelected && styles.slotStatusTextSelected,
                            ]}
                          >
                            {isFree ? "Bo'sh" : slot.status === 'BLOCKED' ? "Yopiq" : "Band"}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* 5. Service Selector (Optional / Default to Haircut) */}
            {servicesList.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>XIZMAT (Ixtiyoriy)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesScroll}>
                  {servicesList.map((srv) => {
                    const isSelected = selectedServiceId === srv.id;
                    return (
                      <TouchableOpacity
                        key={srv.id}
                        style={[styles.serviceChip, isSelected && styles.serviceChipSelected]}
                        onPress={() => setSelectedServiceId(srv.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>
                          {srv.name}
                        </Text>
                        <Text style={[styles.servicePrice, isSelected && styles.servicePriceSelected]}>
                          {Number(srv.price).toLocaleString('uz-UZ')} so'm
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </ScrollView>

          {/* Sticky Bottom Action Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (submitting || (!selectedStartTime && !isWalkInMode)) && styles.submitBtnDisabled,
              ]}
              onPress={() => handleConfirmBooking()}
              disabled={submitting || (!selectedStartTime && !isWalkInMode)}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>
                    {isWalkInMode
                      ? "Hozir qabul qilish"
                      : selectedStartTime
                      ? `${selectedStartTime} ga yozish`
                      : "Vaqtni tanlang"}
                  </Text>
                  <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkInBadge: {
    backgroundColor: '#EA580C',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    maxHeight: 460,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  phoneInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  clearBtn: {
    padding: 4,
  },
  recognizedClientCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  clientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clientCardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clientCardName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#15803D',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  clientCardPhone: {
    fontSize: 13,
    color: '#166534',
    marginTop: 2,
  },
  clientStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  lastVisitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  lastVisitText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '500',
  },
  noteBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  newClientCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  newClientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  newClientTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B45309',
  },
  newClientNameInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
    color: colors.textPrimary,
  },
  dayTabsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dayTab: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dayTabActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  dayTabText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayTabTextActive: {
    color: colors.primary,
  },
  dayTabSub: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  dayTabSubActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    width: '23%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  slotChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotChipDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.5,
  },
  slotTimeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  slotTimeTextSelected: {
    color: '#FFFFFF',
  },
  slotTimeTextDisabled: {
    color: colors.textTertiary,
  },
  slotStatusText: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 2,
  },
  slotStatusTextSelected: {
    color: '#FFFFFF',
  },
  slotStatusTextDisabled: {
    color: colors.textTertiary,
  },
  servicesScroll: {
    flexDirection: 'row',
  },
  serviceChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  serviceChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  serviceNameSelected: {
    color: colors.primary,
  },
  servicePrice: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  servicePriceSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickSourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sourceChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  callLogsSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  callLogsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  callLogsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  callLogsList: {
    gap: 8,
  },
  callLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  callLogAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callLogAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  callLogInfo: {
    flex: 1,
  },
  callLogTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callLogName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  clientTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  clientTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  callLogPhone: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  callLogSelectBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  callLogSelectText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
