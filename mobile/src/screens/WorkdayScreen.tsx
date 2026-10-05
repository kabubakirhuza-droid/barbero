import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import {
  Plus,
  Zap,
  Search,
  Phone,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  ChevronRight,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../api/apiClient';
import { QuickBookingSheet } from '../components/QuickBookingSheet';
import { Appointment, TodayScheduleData, TodaySlotItem } from '../types';

export const WorkdayScreen: React.FC = () => {
  const { t, language } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleData, setScheduleData] = useState<TodayScheduleData | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayStr());

  // Quick booking modal controls
  const [quickBookingVisible, setQuickBookingVisible] = useState(false);
  const [prefilledPhone, setPrefilledPhone] = useState('');
  const [prefilledSlot, setPrefilledSlot] = useState('');
  const [isWalkIn, setIsWalkIn] = useState(false);

  function getTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getTomorrowStr() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const todayStr = getTodayStr();
  const tomorrowStr = getTomorrowStr();

  const loadWorkday = useCallback(async (dateToLoad = selectedDate) => {
    try {
      const res = await api.getTodaySchedule(dateToLoad);
      if (res && res.success) {
        setScheduleData(res);
      }
    } catch (e) {
      console.error('[Workday load error]:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadWorkday();
    const interval = setInterval(() => loadWorkday(), 20000);
    return () => clearInterval(interval);
  }, [loadWorkday]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWorkday();
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      await api.updateAppointment(appointmentId, { status: newStatus as any });
      loadWorkday();
    } catch (e) {
      console.error('[Status update error]:', e);
    }
  };

  const handleCallClient = (phoneNumber: string) => {
    if (!phoneNumber) return;
    const clean = phoneNumber.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${clean}`);
  };

  const openQuickBook = (slot?: string, walkIn = false) => {
    setPrefilledSlot(slot || '');
    setPrefilledPhone('');
    setIsWalkIn(walkIn);
    setQuickBookingVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Bar with Day Switcher */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerDateTitle}>
            {selectedDate === todayStr ? "Bugun" : "Ertaga"} • {selectedDate}
          </Text>
          <Text style={styles.headerDaySub}>
            {scheduleData?.dayOfWeek || "Ish kuni"}
          </Text>
        </View>

        {/* Quick Day Switcher Pills */}
        <View style={styles.daySwitchPills}>
          <TouchableOpacity
            style={[styles.pillBtn, selectedDate === todayStr && styles.pillBtnActive]}
            onPress={() => {
              setSelectedDate(todayStr);
              loadWorkday(todayStr);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, selectedDate === todayStr && styles.pillTextActive]}>
              Bugun
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pillBtn, selectedDate === tomorrowStr && styles.pillBtnActive]}
            onPress={() => {
              setSelectedDate(tomorrowStr);
              loadWorkday(tomorrowStr);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, selectedDate === tomorrowStr && styles.pillTextActive]}>
              Ertaga
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Micro Day Overview (Clean & Minimal) */}
        {scheduleData?.stats && (
          <View style={styles.summaryBar}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Mijozlar</Text>
              <Text style={styles.summaryValue}>{scheduleData.stats.totalClients} ta</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tugatildi</Text>
              <Text style={styles.summaryValueDone}>{scheduleData.stats.completedCount} ta</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Kutilmoqda</Text>
              <Text style={styles.summaryValuePending}>{scheduleData.stats.remainingCount} ta</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tushum</Text>
              <Text style={styles.summaryValueRevenue}>
                {scheduleData.stats.totalRevenue.toLocaleString('uz-UZ')} so'm
              </Text>
            </View>
          </View>
        )}

        {/* 3. CURRENT CLIENT (Active / In-Service Highlight Card) */}
        {selectedDate === todayStr && scheduleData?.currentAppointment && (
          <View style={styles.currentClientCard}>
            <View style={styles.currentCardHeader}>
              <View style={styles.liveBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveBadgeText}>HOZIR XIZMATDA</Text>
              </View>
              <Text style={styles.currentSlotTime}>
                {scheduleData.currentAppointment.startTime} — {scheduleData.currentAppointment.endTime}
              </Text>
            </View>

            <View style={styles.currentClientBody}>
              <View style={styles.currentAvatar}>
                <Text style={styles.currentAvatarText}>
                  {(scheduleData.currentAppointment.clientName || 'M')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.currentClientName}>
                  {scheduleData.currentAppointment.clientName}
                </Text>
                <Text style={styles.currentServiceName}>
                  {scheduleData.currentAppointment.serviceName} •{' '}
                  {Number(scheduleData.currentAppointment.servicePrice).toLocaleString('uz-UZ')} so'm
                </Text>
              </View>
            </View>

            {/* Quick Status Control Buttons */}
            <View style={styles.currentActionsRow}>
              {scheduleData.currentAppointment.clientPhone ? (
                <TouchableOpacity
                  style={styles.actionCallBtn}
                  onPress={() => handleCallClient(scheduleData.currentAppointment!.clientPhone)}
                  activeOpacity={0.7}
                >
                  <Phone size={16} color={colors.primary} />
                  <Text style={styles.actionCallText}>Qo'ng'iroq</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.actionDoneBtn}
                onPress={() => handleUpdateStatus(scheduleData.currentAppointment!.id, 'completed')}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={styles.actionDoneText}>Tugatish</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 4. WORKDAY TIMELINE (Sequential Slots) */}
        <View style={styles.timelineSection}>
          <Text style={styles.timelineSectionTitle}>KUN TARTIBI VA BO'SH VAQTLAR</Text>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 24 }} />
          ) : scheduleData?.freeSlots && scheduleData.freeSlots.length > 0 ? (
            scheduleData.freeSlots.map((slot, index) => {
              const hasApt = slot.status === 'OCCUPIED' && slot.appointment;
              const isBlocked = slot.status === 'BLOCKED';
              const isFree = slot.status === 'FREE';
              const isPast = slot.status === 'PAST';
              const isCurrent = slot.status === 'CURRENT';

              if (hasApt && slot.appointment) {
                const apt = slot.appointment;
                const isCompleted = apt.status === 'completed' || apt.status === 'done';
                const isArrived = apt.status === 'arrived';

                return (
                  <View
                    key={`${slot.startTime}-${index}`}
                    style={[
                      styles.appointmentCard,
                      isCurrent && styles.appointmentCardCurrent,
                      isCompleted && styles.appointmentCardCompleted,
                    ]}
                  >
                    <View style={styles.slotTimeColumn}>
                      <Text style={[styles.timeText, isCurrent && styles.timeTextCurrent]}>
                        {apt.startTime}
                      </Text>
                      <Text style={styles.timeEndText}>{apt.endTime}</Text>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.appointmentContent}>
                      <View style={styles.appointmentHeaderRow}>
                        <Text style={styles.clientNameText} numberOfLines={1}>
                          {apt.clientName}
                        </Text>
                        <View
                          style={[
                            styles.statusTag,
                            isCompleted && styles.statusTagCompleted,
                            isArrived && styles.statusTagArrived,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusTagText,
                              isCompleted && styles.statusTagTextCompleted,
                              isArrived && styles.statusTagTextArrived,
                            ]}
                          >
                            {isCompleted ? "Tugadi" : isArrived ? "Keldi" : "Kutilmoqda"}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.serviceText}>
                        {apt.serviceName} • {Number(apt.servicePrice).toLocaleString('uz-UZ')} so'm
                      </Text>

                      {/* 1-Tap Fast Status Actions */}
                      {!isCompleted && (
                        <View style={styles.quickStatusRow}>
                          {!isArrived && (
                            <TouchableOpacity
                              style={styles.chipBtn}
                              onPress={() => handleUpdateStatus(apt.id, 'arrived')}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.chipBtnText}>Keldi</Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            style={styles.chipBtnDone}
                            onPress={() => handleUpdateStatus(apt.id, 'completed')}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.chipBtnDoneText}>Tugatish</Text>
                          </TouchableOpacity>

                          {apt.clientPhone ? (
                            <TouchableOpacity
                              style={styles.chipBtnCall}
                              onPress={() => handleCallClient(apt.clientPhone)}
                              activeOpacity={0.7}
                            >
                              <Phone size={13} color={colors.textSecondary} />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      )}
                    </View>
                  </View>
                );
              }

              if (isBlocked) {
                return (
                  <View key={`${slot.startTime}-${index}`} style={styles.blockedSlotCard}>
                    <Text style={styles.slotTimeMuted}>{slot.startTime}</Text>
                    <Text style={styles.blockedSlotText}>Tushlik / Dam olish</Text>
                  </View>
                );
              }

              // Free Slot -> 1-Tap to Book!
              return (
                <TouchableOpacity
                  key={`${slot.startTime}-${index}`}
                  style={[styles.freeSlotCard, isPast && styles.freeSlotCardPast]}
                  disabled={isPast}
                  onPress={() => openQuickBook(slot.startTime, false)}
                  activeOpacity={0.7}
                >
                  <View style={styles.freeSlotLeft}>
                    <Text style={[styles.freeSlotTime, isPast && styles.freeSlotTimePast]}>
                      {slot.startTime}
                    </Text>
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeText}>{isPast ? "O'tgan" : "Bo'sh"}</Text>
                    </View>
                  </View>

                  {!isPast && (
                    <View style={styles.freeSlotAction}>
                      <Plus size={16} color={colors.primary} />
                      <Text style={styles.freeSlotActionText}>Yozish</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Calendar size={32} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>Bugungi kun jadvali bo'sh</Text>
              <Text style={styles.emptySub}>Mijoz qo'shish uchun "+ Yozish" tugmasini bosing</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 5. Sticky Bottom Action Controls (1-Handed Ergonomics) */}
      <View style={styles.floatingActionBar}>
        <TouchableOpacity
          style={styles.primaryBookBtn}
          onPress={() => openQuickBook(undefined, false)}
          activeOpacity={0.8}
        >
          <Plus size={22} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.primaryBookText}>+ Yozish</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.walkInBtn}
          onPress={() => openQuickBook(undefined, true)}
          activeOpacity={0.8}
        >
          <Zap size={18} color="#FFFFFF" />
          <Text style={styles.walkInText}>+ Hozir (Walk-in)</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Booking Sheet Modal */}
      <QuickBookingSheet
        visible={quickBookingVisible}
        onClose={() => setQuickBookingVisible(false)}
        onSuccess={() => {
          setQuickBookingVisible(false);
          loadWorkday();
        }}
        initialPhone={prefilledPhone}
        initialDate={selectedDate}
        initialStartTime={prefilledSlot}
        isWalkInMode={isWalkIn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerDateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerDaySub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  daySwitchPills: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pillBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.primary,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  summaryValueDone: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 2,
  },
  summaryValuePending: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 2,
  },
  summaryValueRevenue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  currentClientCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  currentSlotTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  currentClientBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currentClientName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  currentServiceName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  currentActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  actionCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    height: 40,
    borderRadius: 12,
  },
  actionCallText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  actionDoneBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    height: 40,
    borderRadius: 12,
  },
  actionDoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timelineSection: {
    marginTop: 6,
  },
  timelineSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  appointmentCardCurrent: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: '#F0F7FF',
  },
  appointmentCardCompleted: {
    backgroundColor: '#F8FAFC',
    opacity: 0.85,
  },
  slotTimeColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timeTextCurrent: {
    color: colors.primary,
  },
  timeEndText: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  cardDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  appointmentContent: {
    flex: 1,
  },
  appointmentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clientNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  statusTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusTagCompleted: {
    backgroundColor: '#DCFCE7',
  },
  statusTagArrived: {
    backgroundColor: '#FEF3C7',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  statusTagTextCompleted: {
    color: '#15803D',
  },
  statusTagTextArrived: {
    color: '#B45309',
  },
  serviceText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quickStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  chipBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipBtnDone: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipBtnDoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  chipBtnCall: {
    backgroundColor: '#F1F5F9',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  freeSlotCardPast: {
    backgroundColor: '#F8FAFC',
    opacity: 0.5,
  },
  freeSlotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  freeSlotTime: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  freeSlotTimePast: {
    color: colors.textTertiary,
  },
  freeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803D',
  },
  freeSlotAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  freeSlotActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  blockedSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  slotTimeMuted: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  blockedSlotText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  floatingActionBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 78 : 68,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  primaryBookBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 26,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBookText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  walkInBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EA580C',
    height: 52,
    borderRadius: 26,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  walkInText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
