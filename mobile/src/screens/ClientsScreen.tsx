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
  Users,
  Search,
  Phone,
  Calendar,
  Clock,
  Scissors,
  Plus,
  ArrowRight,
  RotateCcw,
  X,
  FileText,
  Edit2,
  Trash2,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../api/apiClient';
import { QuickBookingSheet } from '../components/QuickBookingSheet';
import { Client } from '../types';

export const ClientsScreen: React.FC = () => {
  const { t } = useTranslation();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected client details modal
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Quick booking modal
  const [quickBookingVisible, setQuickBookingVisible] = useState(false);
  const [bookingPhone, setBookingPhone] = useState('');

  // Add client modal
  const [addClientModalVisible, setAddClientModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [savingClient, setSavingClient] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      const res = await api.getClients();
      if (res && res.clients) {
        setClients(res.clients);
      }
    } catch (e) {
      console.error('[Clients load error]:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  const handleOpenClientDetails = async (client: Client) => {
    setSelectedClient(client);
    setDetailsModalVisible(true);
    setLoadingHistory(true);
    try {
      const res = await api.getClientHistory(client.id);
      if (res && res.history) {
        setClientHistory(res.history);
      }
    } catch (_) {
      setClientHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRepeatBooking = (client: Client) => {
    setDetailsModalVisible(false);
    setBookingPhone(client.phone);
    setQuickBookingVisible(true);
  };

  const handleCall = (phoneNumber: string) => {
    const clean = phoneNumber.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${clean}`);
  };

  const handleSaveNewClient = async () => {
    if (!newPhone.trim()) {
      Alert.alert('Xatolik', 'Telefon raqamini kiriting');
      return;
    }

    setSavingClient(true);
    try {
      await api.quickClient(newPhone, newName || 'Mijoz', newNotes);
      setAddClientModalVisible(false);
      setNewName('');
      setNewPhone('');
      setNewNotes('');
      loadClients();
    } catch (e: any) {
      Alert.alert('Xatolik', e.message || 'Mijozni saqlashda xatolik');
    } finally {
      setSavingClient(false);
    }
  };

  const filteredClients = clients.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Top Search & Add Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ism yoki telefon orqali qidirish..."
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
          style={styles.addClientBtn}
          onPress={() => setAddClientModalVisible(true)}
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
        ) : filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            const avgSpend = client.visitsCount > 0 ? Math.round(client.totalSpent / client.visitsCount) : client.totalSpent;

            return (
              <TouchableOpacity
                key={client.id}
                style={styles.clientCard}
                onPress={() => handleOpenClientDetails(client)}
                activeOpacity={0.7}
              >
                <View style={styles.clientAvatar}>
                  <Text style={styles.avatarText}>{(client.name || 'M')[0].toUpperCase()}</Text>
                </View>

                <View style={styles.clientInfo}>
                  <View style={styles.clientNameRow}>
                    <Text style={styles.clientName} numberOfLines={1}>
                      {client.name}
                    </Text>
                    <View style={styles.visitCountBadge}>
                      <Text style={styles.visitCountText}>{client.visitsCount || 1} ta tashrif</Text>
                    </View>
                  </View>

                  <Text style={styles.clientPhone}>{client.phone}</Text>

                  {client.notes ? (
                    <Text style={styles.clientNoteSnippet} numberOfLines={1}>
                      💡 {client.notes}
                    </Text>
                  ) : null}
                </View>

                {/* 1-Tap Quick Action */}
                <TouchableOpacity
                  style={styles.quickBookActionBtn}
                  onPress={() => handleRepeatBooking(client)}
                  activeOpacity={0.7}
                >
                  <Scissors size={14} color="#FFFFFF" />
                  <Text style={styles.quickBookActionText}>Yozish</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Users size={36} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Mijozlar topilmadi</Text>
            <Text style={styles.emptySub}>
              Yangi mijoz qo'shish uchun yuqoridagi "+" tugmasini bosing
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Client History & Details Modal */}
      <Modal visible={detailsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailsCard}>
            {selectedClient && (
              <>
                <View style={styles.detailsHeader}>
                  <View style={styles.detailsHeaderLeft}>
                    <View style={styles.detailsAvatar}>
                      <Text style={styles.detailsAvatarText}>
                        {(selectedClient.name || 'M')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.detailsName}>{selectedClient.name}</Text>
                      <Text style={styles.detailsPhone}>{selectedClient.phone}</Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                    <X size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Stats Summary */}
                <View style={styles.detailsStatsRow}>
                  <View style={styles.detailsStatBox}>
                    <Text style={styles.detailsStatLabel}>Tashriflar</Text>
                    <Text style={styles.detailsStatValue}>{selectedClient.visitsCount || 1} ta</Text>
                  </View>
                  <View style={styles.detailsStatDivider} />
                  <View style={styles.detailsStatBox}>
                    <Text style={styles.detailsStatLabel}>Jami tushum</Text>
                    <Text style={styles.detailsStatValue}>
                      {Number(selectedClient.totalSpent || 0).toLocaleString('uz-UZ')} so'm
                    </Text>
                  </View>
                </View>

                {/* Master Notes */}
                {selectedClient.notes ? (
                  <View style={styles.detailsNotesBox}>
                    <Text style={styles.detailsNotesLabel}>Eslatma / Izoh:</Text>
                    <Text style={styles.detailsNotesText}>{selectedClient.notes}</Text>
                  </View>
                ) : null}

                {/* Past Visits History List */}
                <Text style={styles.historyTitle}>TASHRIFLAR TARIXI</Text>
                <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
                  {loadingHistory ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 14 }} />
                  ) : clientHistory.length > 0 ? (
                    clientHistory.map((item) => (
                      <View key={item.id} style={styles.historyItem}>
                        <View style={styles.historyItemLeft}>
                          <Clock size={14} color={colors.textSecondary} />
                          <Text style={styles.historyDate}>{item.date}</Text>
                          <Text style={styles.historyService}>{item.serviceName}</Text>
                        </View>
                        <Text style={styles.historyPrice}>
                          {Number(item.servicePrice).toLocaleString('uz-UZ')} so'm
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noHistoryText}>Tashriflar tarixi hozircha yo'q</Text>
                  )}
                </ScrollView>

                {/* Bottom Actions */}
                <View style={styles.detailsActionsRow}>
                  <TouchableOpacity
                    style={styles.callClientBtn}
                    onPress={() => handleCall(selectedClient.phone)}
                    activeOpacity={0.7}
                  >
                    <Phone size={16} color={colors.primary} />
                    <Text style={styles.callClientBtnText}>Qo'ng'iroq</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.repeatBookBtn}
                    onPress={() => handleRepeatBooking(selectedClient)}
                    activeOpacity={0.8}
                  >
                    <Scissors size={16} color="#FFFFFF" />
                    <Text style={styles.repeatBookBtnText}>Qayta yozish</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Client Modal */}
      <Modal visible={addClientModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.addCard}>
            <View style={styles.addCardHeader}>
              <Text style={styles.addCardTitle}>Yangi mijoz qo'shish</Text>
              <TouchableOpacity onPress={() => setAddClientModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.addCardBody}>
              <Text style={styles.inputLabel}>TELEFON RAQAMI *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="+998 90 123 45 67"
                placeholderTextColor={colors.textTertiary}
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                autoFocus
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>ISMI *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Mijoz ismi (masalan, Aziz)"
                placeholderTextColor={colors.textTertiary}
                value={newName}
                onChangeText={setNewName}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>IZOH / ESLATMA (Ixtiyoriy)</Text>
              <TextInput
                style={[styles.modalInput, { height: 64, paddingTop: 10 }]}
                placeholder="Masalan: Qisqa olishni yaxshi ko'radi"
                placeholderTextColor={colors.textTertiary}
                value={newNotes}
                onChangeText={setNewNotes}
                multiline
              />

              <TouchableOpacity
                style={styles.saveClientBtn}
                onPress={handleSaveNewClient}
                disabled={savingClient}
                activeOpacity={0.8}
              >
                {savingClient ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveClientBtnText}>Mijozni saqlash</Text>
                )}
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
          loadClients();
        }}
        initialPhone={bookingPhone}
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
  addClientBtn: {
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
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  clientInfo: {
    flex: 1,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 8,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  visitCountBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  visitCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803D',
  },
  clientPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  clientNoteSnippet: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 4,
  },
  quickBookActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  quickBookActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  detailsName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailsPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailsStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  detailsStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  detailsStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  detailsStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  detailsStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  detailsNotesBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  detailsNotesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  detailsNotesText: {
    fontSize: 13,
    color: '#78350F',
    marginTop: 2,
  },
  historyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  historyList: {
    maxHeight: 180,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  historyService: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  historyPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  noHistoryText: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    marginVertical: 14,
  },
  detailsActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  callClientBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    height: 48,
    borderRadius: 14,
  },
  callClientBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  repeatBookBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 14,
  },
  repeatBookBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
  },
  addCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addCardBody: {},
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: colors.textPrimary,
  },
  saveClientBtn: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  saveClientBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
