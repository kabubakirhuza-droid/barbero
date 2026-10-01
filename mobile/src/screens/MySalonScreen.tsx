import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ChevronLeft,
  Store,
  MapPin,
  Users,
  ShieldCheck,
  Share2,
  ExternalLink,
  Plus,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTranslation } from '../i18n/LanguageContext';
import { Button } from '../components/Button';
import { api } from '../api/apiClient';
import { APP_BASE_URL } from '../config/appConfig';
import { Salon } from '../types';

interface MySalonScreenProps {
  onBack: () => void;
}

export const MySalonScreen: React.FC<MySalonScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMySalon = async () => {
    setLoading(true);
    try {
      const data = await api.getMySalon();
      if (data?.salon) {
        setSalon(data.salon);
        setMembers(data.members || []);
      }
    } catch (e) {
      // Fallback demo salon
      setSalon({
        id: 'salon-1',
        name: 'Grand Barber Studio',
        address: 'Toshkent sh., Amir Temur shox ko\'chasi 14',
        latitude: 41.311081,
        longitude: 69.240562,
        memberCount: 3,
        createdBy: 'user-1',
      });
      setMembers([
        { id: 'm-1', name: 'Bobur Aliyev', phone: '+998 90 033 51 02', role: 'owner' },
        { id: 'm-2', name: 'Jamshid Toirov', phone: '+998 90 123 45 67', role: 'member' },
        { id: 'm-3', name: 'Alisher Navoiy', phone: '+998 90 987 65 43', role: 'member' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMySalon();
  }, []);

  const handleShare = () => {
    Alert.alert('Ulashish', `Sartaroshxona manzili: ${salon?.address || ''}\n${APP_BASE_URL}/s/${salon?.id || ''}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sartaroshxonam</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
          <Share2 size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Salon Overview Card */}
          <View style={styles.salonHeroCard}>
            <View style={styles.iconCircle}>
              <Store size={32} color={colors.primary} />
            </View>
            <Text style={styles.salonName}>{salon?.name || 'Mening Sartaroshxonam'}</Text>
            <View style={styles.addressRow}>
              <MapPin size={16} color={colors.primary} />
              <Text style={styles.addressText}>{salon?.address || 'Toshkent sh.'}</Text>
            </View>

            <View style={styles.coordsBadge}>
              <Text style={styles.coordsText}>
                📍 Xarita nuqtasi: {salon?.latitude?.toFixed(4)}, {salon?.longitude?.toFixed(4)} (50 m radius)
              </Text>
            </View>
          </View>

          {/* Map Preview Card */}
          <View style={styles.mapCard}>
            <View style={styles.mapVisualPlaceholder}>
              <View style={styles.mapPinPulse}>
                <MapPin size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.mapLabel}>Yagona xarita nuqtasi</Text>
              <Text style={styles.mapSubLabel}>Barcha ustalar shu bitta nuqtada ko'rinadi</Text>
            </View>
          </View>

          {/* Masters in this salon */}
          <View style={styles.membersSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Sartaroshxonadagi ustalar ({members.length})</Text>
              <View style={styles.membersBadge}>
                <Users size={14} color={colors.primary} />
                <Text style={styles.membersBadgeText}>{members.length} ta</Text>
              </View>
            </View>

            <View style={styles.membersListCard}>
              {members.map((m, idx) => (
                <View key={m.id || idx}>
                  <View style={styles.memberItem}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.avatarLetter}>{(m.name || 'U')[0]}</Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.memberName}>{m.name}</Text>
                        {m.role === 'owner' && (
                          <View style={styles.ownerBadge}>
                            <ShieldCheck size={12} color="#059669" />
                            <Text style={styles.ownerBadgeText}>Asoschi</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.memberPhone}>{m.phone}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.bookingLinkBtn}
                      onPress={() => Alert.alert('Booking havola', `${APP_BASE_URL}/b/${m.name?.toLowerCase().replace(/\s+/g, '')}`)}
                      activeOpacity={0.7}
                    >
                      <ExternalLink size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                  {idx < members.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 48 : 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorderSubtle,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  salonHeroCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  salonName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  coordsBadge: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorderSubtle,
  },
  coordsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  mapCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  mapVisualPlaceholder: {
    height: 160,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mapPinPulse: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  mapLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  mapSubLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  membersSection: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  membersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  membersBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  membersListCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  memberPhone: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bookingLinkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorderSubtle,
    marginLeft: 72,
  },
});
