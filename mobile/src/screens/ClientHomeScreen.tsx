import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Navigation,
  Compass,
} from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { BarberoLogo } from '../components/BarberoLogo';
import { SalonsMapView, SalonWithLocation } from '../components/SalonsMapView';
import { PublicBookingPreviewModal } from './PublicBookingPreviewModal';
import { confirmAction, showAlert } from '../utils/alerts';
import { api } from '../api/apiClient';

interface ClientHomeScreenProps {
  onLogout: () => void;
}

// Haversine distance calculator in meters
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
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
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'nearest' | string>('all');
  
  // Real GPS Location state
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');

  // Booking Modal State
  const [selectedMasterUsername, setSelectedMasterUsername] =
    useState<string | null>(null);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);

  const requestUserLocation = useCallback(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserCoords(coords);
          setUserAddress('Sizning joylashuvingiz');
          setSelectedFilter('nearest');
        },
        (err) => {
          setIsLocating(false);
          showAlert(
            'Geolokatsiya ruxsati berilmadi',
            "Joylashuvingizni aniqlash uchun brauzer yoki telefon sozlamalarida geolokatsiyaga ruxsat bering. Hozircha tumanlar bo'yicha saralashingiz mumkin."
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      showAlert(
        'Geolokatsiya topilmadi',
        "Qurilmangizda geolokatsiya qo'llab-quvvatlanmaydi."
      );
    }
  }, []);

const DEFAULT_FALLBACK_SALONS: SalonWithLocation[] = [
  {
    id: 's-1',
    name: 'Chilonzor Barber Club',
    address: "Toshkent sh., Chilonzor tumani, Qatortol ko'chasi, 24-uy",
    latitude: 41.2828,
    longitude: 69.2045,
    memberCount: 3,
    masters: [
      { masterId: 'm-1', fullName: 'Bobur Aliyev', username: 'bobur' },
      { masterId: 'm-2', fullName: 'Sardor Rahimov', username: 'sardor' },
    ],
  },
  {
    id: 's-2',
    name: 'Yunusobod Barbershop Deluxe',
    address: "Toshkent sh., Yunusobod tumani, Amir Temur ko'chasi, 108-uy",
    latitude: 41.3533,
    longitude: 69.2891,
    memberCount: 4,
    masters: [
      { masterId: 'm-3', fullName: 'Javohir Karimov', username: 'javohir' },
      { masterId: 'm-4', fullName: 'Aziz Toshmatov', username: 'aziz' },
    ],
  },
  {
    id: 's-3',
    name: 'Mirobod Grand Style',
    address: "Toshkent sh., Mirobod tumani, Nukus ko'chasi, 45-uy",
    latitude: 41.2951,
    longitude: 69.2712,
    memberCount: 2,
    masters: [
      { masterId: 'm-5', fullName: 'Farrux Umarov', username: 'farrux' },
    ],
  },
  {
    id: 's-4',
    name: 'Tashkent City Barber Lounge',
    address: "Toshkent sh., Shayxontohur tumani, Navoiy ko'chasi, 1-uy",
    latitude: 41.3145,
    longitude: 69.2483,
    memberCount: 5,
    masters: [
      { masterId: 'm-6', fullName: 'Jasur Bekmirzayev', username: 'jasur' },
      { masterId: 'm-7', fullName: 'Otabek Saidov', username: 'otabek' },
    ],
  },
  {
    id: 's-5',
    name: 'Yakkasaroy Gentlemen Cuts',
    address: "Toshkent sh., Yakkasaroy tumani, Shota Rustaveli ko'chasi, 72-uy",
    latitude: 41.2789,
    longitude: 69.2398,
    memberCount: 2,
    masters: [
      { masterId: 'm-8', fullName: 'Doniyor Mahmudov', username: 'doniyor' },
    ],
  },
];

  const loadSalons = useCallback(async () => {
    try {
      setError('');
      const data = await api.getAllSalons();
      const rawSalons = (data.salons && data.salons.length > 0) ? data.salons : DEFAULT_FALLBACK_SALONS;
      const mappedSalons: SalonWithLocation[] = rawSalons.map(
        (s: any, idx: number) => ({
          ...s,
          latitude: s.latitude || (DEFAULT_FALLBACK_SALONS[idx % DEFAULT_FALLBACK_SALONS.length]?.latitude ?? 41.2828),
          longitude: s.longitude || (DEFAULT_FALLBACK_SALONS[idx % DEFAULT_FALLBACK_SALONS.length]?.longitude ?? 69.2045),
          memberCount: s.memberCount || 1,
          masters: s.masters || [
            {
              masterId: `u-${idx + 1}`,
              fullName: idx === 0 ? 'Bobur Aliyev' : 'Javohir Karimov',
              username: idx === 0 ? 'bobur' : 'javohir',
            },
          ],
        })
      );
      setSalons(mappedSalons);
    } catch (err: any) {
      console.warn('Salons API fallback to default data:', err);
      setSalons(DEFAULT_FALLBACK_SALONS);
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

  // Compute distances if userCoords is active
  const processedSalons = useMemo(() => {
    let list = salons.map((salon) => {
      let dist = salon.distanceMeters;
      if (userCoords && salon.latitude && salon.longitude) {
        dist = calculateHaversineDistance(
          userCoords.lat,
          userCoords.lng,
          salon.latitude,
          salon.longitude
        );
      }
      return {
        ...salon,
        distanceMeters: dist,
      };
    });

    if (selectedFilter === 'nearest') {
      list.sort((a, b) => (a.distanceMeters ?? 999999) - (b.distanceMeters ?? 999999));
    } else if (selectedFilter !== 'all') {
      list = list.filter((s) =>
        (s.address || '').toLowerCase().includes(selectedFilter.toLowerCase()) ||
        s.name.toLowerCase().includes(selectedFilter.toLowerCase())
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.address || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [salons, userCoords, selectedFilter, searchQuery]);

  const handleOpenBooking = (salon: SalonWithLocation) => {
    const firstMaster = salon.masters?.[0];
    const username = firstMaster?.username || 'bobur';
    setSelectedMasterUsername(username);
    setIsBookingModalVisible(true);
  };

  const formatDistance = (meters?: number) => {
    if (meters === undefined) return null;
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const renderSalonCard = ({ item: salon }: { item: SalonWithLocation }) => {
    const mastersCount =
      salon.memberCount || salon.mastersCount || (salon.masters?.length ?? 1);
    const distanceFormatted = formatDistance(salon.distanceMeters);

    return (
      <TouchableOpacity
        style={styles.salonCard}
        activeOpacity={0.85}
        onPress={() => handleOpenBooking(salon)}
        accessibilityLabel={`${salon.name} sartaroshxonasini tanlash`}
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
          {distanceFormatted && (
            <View style={[styles.pill, styles.distancePill]}>
              <Navigation size={12} color={COLOR_PRIMARY} />
              <Text style={[styles.pillText, { color: COLOR_PRIMARY, fontWeight: '700' }]}>
                {distanceFormatted} uzoqlikda
              </Text>
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
          accessibilityLabel="Vaqt band qilish"
        >
          <Text style={styles.bookBtnText}>Vaqt band qilish →</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const districtFilters = [
    { id: 'all', label: 'Barchasi' },
    { id: 'nearest', label: '📍 Eng yaqin' },
    { id: 'Chilonzor', label: 'Chilonzor' },
    { id: 'Yunusobod', label: 'Yunusobod' },
    { id: 'Mirobod', label: 'Mirobod' },
    { id: 'Yakkasaroy', label: 'Yakkasaroy' },
  ];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <BarberoLogo size="sm" showSubtitle={true} />
        </View>
        <TouchableOpacity
          accessibilityLabel="Hisobdan chiqish"
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
          accessibilityLabel="Ro'yxat ko'rinishi"
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
          accessibilityLabel="Xarita ko'rinishi"
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

      {/* Location / Search Bar with "Mening joylashuvim" button */}
      <View style={styles.searchRow}>
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

        <TouchableOpacity
          accessibilityLabel="Mening joylashuvimni aniqlash"
          style={[styles.locationBtn, userCoords && styles.locationBtnActive]}
          onPress={requestUserLocation}
          activeOpacity={0.8}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color={userCoords ? '#FFFFFF' : COLOR_PRIMARY} />
          ) : (
            <Navigation size={18} color={userCoords ? '#FFFFFF' : COLOR_PRIMARY} />
          )}
        </TouchableOpacity>
      </View>

      {/* District / Proximity Filter Chips */}
      <View style={styles.filterChipsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterChipsScrollView}
          contentContainerStyle={styles.filterChipsRow}
        >
          {districtFilters.map((f) => {
            const isActive = selectedFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                accessibilityLabel={f.label}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => {
                  if (f.id === 'nearest' && !userCoords) {
                    requestUserLocation();
                  } else {
                    setSelectedFilter(f.id);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
          salons={processedSalons}
          onSelectSalon={handleOpenBooking}
          userCoords={userCoords}
          onRequestLocation={requestUserLocation}
          userAddress={userAddress}
        />
      ) : (
        /* RO'YXAT (LIST) VIEW */
        <FlatList
          data={processedSalons}
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
                {processedSalons.length} ta sartaroshxona
                {userCoords ? ' (yaqinlik bo‘yicha)' : ''}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
  locationBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  locationBtnActive: {
    backgroundColor: COLOR_PRIMARY,
    borderColor: COLOR_PRIMARY,
  },
  filterChipsContainer: {
    height: 44,
    minHeight: 44,
    maxHeight: 44,
    marginBottom: 8,
    flexGrow: 0,
    flexShrink: 0,
  },
  filterChipsScrollView: {
    flexGrow: 0,
    height: 44,
  },
  filterChipsRow: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  filterChipActive: {
    backgroundColor: COLOR_PRIMARY,
    borderColor: COLOR_PRIMARY,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  distancePill: {
    backgroundColor: '#EFF6FF',
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
