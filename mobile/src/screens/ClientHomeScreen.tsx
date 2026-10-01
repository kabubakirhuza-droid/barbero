import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  FlatList,
} from 'react-native';
import {
  MapPin,
  Search,
  Scissors,
  Clock,
  ChevronRight,
  User,
  LogOut,
  Map as MapIcon,
  List as ListIcon,
} from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { BarberoLogo } from '../components/BarberoLogo';
import { SalonsMapView, SalonWithLocation } from '../components/SalonsMapView';
import { PublicBookingPreviewModal } from './PublicBookingPreviewModal';
import { confirmAction } from '../utils/alerts';
import { api } from '../api/apiClient';

interface ClientHomeScreenProps {
  onLogout: () => void;
}

export const ClientHomeScreen: React.FC<ClientHomeScreenProps> = ({
  onLogout,
}) => {
  const [salons, setSalons] = useState<SalonWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Booking Modal State
  const [selectedMasterUsername, setSelectedMasterUsername] =
    useState<string | null>(null);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);

  const loadSalons = useCallback(async () => {
    try {
      setError('');
      const data = await api.getAllSalons();
      // Ensure lat/lng coordinates exist for map
      const mappedSalons: SalonWithLocation[] = (data.salons || []).map(
        (s, idx) => ({
          ...s,
          latitude: s.latitude || (idx === 0 ? 41.2828 : 41.3312),
          longitude: s.longitude || (idx === 0 ? 69.2045 : 69.2785),
          memberCount: (s as any).memberCount || 1,
          masters: (s as any).masters || [
            {
              masterId: 'u-1',
              fullName: idx === 0 ? 'Bobur Aliyev' : 'Javohir Karimov',
              username: idx === 0 ? 'bobur' : 'javohir',
            },
          ],
        })
      );
      setSalons(mappedSalons);
    } catch (err: any) {
      setError(err.message || "Salonlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSalons();
  }, [loadSalons]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSalons();
  };

  const filteredSalons = salons.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.address || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenBooking = (salon: SalonWithLocation) => {
    const firstMaster = salon.masters?.[0];
    const username = firstMaster?.username || 'bobur';
    setSelectedMasterUsername(username);
    setIsBookingModalVisible(true);
  };

  const renderSalonCard = ({ item: salon }: { item: SalonWithLocation }) => {
    const mastersCount =
      salon.memberCount || salon.mastersCount || (salon.masters?.length ?? 1);
    const distance = salon.distanceMeters
      ? `${Math.round(salon.distanceMeters)} m`
      : null;

    return (
      <TouchableOpacity
        style={styles.salonCard}
        activeOpacity={0.85}
        onPress={() => handleOpenBooking(salon)}
      >
        {/* Salon Header */}
        <View style={styles.salonCardHeader}>
          <View style={styles.salonIconCircle}>
            <Scissors size={22} color={COLOR_PRIMARY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.salonName}>{salon.name}</Text>
            <View style={styles.salonMeta}>
              <MapPin size={12} color={colors.textMuted} />
              <Text style={styles.salonAddress} numberOfLines={1}>
                {salon.address || "Manzil ko'rsatilmagan"}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </View>

        {/* Salon Info Pills */}
        <View style={styles.salonPills}>
          <View style={styles.pill}>
            <User size={12} color={colors.textSecondary} />
            <Text style={styles.pillText}>{mastersCount} ta usta</Text>
          </View>
          {distance && (
            <View style={styles.pill}>
              <MapPin size={12} color={colors.textSecondary} />
              <Text style={styles.pillText}>{distance} uzoqlikda</Text>
            </View>
          )}
          <View style={[styles.pill, styles.openPill]}>
            <Clock size={12} color="#059669" />
            <Text style={[styles.pillText, { color: '#059669' }]}>Ochiq</Text>
          </View>
        </View>

        {/* Masters */}
        {salon.masters && salon.masters.length > 0 && (
          <View style={styles.mastersRow}>
            {salon.masters.slice(0, 4).map((master, idx) => (
              <View
                key={master.masterId || idx}
                style={[styles.masterChip, { marginLeft: idx > 0 ? 6 : 0 }]}
              >
                <View style={styles.masterAvatar}>
                  <Text style={styles.masterAvatarText}>
                    {master.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <Text style={styles.masterChipName} numberOfLines={1}>
                  {master.fullName?.split(' ')[0] || 'Usta'}
                </Text>
              </View>
            ))}
            {salon.masters.length > 4 && (
              <Text style={styles.moreMasters}>
                +{salon.masters.length - 4}
              </Text>
            )}
          </View>
        )}

        {/* Book Button */}
        <TouchableOpacity
          style={styles.bookBtn}
          activeOpacity={0.85}
          onPress={() => handleOpenBooking(salon)}
        >
          <Text style={styles.bookBtnText}>Vaqt band qilish →</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <BarberoLogo size="sm" showSubtitle={true} />
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() =>
            confirmAction(
              'Hisobdan chiqasizmi?',
              'Haqiqatan ham hisobdan chiqmoqchimisiz?',
              onLogout,
              'Chiqish',
              'Bekor qilish'
            )
          }
          activeOpacity={0.7}
        >
          <LogOut size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Mode Switcher: [ 📋 Ro'yxat ] | [ 🗺️ Xarita ] */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            viewMode === 'list' && styles.modeButtonActive,
          ]}
          onPress={() => setViewMode('list')}
          activeOpacity={0.8}
        >
          <ListIcon
            size={16}
            color={viewMode === 'list' ? '#FFFFFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.modeButtonText,
              viewMode === 'list' && styles.modeButtonTextActive,
            ]}
          >
            Ro'yxat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            viewMode === 'map' && styles.modeButtonActive,
          ]}
          onPress={() => setViewMode('map')}
          activeOpacity={0.8}
        >
          <MapIcon
            size={16}
            color={viewMode === 'map' ? '#FFFFFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.modeButtonText,
              viewMode === 'map' && styles.modeButtonTextActive,
            ]}
          >
            Xarita
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Sartaroshxona yoki manzil izlash..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLOR_PRIMARY} />
          <Text style={styles.loadingText}>Salonlar yuklanmoqda...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadSalons}>
            <Text style={styles.retryText}>Qayta urinish</Text>
          </TouchableOpacity>
        </View>
      ) : viewMode === 'map' ? (
        /* XARITA (MAP) VIEW */
        <SalonsMapView
          salons={filteredSalons}
          onSelectSalon={handleOpenBooking}
        />
      ) : (
        /* RO'YXAT (LIST) VIEW */
        <FlatList
          data={filteredSalons}
          renderItem={renderSalonCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLOR_PRIMARY}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>
                {filteredSalons.length} ta sartaroshxona
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Scissors size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Natija topilmadi' : 'Salonlar mavjud emas'}
              </Text>
              <Text style={styles.emptyDesc}>
                {searchQuery
                  ? "Boshqa so'z bilan qidiring"
                  : "Hozirda hech qanday sartaroshxona ro'yxatga olinmagan"}
              </Text>
            </View>
          }
        />
      )}

      {/* Interactive Public Booking Modal */}
      {selectedMasterUsername && (
        <PublicBookingPreviewModal
          visible={isBookingModalVisible}
          onClose={() => setIsBookingModalVisible(false)}
          masterUsername={selectedMasterUsername}
        />
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
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 12 : 14,
    paddingBottom: 10,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 6,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modeButtonActive: {
    backgroundColor: COLOR_PRIMARY,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    height: '100%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
  },
  retryText: {
    color: COLOR_PRIMARY,
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  listHeader: {
    marginBottom: 8,
  },
  listHeaderTitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  salonCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  salonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  salonIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salonName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  salonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  salonAddress: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  salonPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  openPill: {
    backgroundColor: '#ECFDF5',
  },
  pillText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  mastersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  masterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 20,
    paddingRight: 10,
    paddingVertical: 4,
    gap: 6,
  },
  masterAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLOR_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  masterChipName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    maxWidth: 80,
  },
  moreMasters: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  bookBtn: {
    backgroundColor: COLOR_PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
