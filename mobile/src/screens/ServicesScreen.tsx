import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  ChevronLeft,
  Plus,
  Scissors,
  Trash2,
  Clock,
  Coins,
  Sparkles,
  Edit3,
} from 'lucide-react-native';
import { colors, COLOR_PRIMARY, COLOR_SECONDARY, COLOR_SUCCESS } from '../theme/theme';
import { useTranslation } from '../i18n/LanguageContext';
import { Service } from '../types';
import { api } from '../api/apiClient';
import { confirmAction, showToast } from '../utils/alerts';
import { AddServiceModal } from './AddServiceModal';

interface ServicesScreenProps {
  onBack: () => void;
}

const STARTER_SERVICES_TEMPLATE = [
  { name: 'Soch olish', price: 50000, duration: 30, badgeColor: '#2563EB', isActive: true },
  { name: 'Soch + soqol', price: 70000, duration: 45, badgeColor: '#2563EB', isActive: true },
  { name: 'Bolalar sochi', price: 30000, duration: 25, badgeColor: '#10B981', isActive: true },
  { name: 'Soqol olish', price: 30000, duration: 20, badgeColor: '#F59E0B', isActive: true },
  { name: 'Kreativ soqol tekislash', price: 45000, duration: 30, badgeColor: '#8B5CF6', isActive: true },
];

export const ServicesScreen: React.FC<ServicesScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.getServices();
      if (res?.services) {
        setServices(res.services);
      }
    } catch (err) {
      console.warn('Load services error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleToggleActive = async (service: Service) => {
    const updatedStatus = !service.isActive;
    // Optimistic UI
    setServices((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, isActive: updatedStatus } : s))
    );

    try {
      await api.updateService(service.id, { isActive: updatedStatus });
      showToast(
        updatedStatus ? "Xizmat faollashtirildi" : "Xizmat o'chirib qo'yildi",
        'success'
      );
    } catch (err) {
      // Revert on error
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isActive: service.isActive } : s))
      );
      showToast("Xizmat holatini o'zgartirishda xatolik", 'error');
    }
  };

  const handleDelete = (service: Service) => {
    confirmAction(
      "Xizmatni o'chirish",
      `Haqiqatan ham "${service.name}" xizmatini o'chirmoqchimisiz?`,
      async () => {
        try {
          await api.deleteService(service.id);
          setServices((prev) => prev.filter((s) => s.id !== service.id));
          showToast("Xizmat muvaffaqiyatli o'chirildi", 'success');
        } catch (err) {
          showToast("Xizmatni o'chirishda xatolik yuz berdi", 'error');
        }
      },
      "O'chirish",
      "Bekor qilish"
    );
  };

  const handleSeedStarterServices = async () => {
    setActionLoading(true);
    try {
      for (const s of STARTER_SERVICES_TEMPLATE) {
        await api.createService(s);
      }
      await fetchServices();
      showToast("Standart 5 ta xizmat muvaffaqiyatli qo'shildi!", 'success');
    } catch (err) {
      showToast("Xizmatlarni qo'shishda xatolik", 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (val: number) => {
    return `${val.toLocaleString('ru-RU')} uzs`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('serviceTypes') || 'Xizmat turlari'}</Text>
        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() => setIsAddModalOpen(true)}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.headerAddBtnText}>{t('addServiceBtn') || "Qo'shish"}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={COLOR_PRIMARY} />
          <Text style={styles.loadingText}>Xizmatlar yuklanmoqda…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Subtitle Banner */}
          <View style={styles.bannerCard}>
            <View style={styles.bannerIconWrap}>
              <Scissors size={22} color={COLOR_PRIMARY} />
            </View>
            <View style={styles.bannerInfo}>
              <Text style={styles.bannerTitle}>
                {services.length} ta xizmat mavjud
              </Text>
              <Text style={styles.bannerSub}>
                Mijozlar ushbu xizmatlar bo‘yicha onlayn navbatga yozilishlari mumkin
              </Text>
            </View>
          </View>

          {/* Empty State */}
          {services.length === 0 && (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Scissors size={38} color={COLOR_PRIMARY} />
              </View>
              <Text style={styles.emptyTitle}>Hozircha xizmatlar mavjud emas</Text>
              <Text style={styles.emptySub}>
                Ishni boshlash uchun o'z xizmatlaringizni qo'shing yoki standart to'plamni bir bosishda yuklang.
              </Text>

              <TouchableOpacity
                style={styles.seedStarterBtn}
                onPress={handleSeedStarterServices}
                disabled={actionLoading}
                activeOpacity={0.85}
              >
                <Sparkles size={18} color="#FFFFFF" />
                <Text style={styles.seedStarterBtnText}>
                  {actionLoading ? 'Yuklanmoqda…' : "Standart xizmatlarni yuklash (5 ta)"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Services List */}
          {services.map((srv) => (
            <View key={srv.id} style={styles.serviceCard}>
              <View style={styles.serviceMain}>
                <View
                  style={[
                    styles.serviceBadge,
                    { backgroundColor: (srv.badgeColor || COLOR_PRIMARY) + '18' },
                  ]}
                >
                  <Scissors size={18} color={srv.badgeColor || COLOR_PRIMARY} />
                </View>

                <View style={styles.serviceTextInfo}>
                  <Text style={styles.serviceName}>{srv.name}</Text>
                  <View style={styles.serviceMetaRow}>
                    <View style={styles.metaItem}>
                      <Coins size={14} color={COLOR_PRIMARY} />
                      <Text style={styles.metaPrice}>{formatPrice(srv.price)}</Text>
                    </View>
                    <View style={styles.metaDot} />
                    <View style={styles.metaItem}>
                      <Clock size={14} color={colors.textSecondary} />
                      <Text style={styles.metaDuration}>{srv.duration || 30} daq</Text>
                    </View>
                  </View>
                </View>

                {/* Active Toggle */}
                <View style={styles.switchWrap}>
                  <Switch
                    value={srv.isActive}
                    onValueChange={() => handleToggleActive(srv)}
                    trackColor={{ false: colors.cardBorder, true: COLOR_PRIMARY }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* Action row (Delete) */}
              <View style={styles.cardFooter}>
                <Text
                  style={[
                    styles.statusBadge,
                    srv.isActive ? styles.statusActive : styles.statusInactive,
                  ]}
                >
                  {srv.isActive ? 'Faol (onlayn ko‘rinadi)' : 'O‘chirilgan'}
                </Text>

                <TouchableOpacity
                  style={styles.deleteActionBtn}
                  onPress={() => handleDelete(srv)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={16} color={colors.danger || '#EF4444'} />
                  <Text style={styles.deleteActionText}>O‘chirish</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Big Add Service Button at bottom */}
          <TouchableOpacity
            style={styles.bottomAddBtn}
            onPress={() => setIsAddModalOpen(true)}
            activeOpacity={0.85}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.bottomAddBtnText}>
              + Yangi xizmat qo'shish
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Modal to Add New Service */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <AddServiceModal
          onClose={() => setIsAddModalOpen(false)}
          onServiceCreated={() => {
            setIsAddModalOpen(false);
            fetchServices();
          }}
        />
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR_PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  headerAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 12,
  },
  bannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bannerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginVertical: 12,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  seedStarterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR_PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  seedStarterBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  serviceMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTextInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
  },
  metaDuration: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  switchWrap: {
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  statusInactive: {
    backgroundColor: '#F1F5F9',
    color: colors.textMuted,
  },
  deleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.danger || '#EF4444',
  },
  bottomAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR_PRIMARY,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  bottomAddBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
