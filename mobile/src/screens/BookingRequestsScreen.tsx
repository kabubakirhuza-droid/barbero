import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, CalendarCheck, Check, X, Phone, Clock, User, Sparkles } from 'lucide-react-native';
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
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await api.getBookingRequests();
      setRequests(res.requests || []);
    } catch (e) {
      console.warn('Failed to load booking requests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAccept = async (req: BookingRequest) => {
    try {
      setActionLoadingId(req.id);
      await api.acceptBookingRequest(req.id);
      showToast(
        `Qabul qilindi! ${req.clientName} uchun ${req.time} da "${req.serviceName}" jadvalga qo'shildi.`,
        'success'
      );
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
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
      `${req.clientName} ning so'rovini rad etmoqchimisiz?`,
      async () => {
        try {
          setActionLoadingId(req.id);
          await api.rejectBookingRequest(req.id);
          showToast("So'rov rad etildi", 'info');
          setRequests((prev) => prev.filter((r) => r.id !== req.id));
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bron so'rovlari</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLOR_PRIMARY} />
          <Text style={styles.loadingText}>So'rovlar yuklanmoqda...</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <CalendarCheck size={40} color={COLOR_PRIMARY} />
          </View>
          <Text style={styles.emptyTitle}>Hozircha so'rovlar yo'q</Text>
          <Text style={styles.emptySubtitle}>
            Mijozlar sizning shaxsiy booking havolangiz orqali yozilganda, yangi so'rovlar shu yerda paydo bo'ladi.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionNotice}>
            Kutilayotgan so'rovlar soni: {requests.length} ta
          </Text>

          {requests.map((item) => {
            const isProcessing = actionLoadingId === item.id;
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
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Yangi</Text>
                  </View>
                </View>

                <View style={styles.detailsBox}>
                  <View style={styles.detailRow}>
                    <Sparkles size={15} color={COLOR_PRIMARY} />
                    <Text style={styles.serviceName}>{item.serviceName}</Text>
                    <Text style={styles.servicePrice}>
                      {item.servicePrice.toLocaleString('uz-UZ')} uzs
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={15} color={colors.textSecondary} />
                    <Text style={styles.dateTimeText}>
                      {item.date}, soat {item.time}
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
                  >
                    <X size={18} color={colors.danger} />
                    <Text style={styles.rejectBtnText}>Rad etish</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btn, styles.acceptBtn]}
                    onPress={() => handleAccept(item)}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                        <Text style={styles.acceptBtnText}>Qabul qilish</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
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
  sectionNotice: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    gap: 14,
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
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
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
  },
  btn: {
    flex: 1,
    height: 46,
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
