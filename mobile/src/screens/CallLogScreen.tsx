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
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Calendar,
  Plus,
  Search,
  User,
  Clock,
  Scissors,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../api/apiClient';
import { QuickBookingSheet } from '../components/QuickBookingSheet';
import { CallLogItem } from '../types';

export const CallLogScreen: React.FC = () => {
  const { t } = useTranslation();

  const [callLogs, setCallLogs] = useState<CallLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick booking modal trigger from caller
  const [quickBookingVisible, setQuickBookingVisible] = useState(false);
  const [selectedCallerPhone, setSelectedCallerPhone] = useState('');

  // Manual call record modal
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('');

  const loadLogs = useCallback(async () => {
    try {
      const res = await api.getCallLogs(30);
      if (res && res.callLogs) {
        setCallLogs(res.callLogs);
      }
    } catch (e) {
      console.error('[CallLog load error]:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLogs();
  };

  const handleCall = (phoneNumber: string) => {
    const clean = phoneNumber.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${clean}`);
  };

  const handleOpenBookForCaller = (phone: string) => {
    setSelectedCallerPhone(phone);
    setQuickBookingVisible(true);
  };

  const handleSaveManualCall = async () => {
    if (!manualPhone) {
      Alert.alert('Xatolik', 'Telefon raqamini kiriting');
      return;
    }

    try {
      await api.addCallLog(manualPhone, manualName, 'incoming_manual');
      setManualModalVisible(false);
      setManualPhone('');
      setManualName('');
      loadLogs();
    } catch (e: any) {
      Alert.alert('Xatolik', e.message || 'Saqlashda xatolik');
    }
  };

  const filteredLogs = callLogs.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Search and Add Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Qo'ng'iroqlardan qidirish..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.addCallBtn}
          onPress={() => setManualModalVisible(true)}
          activeOpacity={0.7}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 32 }} />
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const isKnown = log.isClient || (log.name && log.name !== "Noma'lum");
            const formattedDate = new Date(log.createdAt).toLocaleDateString('uz-UZ', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <TouchableOpacity
                key={log.id}
                style={styles.callCard}
                onPress={() => handleOpenBookForCaller(log.phone)}
                activeOpacity={0.7}
              >
                {/* Caller Avatar */}
                <View style={[styles.avatar, isKnown ? styles.avatarKnown : styles.avatarUnknown]}>
                  {isKnown ? (
                    <Text style={styles.avatarText}>{(log.name || 'M')[0].toUpperCase()}</Text>
                  ) : (
                    <PhoneIncoming size={18} color="#D97706" />
                  )}
                </View>

                {/* Caller Details */}
                <View style={styles.callerInfo}>
                  <View style={styles.callerNameRow}>
                    <Text style={styles.callerName} numberOfLines={1}>
                      {isKnown ? log.name : "Noma'lum raqam"}
                    </Text>
                    <Text style={styles.callTimeText}>{formattedDate}</Text>
                  </View>

                  <Text style={styles.callerPhone}>{log.phone}</Text>

                  {/* Visit metadata tag */}
                  {log.lastVisitDate ? (
                    <View style={styles.visitTag}>
                      <Clock size={12} color="#15803D" />
                      <Text style={styles.visitTagText}>
                        Oxirgi tashrif: {log.lastVisitDate}
                        {log.lastServiceName ? ` • ${log.lastServiceName}` : ''}
                      </Text>
                    </View>
                  ) : log.visitsCount && log.visitsCount > 0 ? (
                    <View style={styles.visitTag}>
                      <Text style={styles.visitTagText}>{log.visitsCount} ta tashrif</Text>
                    </View>
                  ) : (
                    <View style={styles.newClientTag}>
                      <Text style={styles.newClientTagText}>Yangi qo'ng'iroq</Text>
                    </View>
                  )}
                </View>

                {/* Quick Actions (Call & Book) */}
                <View style={styles.actionButtonsCol}>
                  <TouchableOpacity
                    style={styles.quickBookBtn}
                    onPress={() => handleOpenBookForCaller(log.phone)}
                    activeOpacity={0.7}
                  >
                    <Scissors size={14} color="#FFFFFF" />
                    <Text style={styles.quickBookBtnText}>Yozish</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dialBtn}
                    onPress={() => handleCall(log.phone)}
                    activeOpacity={0.7}
                  >
                    <PhoneCall size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Phone size={36} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Qo'ng'iroqlar tarixi bo'sh</Text>
            <Text style={styles.emptySub}>
              Mijoz bilan ishlangan telefon raqamlari shu yerda avtomatik saqlanadi
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Manual Call Record Modal */}
      <Modal visible={manualModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Qo'ng'iroqni kiritish</Text>
              <TouchableOpacity onPress={() => setManualModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>TELEFON RAQAM *</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="+998 90 123 45 67"
                placeholderTextColor={colors.textTertiary}
                value={manualPhone}
                onChangeText={setManualPhone}
                keyboardType="phone-pad"
                autoFocus
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>ISM (Ixtiyoriy)</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Mijoz ismi"
                placeholderTextColor={colors.textTertiary}
                value={manualName}
                onChangeText={setManualName}
              />

              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleSaveManualCall}
                activeOpacity={0.8}
              >
                <Text style={styles.saveModalBtnText}>Saqlash va qo'shish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quick Booking Sheet Modal */}
      <QuickBookingSheet
        visible={quickBookingVisible}
        onClose={() => setQuickBookingVisible(false)}
        onSuccess={() => {
          setQuickBookingVisible(false);
          loadLogs();
        }}
        initialPhone={selectedCallerPhone}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  addCallBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarKnown: {
    backgroundColor: colors.primaryLight,
  },
  avatarUnknown: {
    backgroundColor: '#FEF3C7',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  callerInfo: {
    flex: 1,
  },
  callerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 8,
  },
  callerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  callTimeText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  callerPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  visitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  visitTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803D',
  },
  newClientTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  newClientTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309',
  },
  actionButtonsCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  quickBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  quickBookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dialBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalBody: {},
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: colors.textPrimary,
  },
  saveModalBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  saveModalBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
