import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  X,
  Phone,
  Clock,
  User,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Coins,
} from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { api } from '../api/apiClient';
import { BookingRequest } from '../types';
import { showToast, confirmAction } from '../utils/alerts';

interface BookingRequestsScreenProps {
  onBack: () => void;
  onRequestAccepted?: () => void;
}

export const BookingRequestsScreen: React.FC<BookingRequestsScreenProps> = ({
  onBack,
  onRequestAccepted,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [allRequests, setAllRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      const res = await api.getBookingRequests();
      setAllRequests(res.requests || []);
    } catch (e) {
      console.warn('Failed to load booking requests', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 15000);
    return () => clearInterval(interval);
  }, []);

  const pendingRequests = allRequests.filter(
    (r) => r.status === 'new' || r.status === 'pending' || !r.status
  );
  const historyRequests = allRequests.filter(
    (r) => r.status === 'accepted' || r.status === 'rejected' || r.status === 'expired'
  );

  const handleAccept = async (req: BookingRequest) => {
    try {
      setActionLoadingId(req.id);
      await api.acceptBookingRequest(req.id);
      showToast(
        `Qabul qilindi! ${req.clientName} uchun ${req.time} da "${req.serviceName}" jadvalga qo'shildi.`,
        'success'
      );
      // Refresh local list
      await loadRequests();
      if (onRequestAccepted) {
        onRequestAccepted();
      }
    } catch (e: any) {
      showToast(e.message || "So'rovni qabul qilib bo'lmadi", 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (req: BookingRequest) => {
    confirmAction(
      "So'rovni rad etish",
      `${req.clientName} ning so'rovini rad etmoqchimisiz? Slot avtomatik bo'shaydi.`,
      async () => {
        try {
          setActionLoadingId(req.id);
          await api.rejectBookingRequest(req.id);
          showToast("So'rov rad etildi va mijozga xabar yuborildi", 'info');
          await loadRequests();
        } catch (e: any) {
          showToast(e.message || "So'rovni rad etib bo'lmadi", 'error');
        } finally {
          setActionLoadingId(null);
        }
      },
      'Rad etish',
      'Bekor qilish',
      true
    );
  };

  const formatRelativeDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return timeStr || '';
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    let prefix = dateStr;
    if (dateStr === today) {
      prefix = 'Bugun';
    } else if (dateStr === tomorrow) {
      prefix = 'Ertaga';
    }
    return `${prefix}, ${timeStr || ''}`;
  };

  // Helper to compute remaining TTL minutes and percent
  const getTtlInfo = (req: BookingRequest) => {
    const ttlMinutes = 30;
    const createdAt = req.createdAt ? new Date(req.createdAt).getTime() : Date.now();
    const expiresAt = req.expiresAt ? new Date(req.expiresAt).getTime() : createdAt + ttlMinutes * 60 * 1000;
    const now = Date.now();
    const diffMs = Math.max(0, expiresAt - now);
    const minsLeft = Math.ceil(diffMs / (60 * 1000));
    const percent = Math.min(100, Math.max(0, (diffMs / (ttlMinutes * 60 * 1000)) * 100));
    return { minsLeft, percent };
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Orqaga">
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bron so'rovlari</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Tabs: Yangi · N and Javob berilgan */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pending' && styles.tabButtonActive]}
          onPress={() => setActiveTab('pending')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === 'pending' && styles.tabButtonTextActive]}>
            Yangi {pendingRequests.length > 0 ? `· ${pendingRequests.length}` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}>
            Javob berilgan {historyRequests.length > 0 ? `· ${historyRequests.length}` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notice bar */}
      <View style={styles.noticeBar}>
        <Info size={16} color={COLOR_PRIMARY} />
        <Text style={styles.noticeText}>
          Javobsiz so'rov muddati tugagach slot avtomatik bo'shaydi
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLOR_PRIMARY} />
          <Text style={styles.loadingText}>So'rovlar yuklanmoqda...</Text>
        </View>
      ) : activeTab === 'pending' ? (
        pendingRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <CalendarCheck size={40} color={COLOR_PRIMARY} />
            </View>
            <Text style={styles.emptyTitle}>Yangi so'rovlar yo'q</Text>
            <Text style={styles.emptySubtitle}>
              Mijozlar shaxsiy booking havolangiz orqali yozilganda, yangi so'rovlar shu yerda paydo bo'ladi.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadRequests();
                }}
                colors={[COLOR_PRIMARY]}
              />
            }
          >
            {pendingRequests.map((item) => {
              const isProcessing = actionLoadingId === item.id;
              const { minsLeft, percent } = getTtlInfo(item);
              const isUrgent = minsLeft <= 10;

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.clientAvatar}>
                      <User size={20} color={COLOR_PRIMARY} />
                    </View>
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>{item.clientName}</Text>
                      <View style={styles.phoneRow}>
                        <Phone size={13} color={colors.textSecondary} />
                        <Text style={styles.clientPhone}>{item.clientPhone}</Text>
                      </View>
                    </View>
                    <View style={styles.badgeGroup}>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>YANGI</Text>
                      </View>
                      <View style={[styles.timerPill, isUrgent && styles.timerPillUrgent]}>
                        <Clock size={12} color={isUrgent ? colors.danger : '#D97706'} />
                        <Text style={[styles.timerPillText, isUrgent && styles.timerPillTextUrgent]}>
                          {minsLeft} daq
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Timer progress line */}
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${percent}%` },
                        isUrgent && { backgroundColor: colors.danger },
                      ]}
                    />
                  </View>

                  <View style={styles.detailsBox}>
                    <View style={styles.detailRow}>
                      <Sparkles size={15} color={COLOR_PRIMARY} />
                      <Text style={styles.serviceName}>{item.serviceName}</Text>
                      <View style={styles.priceRow}>
                        <Coins size={14} color={COLOR_PRIMARY} />
                        <Text style={styles.servicePrice}>
                          {item.servicePrice.toLocaleString('uz-UZ')} uzs
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Clock size={15} color={colors.textSecondary} />
                      <Text style={styles.dateTimeText}>
                        {formatRelativeDateTime(item.date, item.time)}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.btn, styles.rejectBtn]}
                      onPress={() => handleReject(item)}
                      disabled={isProcessing}
                      activeOpacity={0.7}
                      accessibilityLabel="Rad etish"
                    >
                      <X size={18} color={colors.danger} />
                      <Text style={styles.rejectBtnText}>Rad etish</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btn, styles.acceptBtn]}
                      onPress={() => handleAccept(item)}
                      disabled={isProcessing}
                      activeOpacity={0.8}
                      accessibilityLabel="Tasdiqlash"
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                          <Text style={styles.acceptBtnText}>Tasdiqlash</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )
      ) : (
        /* History Tab */
        historyRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <CheckCircle2 size={40} color={colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>Javob berilgan so'rovlar yo'q</Text>
            <Text style={styles.emptySubtitle}>
              Tasdiqlangan, rad etilgan va muddati o'tgan so'rovlar shu yerda saqlanadi.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {historyRequests.map((item) => {
              const isAccepted = item.status === 'accepted';
              const isRejected = item.status === 'rejected';
              const isExpired = item.status === 'expired';

              return (
                <View key={item.id} style={[styles.card, { opacity: 0.88 }]}>
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.clientAvatar,
                        {
                          backgroundColor: isAccepted
                            ? '#DCFCE7'
                            : isRejected
                            ? '#FEE2E2'
                            : '#F3F4F6',
                        },
                      ]}
                    >
                      {isAccepted ? (
                        <CheckCircle2 size={20} color="#16A34A" />
                      ) : isRejected ? (
                        <XCircle size={20} color="#DC2626" />
                      ) : (
                        <AlertCircle size={20} color="#6B7280" />
                      )}
                    </View>
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>{item.clientName}</Text>
                      <Text style={styles.clientPhone}>{item.clientPhone}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isAccepted
                            ? '#DCFCE7'
                            : isRejected
                            ? '#FEE2E2'
                            : '#F3F4F6',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color: isAccepted
                              ? '#16A34A'
                              : isRejected
                              ? '#DC2626'
                              : '#6B7280',
                          },
                        ]}
                      >
                        {isAccepted
                          ? 'Tasdiqlangan'
                          : isRejected
                          ? 'Rad etilgan'
                          : "Muddati o'tgan"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsBox}>
                    <View style={styles.detailRow}>
                      <Sparkles size={15} color={colors.textSecondary} />
                      <Text style={styles.serviceName}>{item.serviceName}</Text>
                      <Text style={styles.servicePrice}>
                        {item.servicePrice.toLocaleString('uz-UZ')} uzs
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Clock size={15} color={colors.textSecondary} />
                      <Text style={styles.dateTimeText}>
                        {formatRelativeDateTime(item.date, item.time)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )
      )}
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
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLOR_PRIMARY,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  noticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: COLOR_PRIMARY,
    fontWeight: '600',
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInfo: {
    flex: 1,
    gap: 3,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  badgeGroup: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  timerPillUrgent: {
    backgroundColor: '#FEE2E2',
  },
  timerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  timerPillTextUrgent: {
    color: colors.danger,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: colors.inputBackground,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  detailsBox: {
    backgroundColor: colors.inputBackground,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  dateTimeText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rejectBtn: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },
  acceptBtn: {
    backgroundColor: COLOR_PRIMARY,
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
