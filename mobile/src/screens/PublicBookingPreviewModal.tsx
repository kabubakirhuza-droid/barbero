import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { X, Check, Clock, ShieldCheck, MapPin, Phone, User as UserIcon, Star, Calendar } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { Button } from '../components/Button';
import { api } from '../api/apiClient';
import { APP_BASE_URL } from '../config/appConfig';
import { showAlert } from '../utils/alerts';
import { ReviewsListModal } from '../components/ReviewsListModal';

interface PublicBookingPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  masterUsername?: string;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  duration?: number | string;
  description?: string;
  isActive?: boolean;
}

interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

export const PublicBookingPreviewModal: React.FC<PublicBookingPreviewModalProps> = ({
  visible,
  onClose,
  masterUsername = 'bobur',
}) => {
  const [masterInfo, setMasterInfo] = useState<any>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingMaster, setIsLoadingMaster] = useState(false);
  
  const [clientName, setClientName] = useState('');
  const [rawPhone, setRawPhone] = useState('');
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [ratingStats, setRatingStats] = useState({ rating: 4.9, count: 18 });
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate real upcoming dates starting from today
  const datesList = React.useMemo(() => {
    const list: { label: string; iso: string }[] = [];
    const months = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentyabr', 'oktabr', 'noyabr', 'dekabr'
    ];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const day = d.getDate();
      const month = months[d.getMonth()];
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      list.push({
        label: i === 0 ? 'Bugun' : i === 1 ? 'Ertaga' : `${day}-${month}`,
        iso: `${yyyy}-${mm}-${dd}`,
      });
    }
    return list;
  }, []);

  const selectedDateObj = datesList[selectedDateIndex] || datesList[0];

  // Prefill client profile automatically if logged in or saved in AsyncStorage
  useEffect(() => {
    const initClientInfo = async () => {
      try {
        let savedName = await AsyncStorage.getItem('barbero_client_name');
        let savedPhone = await AsyncStorage.getItem('barbero_client_phone');
        if (!savedName) savedName = await AsyncStorage.getItem('app_user_name');
        if (!savedPhone) savedPhone = await AsyncStorage.getItem('app_user_phone');

        // Check active login token
        const token = await api.getToken();
        if (token) {
          try {
            const meRes = await api.getMe();
            if (meRes?.user) {
              setIsUserLoggedIn(true);
              const fullName = meRes.user.name || meRes.user.ism || '';
              if (fullName && (!savedName || savedName === 'Foydalanuvchi')) {
                savedName = fullName;
              }
              if (meRes.user.phone && !savedPhone) {
                savedPhone = meRes.user.phone;
              }
            }
          } catch (e) {}
        }

        if (savedName && savedName !== 'Foydalanuvchi') {
          setClientName(savedName);
        }
        if (savedPhone) {
          const clean = savedPhone.replace(/\D/g, '');
          const finalRaw = clean.startsWith('998') ? clean.slice(3) : clean;
          setRawPhone(finalRaw);
          if (finalRaw.length >= 9) {
            setIsUserLoggedIn(true);
          }
        }
      } catch (e) {}
    };
    if (visible) {
      initClientInfo();
    }
  }, [visible]);

  // Load Master and Services dynamically
  useEffect(() => {
    if (visible && masterUsername) {
      setIsLoadingMaster(true);
      api.getPublicMasterInfo(masterUsername)
        .then((data) => {
          if (data && data.master) {
            setMasterInfo(data.master);
          }
          if (data && Array.isArray(data.services) && data.services.length > 0) {
            setServices(data.services);
            setSelectedServiceId(data.services[0].id);
          } else {
            // Fallback default service
            const defaultSrv = {
              id: 'srv-default',
              name: 'Soch olish',
              price: 50000,
              duration: 30,
              description: 'Zamonaviy soch turmagi va parvarish',
            };
            setServices([defaultSrv]);
            setSelectedServiceId(defaultSrv.id);
          }
        })
        .catch(() => {
          // Graceful fallback
          setServices([
            {
              id: 'srv-1',
              name: 'Soch olish',
              price: 50000,
              duration: 30,
              description: 'Zamonaviy soch turmagi va parvarish',
            },
          ]);
          setSelectedServiceId('srv-1');
        })
        .finally(() => {
          setIsLoadingMaster(false);
        });

      // Reviews
      api.getReviews(masterUsername)
        .then((res) => {
          if (res) {
            setRatingStats({
              rating: res.avgRating || 4.9,
              count: res.count || 18,
            });
          }
        })
        .catch(() => {});
    }
  }, [visible, masterUsername]);

  // Fetch real available slots for the selected date
  const loadSlots = useCallback(async () => {
    if (!masterUsername || !selectedDateObj) return;
    setIsLoadingSlots(true);
    try {
      const res = await api.getPublicAvailableSlots(masterUsername, selectedDateObj.iso);
      if (res && Array.isArray(res.slots)) {
        setAvailableSlots(res.slots);
        // Find first available slot
        const firstAvail = res.slots.find((s) => s.isAvailable);
        if (firstAvail) {
          setSelectedTime(firstAvail.time);
        } else {
          setSelectedTime('');
        }
      }
    } catch (e) {
      // Fallback base slots
      const baseTimes = [
        '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
      ];
      const slots = baseTimes.map((t) => ({ time: t, isAvailable: true }));
      setAvailableSlots(slots);
      setSelectedTime(slots[0]?.time || '10:00');
    } finally {
      setIsLoadingSlots(false);
    }
  }, [masterUsername, selectedDateObj]);

  useEffect(() => {
    if (visible) {
      loadSlots();
    }
  }, [visible, selectedDateIndex, loadSlots]);

  const formatPhoneInput = (text: string) => {
    let digits = text.replace(/\D/g, '');
    if (digits.startsWith('998')) {
      digits = digits.slice(3);
    }
    setRawPhone(digits.slice(0, 9));
  };

  const getFormattedPhoneDisplay = () => {
    let res = '+998';
    if (!rawPhone) return '+998 ';
    res += ' ';
    for (let i = 0; i < rawPhone.length; i++) {
      if (i === 2 || i === 5 || i === 7) {
        res += ' ';
      }
      res += rawPhone[i];
    }
    return res;
  };

  const handleBook = async () => {
    if (!clientName.trim()) {
      showAlert('Xatolik', 'Iltimos, ismingizni kiriting');
      return;
    }
    if (rawPhone.length < 9) {
      showAlert('Xatolik', "Iltimos, to'liq telefon raqamingizni kiriting (+998 XX XXX XX XX)");
      return;
    }
    if (!selectedTime) {
      showAlert('Xatolik', 'Iltimos, qabul vaqtini tanlang');
      return;
    }

    try {
      setIsSubmitting(true);
      const chosenService =
        services.find((s) => s.id === selectedServiceId) || services[0];

      const fullPhone = `+998${rawPhone}`;

      // Persist client details for future bookings
      await AsyncStorage.setItem('barbero_client_name', clientName.trim());
      await AsyncStorage.setItem('barbero_client_phone', fullPhone);

      await api.bookPublicSlot(masterUsername, {
        clientName: clientName.trim(),
        clientPhone: fullPhone,
        serviceId: chosenService.id,
        date: selectedDateObj.iso,
        startTime: selectedTime,
      });

      setIsSuccess(true);
    } catch (e: any) {
      showAlert('Xatolik', e.message || "So'rov yuborishda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const morningSlots = availableSlots.filter((s) => {
    const h = parseInt(s.time.split(':')[0], 10);
    return h < 12;
  });
  const afternoonSlots = availableSlots.filter((s) => {
    const h = parseInt(s.time.split(':')[0], 10);
    return h >= 12 && h < 17;
  });
  const eveningSlots = availableSlots.filter((s) => {
    const h = parseInt(s.time.split(':')[0], 10);
    return h >= 17;
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.urlPill}>
            <Text style={styles.urlText}>🔒 {APP_BASE_URL}/b/{masterUsername}</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Yopish"
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <X size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {isSuccess ? (
          <View style={styles.successContainer}>
            <View style={styles.successIconCircle}>
              <Check size={36} color="#FFFFFF" strokeWidth={3} />
            </View>
            <Text style={styles.successTitle}>Siz muvaffaqiyatli yozildingiz!</Text>
            <Text style={styles.successDesc}>
              {clientName}, sizning qabulingiz {selectedDateObj.label} soat {selectedTime} ga tasdiqlandi.
              Sizga SMS eslatma yuboriladi.
            </Text>

            <Button
              title="Yopish"
              onPress={() => {
                setIsSuccess(false);
                onClose();
              }}
              style={{ marginTop: 24, width: '80%' }}
            />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Master Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {masterInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.verifiedRow}>
                  <Text style={styles.masterName}>{masterInfo?.name || 'Bobur Aliyev'}</Text>
                  <ShieldCheck size={18} color={COLOR_PRIMARY} />
                </View>
                <Text style={styles.masterBio}>{masterInfo?.bio || 'Barber & Erkaklar stilisti'}</Text>
                <View style={styles.locationRow}>
                  <MapPin size={13} color={colors.textSecondary} />
                  <Text style={styles.locationText}>Toshkent sh., Chilonzor</Text>
                  <TouchableOpacity
                    style={styles.ratingBadgeBtn}
                    onPress={() => setIsReviewsModalOpen(true)}
                    activeOpacity={0.7}
                  >
                    <Star size={12} color="#D97706" fill="#F59E0B" />
                    <Text style={styles.ratingBadgeText}>
                      {ratingStats.rating} ({ratingStats.count} sharh)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Schedule Info */}
            <View style={styles.scheduleInfoPill}>
              <Clock size={16} color={COLOR_PRIMARY} />
              <Text style={styles.scheduleInfoText}>
                {masterInfo?.workingDays || 'Dush – Shan 09:00 – 21:00'}
              </Text>
            </View>

            {/* Step 1: Select Service */}
            <Text style={styles.sectionTitle}>1. Xizmatni tanlang</Text>
            {isLoadingMaster ? (
              <ActivityIndicator size="small" color={COLOR_PRIMARY} style={{ marginVertical: 12 }} />
            ) : (
              <View style={styles.servicesList}>
                {services.map((srv) => {
                  const isSelected = selectedServiceId === srv.id;
                  return (
                    <TouchableOpacity
                      key={srv.id}
                      style={[styles.serviceCard, isSelected && styles.serviceCardActive]}
                      onPress={() => setSelectedServiceId(srv.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.serviceMeta}>
                        <Text style={styles.serviceName}>{srv.name}</Text>
                        {srv.description ? (
                          <Text style={styles.serviceDesc}>{srv.description}</Text>
                        ) : null}
                        <Text style={styles.serviceDuration}>⏱ {srv.duration || 30} min</Text>
                      </View>
                      <View style={styles.servicePriceCol}>
                        <Text style={styles.servicePriceText}>
                          {srv.price.toLocaleString('uz-UZ')} uzs
                        </Text>
                        <View style={[styles.selectRadio, isSelected && styles.selectRadioActive]}>
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Step 2: Select Date & Time */}
            <Text style={styles.sectionTitle}>2. Qulay sana va vaqtni tanlang</Text>

            {/* Horizontal Date Picker */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.datesRow}
            >
              {datesList.map((d, idx) => {
                const isSelected = selectedDateIndex === idx;
                return (
                  <TouchableOpacity
                    key={d.iso}
                    style={[styles.dateChip, isSelected && styles.dateChipActive]}
                    onPress={() => setSelectedDateIndex(idx)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dateChipText,
                        isSelected && styles.dateChipTextActive,
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Slots Container */}
            <View style={styles.darkTimeContainer}>
              {isLoadingSlots ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 8 }}>
                    Bo'sh vaqtlar tekshirilmoqda...
                  </Text>
                </View>
              ) : availableSlots.length === 0 ? (
                <Text style={{ color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 }}>
                  Ushbu kunda qabul uchun bo'sh vaqt yo'q
                </Text>
              ) : (
                <>
                  {morningSlots.length > 0 && (
                    <View style={styles.timeGroupSection}>
                      <Text style={styles.timeGroupHeader}>Ertalab</Text>
                      <View style={styles.timeGrid}>
                        {morningSlots.map((slot) => {
                          const isSelected = selectedTime === slot.time;
                          return (
                            <TouchableOpacity
                              key={slot.time}
                              disabled={!slot.isAvailable}
                              style={[
                                styles.timeSlotPill,
                                !slot.isAvailable && styles.timeSlotPillDisabled,
                                isSelected && styles.timeSlotPillActive,
                              ]}
                              onPress={() => setSelectedTime(slot.time)}
                              activeOpacity={0.75}
                            >
                              <Text
                                style={[
                                  styles.timeSlotText,
                                  !slot.isAvailable && styles.timeSlotTextDisabled,
                                  isSelected && styles.timeSlotTextActive,
                                ]}
                              >
                                {slot.time}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {afternoonSlots.length > 0 && (
                    <View style={styles.timeGroupSection}>
                      <Text style={styles.timeGroupHeader}>Kunduzi</Text>
                      <View style={styles.timeGrid}>
                        {afternoonSlots.map((slot) => {
                          const isSelected = selectedTime === slot.time;
                          return (
                            <TouchableOpacity
                              key={slot.time}
                              disabled={!slot.isAvailable}
                              style={[
                                styles.timeSlotPill,
                                !slot.isAvailable && styles.timeSlotPillDisabled,
                                isSelected && styles.timeSlotPillActive,
                              ]}
                              onPress={() => setSelectedTime(slot.time)}
                              activeOpacity={0.75}
                            >
                              <Text
                                style={[
                                  styles.timeSlotText,
                                  !slot.isAvailable && styles.timeSlotTextDisabled,
                                  isSelected && styles.timeSlotTextActive,
                                ]}
                              >
                                {slot.time}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {eveningSlots.length > 0 && (
                    <View style={styles.timeGroupSection}>
                      <Text style={styles.timeGroupHeader}>Kechqurun</Text>
                      <View style={styles.timeGrid}>
                        {eveningSlots.map((slot) => {
                          const isSelected = selectedTime === slot.time;
                          return (
                            <TouchableOpacity
                              key={slot.time}
                              disabled={!slot.isAvailable}
                              style={[
                                styles.timeSlotPill,
                                !slot.isAvailable && styles.timeSlotPillDisabled,
                                isSelected && styles.timeSlotPillActive,
                              ]}
                              onPress={() => setSelectedTime(slot.time)}
                              activeOpacity={0.75}
                            >
                              <Text
                                style={[
                                  styles.timeSlotText,
                                  !slot.isAvailable && styles.timeSlotTextDisabled,
                                  isSelected && styles.timeSlotTextActive,
                                ]}
                              >
                                {slot.time}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Step 3: Client Details */}
            <Text style={styles.sectionTitle}>3. Ma'lumotlaringiz</Text>
            {isUserLoggedIn && clientName && rawPhone.length >= 9 && !isEditingProfile ? (
              <View style={styles.loggedInProfileCard}>
                <View style={styles.loggedInAvatar}>
                  <Text style={styles.loggedInAvatarText}>
                    {clientName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.loggedInName}>{clientName}</Text>
                    <View style={styles.verifiedTag}>
                      <Check size={11} color="#059669" />
                      <Text style={styles.verifiedTagText}>Hisobingiz</Text>
                    </View>
                  </View>
                  <Text style={styles.loggedInPhone}>{getFormattedPhoneDisplay()}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsEditingProfile(true)}
                  style={styles.editProfileBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editProfileText}>O'zgartirish</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputsCard}>
                {isEditingProfile && (
                  <View style={styles.editingBanner}>
                    <Text style={styles.editingBannerText}>Ma'lumotlarni tahrirlash</Text>
                    <TouchableOpacity onPress={() => setIsEditingProfile(false)}>
                      <Text style={styles.doneEditText}>Tayyor</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Ismingiz</Text>
                  <View style={styles.inputRow}>
                    <UserIcon size={18} color={COLOR_PRIMARY} />
                    <TextInput
                      style={styles.innerInput}
                      value={clientName}
                      onChangeText={setClientName}
                      placeholder="Ismingizni kiriting"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Telefon raqamingiz</Text>
                  <View style={styles.inputRow}>
                    <Phone size={18} color={COLOR_PRIMARY} />
                    <TextInput
                      style={styles.innerInput}
                      value={getFormattedPhoneDisplay()}
                      onChangeText={formatPhoneInput}
                      keyboardType="phone-pad"
                      placeholder="+998 90 123 45 67"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Submit Booking Button */}
            <Button
              title="Yozilish"
              loading={isSubmitting}
              onPress={handleBook}
              style={{ marginTop: 12, marginBottom: 20 }}
            />
          </ScrollView>
        )}

        {/* Reviews and Ratings Modal */}
        <ReviewsListModal
          visible={isReviewsModalOpen}
          onClose={() => setIsReviewsModalOpen(false)}
          masterId={masterUsername}
          masterName={masterInfo?.name || 'Bobur Aliyev'}
        />
      </View>
    </Modal>
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
    paddingTop: Platform.OS === 'ios' ? 14 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorderSubtle,
    backgroundColor: colors.background,
  },
  urlPill: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  urlText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    gap: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLOR_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  masterName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  masterBio: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 3,
  },
  locationText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  ratingBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  scheduleInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  scheduleInfoText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  servicesList: {
    gap: 10,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  serviceCardActive: {
    borderColor: COLOR_PRIMARY,
    backgroundColor: '#EFF6FF',
  },
  serviceMeta: {
    flex: 1,
    gap: 4,
    paddingRight: 10,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  serviceDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  serviceDuration: {
    fontSize: 11,
    fontWeight: '600',
    color: COLOR_PRIMARY,
    marginTop: 2,
  },
  servicePriceCol: {
    alignItems: 'flex-end',
    gap: 10,
  },
  servicePriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLOR_PRIMARY,
  },
  selectRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectRadioActive: {
    borderColor: COLOR_PRIMARY,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLOR_PRIMARY,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  dateChip: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  dateChipActive: {
    backgroundColor: COLOR_PRIMARY,
    borderColor: COLOR_PRIMARY,
  },
  dateChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dateChipTextActive: {
    color: '#FFFFFF',
  },
  darkTimeContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  timeGroupSection: {
    gap: 8,
  },
  timeGroupHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 2,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotPill: {
    width: '23%',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotPillDisabled: {
    opacity: 0.35,
    backgroundColor: '#334155',
  },
  timeSlotPillActive: {
    backgroundColor: COLOR_PRIMARY,
    borderWidth: 1.5,
    borderColor: '#60A5FA',
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeSlotTextDisabled: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  timeSlotTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  loggedInProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    gap: 12,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  loggedInAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLOR_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedInAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loggedInName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  loggedInPhone: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  editProfileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  editingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  editingBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  doneEditText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  inputsCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  innerInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    height: '100%',
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          outlineWidth: 0,
          outline: 'none',
        } as any)
      : {}),
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  successDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
