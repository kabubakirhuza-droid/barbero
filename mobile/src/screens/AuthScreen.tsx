import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  ChevronLeft,
  MapPin,
  Store,
  Phone,
  User as UserIcon,
  LogIn,
  UserPlus,
  Sparkles,
} from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { useTranslation } from '../i18n/LanguageContext';
import { Button } from '../components/Button';
import { BarberoLogo } from '../components/BarberoLogo';
import { api } from '../api/apiClient';
import { SALON_MERGE_RADIUS_M } from '../config/appConfig';
import { Salon, UserRole } from '../types';
import { SalonLocationMapPicker } from '../components/SalonLocationMapPicker';

interface AuthScreenProps {
  onSuccess: () => void;
  onClose?: () => void;
  role?: UserRole; // CLIENT or MASTER
}

type AuthMode = 'register' | 'login';
type AuthStep = 'name' | 'phone' | 'code' | 'location';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  onClose,
  role = 'MASTER',
}) => {
  const { t } = useTranslation();

  // Mode: 'register' (Ro'yxatdan o'tish) or 'login' (Kirish)
  const [mode, setMode] = useState<AuthMode>('register');
  const [step, setStep] = useState<AuthStep>('name');

  // Step: Ism & Familiya (For Register mode)
  const [ism, setIsm] = useState('');
  const [familiya, setFamiliya] = useState('');
  const [ismFocused, setIsmFocused] = useState(false);
  const [familiyaFocused, setFamiliyaFocused] = useState(false);

  // Step: Phone
  const [rawPhone, setRawPhone] = useState('901234567');
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step: Code verification (Unified 6 digits)
  const [codeValue, setCodeValue] = useState('');
  const [countdown, setCountdown] = useState(55);
  const [requestId, setRequestId] = useState('');
  const codeInputRef = useRef<TextInput | null>(null);

  // Step: Geolocation & Salon (For MASTER)
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 41.311081,
    lng: 69.240562,
  });
  const [nearbySalons, setNearbySalons] = useState<
    (Salon & { distanceMeters: number })[]
  >([]);
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const [showCreateNewModal, setShowCreateNewModal] = useState(false);
  const [newSalonName, setNewSalonName] = useState('');
  const [newSalonAddress, setNewSalonAddress] = useState('Toshkent sh., Chilonzor');

  // Switch between Register and Login modes
  const handleSwitchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage('');
    if (newMode === 'login') {
      setStep('phone');
    } else {
      setStep('name');
    }
  };

  // Timer countdown for verification code
  useEffect(() => {
    let timer: any = null;
    if (step === 'code' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  // Focus code input when entering code step
  useEffect(() => {
    if (step === 'code') {
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 200);
    }
  }, [step]);

  // Format phone: strip non-digits, keep max 9 digits
  const formatPhoneInput = (text: string) => {
    let digitsOnly = text.replace(/\D/g, '');
    if (digitsOnly.startsWith('998')) {
      digitsOnly = digitsOnly.slice(3);
    }
    setRawPhone(digitsOnly.slice(0, 9));
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

  const fullPhoneE164 = `+998${rawPhone}`;

  const getMaskedPhoneDisplay = () => {
    if (rawPhone.length >= 9) {
      const p1 = rawPhone.slice(0, 2);
      const pLast = rawPhone.slice(-2);
      return `+998 ${p1} *** ** ${pLast}`;
    }
    return `+998 ${rawPhone}`;
  };

  // STEP: Name -> Phone (in Register mode)
  const handleProceedToPhone = () => {
    if (!ism.trim() || !familiya.trim()) {
      setErrorMessage("Iltimos, ism va familiyangizni kiriting");
      return;
    }
    setErrorMessage('');
    setStep('phone');
  };

  // STEP: Send code via Telegram Gateway / SMS
  const handleSendCode = async () => {
    if (rawPhone.length < 9) {
      setErrorMessage("Iltimos, to'liq 9 xonali telefon raqam kiriting");
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const res = await api.sendCode(fullPhoneE164);
      if (res.requestId) {
        setRequestId(res.requestId);
      }
      setCountdown(55);
      setStep('code');
      setCodeValue('');
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Tasdiqlash kodi yuborishda xatolik yuz berdi'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Code Input change & paste
  const handleCodeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    setCodeValue(cleaned);
    if (errorMessage) setErrorMessage('');
    if (cleaned.length === 6) {
      // Auto-trigger verify on complete 6 digits
      handleVerifyCode(cleaned);
    }
  };

  // Verify Code
  const handleVerifyCode = async (overrideCode?: string) => {
    const codeToVerify = overrideCode || codeValue;
    if (codeToVerify.length !== 6) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await api.verifyCode(fullPhoneE164, codeToVerify, requestId);

      // If user exists and is in login mode or has full name:
      if (mode === 'login' && res?.user?.ism) {
        onSuccess();
        return;
      }

      // If in register mode or profile needs to be saved:
      const nameToSave = ism.trim() || res?.user?.ism || 'Foydalanuvchi';
      const surNameToSave = familiya.trim() || res?.user?.familiya || 'Barbero';

      await api.registerProfile(
        nameToSave,
        surNameToSave,
        role
      ).catch(() => {});

      if (role === 'CLIENT') {
        onSuccess();
      } else {
        setStep('location');
        detectAndSearchSalons();
      }
    } catch (err: any) {
      console.warn('Verify code error:', err);
      setErrorMessage(err.message || 'Tasdiqlash kodi noto‘g‘ri yoki muddati o‘tgan');
    } finally {
      setLoading(false);
    }
  };

  // STEP: Geolocation & Salon Detection
  const detectAndSearchSalons = async () => {
    setDetectingLocation(true);
    setErrorMessage('');

    let currentLat = 41.311081;
    let currentLng = 69.240562;

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              currentLat = pos.coords.latitude;
              currentLng = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 3000, enableHighAccuracy: true }
          );
        });
      } catch (e) {}
    }

    setCoords({ lat: currentLat, lng: currentLng });

    try {
      const data = await api.getNearbySalons(
        currentLat,
        currentLng,
        SALON_MERGE_RADIUS_M
      );
      const mapped = (data.salons || []).map((s) => ({
        ...s,
        distanceMeters: (s as any).distanceMeters ?? 0,
      }));
      setNearbySalons(mapped);
      if (mapped.length > 0) {
        setSelectedSalonId(mapped[0].id);
      }
    } catch (err: any) {
      console.warn('Failed to fetch nearby salons:', err.message);
      setNearbySalons([]);
    } finally {
      setDetectingLocation(false);
    }
  };

  // Join Existing Salon
  const handleJoinSalon = async () => {
    if (!selectedSalonId) return;
    setLoading(true);
    try {
      await api.joinSalon(selectedSalonId);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "Sartaroshxonaga qo'shilishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Create New Salon
  const handleCreateSalon = async () => {
    const name = newSalonName.trim() || `${ism || 'Barbero'} Sartaroshxonasi`;
    setLoading(true);
    try {
      await api.createSalon({
        name,
        address: newSalonAddress,
        latitude: coords.lat,
        longitude: coords.lng,
      });
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Sartaroshxona yaratishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header with Barbero Logo & Back / Close button */}
      <View style={styles.header}>
        {step === 'phone' && mode === 'register' ? (
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setStep('name')}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : step === 'code' ? (
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setStep('phone')}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : onClose ? (
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtnPlaceholder} />
        )}

        <BarberoLogo size="sm" showSubtitle={false} />

        <View style={styles.headerBtnPlaceholder} />
      </View>

      {/* Mode Switcher: [ Ro'yxatdan o'tish ] | [ Kirish ] */}
      {step !== 'location' && step !== 'code' && (
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[
              styles.modeTab,
              mode === 'register' && styles.modeTabActive,
            ]}
            onPress={() => handleSwitchMode('register')}
            activeOpacity={0.8}
          >
            <UserPlus
              size={16}
              color={mode === 'register' ? COLOR_PRIMARY : colors.textSecondary}
            />
            <Text
              style={[
                styles.modeTabText,
                mode === 'register' && styles.modeTabTextActive,
              ]}
            >
              Ro'yxatdan o'tish
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTab,
              mode === 'login' && styles.modeTabActive,
            ]}
            onPress={() => handleSwitchMode('login')}
            activeOpacity={0.8}
          >
            <LogIn
              size={16}
              color={mode === 'login' ? COLOR_PRIMARY : colors.textSecondary}
            />
            <Text
              style={[
                styles.modeTabText,
                mode === 'login' && styles.modeTabTextActive,
              ]}
            >
              Kirish
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 1: Name Input (In Register mode) */}
      {step === 'name' && mode === 'register' && (
        <View style={styles.content}>
          <View style={styles.titlesArea}>
            <Text style={styles.mainTitle}>Xush kelibsiz!</Text>
            <Text style={styles.subTitle}>
              {role === 'CLIENT'
                ? "Mijoz sifatida ro'yxatdan o'tish uchun ism va familiyangizni kiriting"
                : "Sartarosh sifatida ro'yxatdan o'tish uchun ism va familiyangizni kiriting"}
            </Text>
          </View>

          <View style={styles.inputSection}>
            {/* Ism */}
            <Text style={styles.inputLabel}>Ismingiz</Text>
            <View
              style={[
                styles.fieldContainer,
                ismFocused && styles.inputFocused,
              ]}
            >
              <UserIcon size={18} color={COLOR_PRIMARY} />
              <TextInput
                style={styles.textInputField}
                value={ism}
                onChangeText={setIsm}
                placeholder="Bobur"
                placeholderTextColor={colors.textMuted}
                onFocus={() => setIsmFocused(true)}
                onBlur={() => setIsmFocused(false)}
                autoFocus
              />
            </View>

            {/* Familiya */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>
              Familiyangiz
            </Text>
            <View
              style={[
                styles.fieldContainer,
                familiyaFocused && styles.inputFocused,
              ]}
            >
              <UserIcon size={18} color={COLOR_PRIMARY} />
              <TextInput
                style={styles.textInputField}
                value={familiya}
                onChangeText={setFamiliya}
                placeholder="Aliyev"
                placeholderTextColor={colors.textMuted}
                onFocus={() => setFamiliyaFocused(true)}
                onBlur={() => setFamiliyaFocused(false)}
              />
            </View>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </View>

          <View style={styles.footerSection}>
            <Button
              title="Davom etish →"
              onPress={handleProceedToPhone}
              disabled={!ism.trim() || !familiya.trim()}
            />
          </View>
        </View>
      )}

      {/* STEP: Phone Input (Both Register & Login) */}
      {step === 'phone' && (
        <View style={styles.content}>
          <View style={styles.titlesArea}>
            <Text style={styles.mainTitle}>
              {mode === 'login' ? 'Tizimga kirish' : 'Telefon raqamingiz'}
            </Text>
            <Text style={styles.subTitle}>
              {mode === 'login'
                ? "Hisobingizga kirish uchun telefon raqamingizni kiriting"
                : `${ism}, hisobingizni tasdiqlash uchun telefon raqamingizni kiriting`}
            </Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Telefon raqami</Text>
            <View
              style={[
                styles.fieldContainer,
                isPhoneFocused && styles.inputFocused,
              ]}
            >
              <Phone size={18} color={COLOR_PRIMARY} />
              <TextInput
                style={styles.textInputField}
                value={getFormattedPhoneDisplay()}
                onChangeText={formatPhoneInput}
                keyboardType="phone-pad"
                placeholder="+998 90 123 45 67"
                placeholderTextColor={colors.textMuted}
                onFocus={() => setIsPhoneFocused(true)}
                onBlur={() => setIsPhoneFocused(false)}
                autoFocus
              />
            </View>
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </View>

          <View style={styles.footerSection}>
            <Button
              title="Kodni olish →"
              onPress={handleSendCode}
              loading={loading}
              disabled={rawPhone.length < 9}
            />
          </View>
        </View>
      )}

      {/* STEP: Code Verification with Seamless 6 Digits & Paste */}
      {step === 'code' && (
        <View style={styles.content}>
          <View style={styles.titlesArea}>
            <Text style={styles.mainTitle}>{t('smsVerifyTitle')}</Text>
            <Text style={styles.subTitle}>
              Biz {getMaskedPhoneDisplay()} raqamingizga 6 xonali tasdiqlash kodini yubordik…
            </Text>
          </View>

          {/* Unified 6 Digit OTP Cells */}
          <TouchableOpacity
            style={styles.otpContainer}
            activeOpacity={1}
            onPress={() => codeInputRef.current?.focus()}
          >
            {/* Hidden Input that captures all typed digits and pasted values */}
            <TextInput
              ref={codeInputRef}
              style={styles.hiddenInput}
              value={codeValue}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              caretHidden
            />

            {/* 6 Stylized Visual Boxes */}
            <View style={styles.codeCellsRow}>
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const char = codeValue[index] || '';
                const isCurrent = codeValue.length === index;
                const isFilled = Boolean(char);

                return (
                  <View
                    key={index}
                    style={[
                      styles.codeCell,
                      isCurrent && styles.codeCellActive,
                      isFilled && styles.codeCellFilled,
                    ]}
                  >
                    <Text style={styles.codeCellText}>
                      {char || (isCurrent ? '|' : '')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </TouchableOpacity>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {/* Countdown & Resend */}
          <View style={styles.timerSection}>
            <Text style={styles.timerText}>
              Qolgan vaqt: <Text style={styles.timerBold}>{formatCountdown(countdown)}</Text>
            </Text>

            <View style={styles.resendRow}>
              <Text style={styles.resendPrefix}>Kod kelmadimi: </Text>
              <TouchableOpacity
                onPress={handleSendCode}
                disabled={countdown > 0}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.resendLink,
                    countdown > 0 && styles.resendLinkDisabled,
                  ]}
                >
                  Qayta yuborish {countdown > 0 ? `(${formatCountdown(countdown)})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.footerSection}>
            <Button
              title="Tasdiqlash"
              onPress={() => handleVerifyCode()}
              loading={loading}
              disabled={codeValue.length !== 6}
            />
          </View>
        </View>
      )}

      {/* STEP: Geolocation & Salon Detection (For MASTER) */}
      {step === 'location' && (
        <View style={styles.content}>
          <View style={styles.titlesArea}>
            <Text style={styles.mainTitle}>Sartaroshxonangiz</Text>
            <Text style={styles.subTitle}>
              50 metr radiusdagi mavjud sartaroshxonaga qo'shiling yoki yangisini tanlang
            </Text>
          </View>

          {detectingLocation ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLOR_PRIMARY} />
              <Text style={styles.loadingLabel}>
                Joylashuvingiz aniqlanmoqda...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {nearbySalons.length > 0 ? (
                <>
                  <Text style={styles.nearbySectionLabel}>
                    Yaqin atrofdagi sartaroshxonalar (50m):
                  </Text>
                  {nearbySalons.map((salon) => {
                    const isSelected = selectedSalonId === salon.id;
                    return (
                      <TouchableOpacity
                        key={salon.id}
                        style={[
                          styles.salonOptionCard,
                          isSelected && styles.salonOptionActive,
                        ]}
                        onPress={() => {
                          setSelectedSalonId(salon.id);
                          setShowCreateNewModal(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.salonOptionLeft}>
                          <Store size={22} color={COLOR_PRIMARY} />
                          <View style={{ gap: 2 }}>
                            <Text style={styles.salonOptionName}>
                              {salon.name}
                            </Text>
                            <Text style={styles.salonOptionAddress}>
                              {salon.address}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.salonOptionRight}>
                          <Text style={styles.distanceBadge}>
                            {Math.round(salon.distanceMeters)} m
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              ) : (
                <View style={styles.noNearbyBox}>
                  <MapPin size={32} color={COLOR_PRIMARY} />
                  <Text style={styles.noNearbyTitle}>
                    Yaqin atrofda sartaroshxona topilmadi
                  </Text>
                  <Text style={styles.noNearbyDesc}>
                    Siz o'z sartaroshxonangizni yaratishingiz mumkin
                  </Text>
                </View>
              )}

              {/* Quick Area Buttons */}
              <View style={styles.quickLocationsRow}>
                <Text style={styles.quickLabel}>Tezkor tuman:</Text>
                {['Chilonzor', 'Yunusobod', 'Markaz'].map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={styles.quickLocBtn}
                    onPress={() => setNewSalonAddress(`Toshkent sh., ${loc}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickLocBtnText}>{loc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Create New Salon Toggle */}
              <TouchableOpacity
                style={[
                  styles.createNewBtn,
                  showCreateNewModal && styles.createNewBtnActive,
                ]}
                onPress={() => setShowCreateNewModal(!showCreateNewModal)}
                activeOpacity={0.8}
              >
                <Store size={18} color={COLOR_PRIMARY} />
                <Text style={styles.createNewBtnText}>
                  + Yangi sartaroshxona yaratish
                </Text>
              </TouchableOpacity>

              {showCreateNewModal && (
                <View style={styles.newSalonForm}>
                  <Text style={styles.inputLabel}>Sartaroshxona nomi</Text>
                  <View style={styles.fieldContainer}>
                    <TextInput
                      style={styles.textInputField}
                      value={newSalonName}
                      onChangeText={setNewSalonName}
                      placeholder={`${ism || 'Barbero'} Sartaroshxonasi`}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>
                    Manzil
                  </Text>
                  <View style={styles.fieldContainer}>
                    <TextInput
                      style={styles.textInputField}
                      value={newSalonAddress}
                      onChangeText={setNewSalonAddress}
                      placeholder="Toshkent sh., Chilonzor"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
              )}

              {/* Interactive Location Map Picker */}
              <SalonLocationMapPicker
                coords={coords}
                address={newSalonAddress}
                salonName={newSalonName || `${ism || 'Barbero'} Sartaroshxonasi`}
                onCoordsChange={(newCoords, addrHint) => {
                  setCoords(newCoords);
                  if (addrHint) {
                    setNewSalonAddress(addrHint);
                  }
                }}
                height={200}
              />
            </ScrollView>
          )}

          <View style={styles.footerSection}>
            {showCreateNewModal || nearbySalons.length === 0 ? (
              <Button
                title="Sartaroshxona yaratish va boshlash"
                onPress={handleCreateSalon}
                loading={loading}
              />
            ) : (
              <Button
                title="Qo'shilish va boshlash"
                onPress={handleJoinSalon}
                loading={loading}
                disabled={!selectedSalonId}
              />
            )}

            {/* Frictionless Solo Barber option */}
            <TouchableOpacity
              style={styles.skipSoloBtn}
              onPress={() => onSuccess()}
              activeOpacity={0.7}
            >
              <Text style={styles.skipSoloText}>
                ✂️ Mustaqil usta (Salonsiz to'g'ridan-to'g'ri boshlash) →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
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
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  headerBtnPlaceholder: {
    width: 40,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 6,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modeTabActive: {
    backgroundColor: colors.primaryLight,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modeTabTextActive: {
    color: COLOR_PRIMARY,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    justifyContent: 'space-between',
    paddingBottom: 32,
  },
  titlesArea: {
    gap: 6,
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  inputSection: {
    gap: 6,
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    height: 52,
    paddingHorizontal: 14,
    gap: 10,
  },
  inputFocused: {
    borderColor: COLOR_PRIMARY,
    backgroundColor: '#FFFDF9',
  },
  textInputField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    height: '100%',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
  },
  footerSection: {
    paddingTop: 16,
  },

  /* OTP Code Input */
  testCodeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLOR_PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  testCodeBannerText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  otpContainer: {
    position: 'relative',
    marginVertical: 18,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    zIndex: 10,
  },
  codeCellsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeCell: {
    width: 48,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCellActive: {
    borderColor: COLOR_PRIMARY,
    backgroundColor: '#FFFDF9',
    borderWidth: 2,
  },
  codeCellFilled: {
    borderColor: COLOR_PRIMARY,
    backgroundColor: '#FFFDF9',
  },
  codeCellText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  timerSection: {
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  timerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  timerBold: {
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendPrefix: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  resendLinkDisabled: {
    color: colors.textMuted,
  },

  /* Location / Salon Step */
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  nearbySectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  salonOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  salonOptionActive: {
    borderColor: COLOR_PRIMARY,
    backgroundColor: '#FFFDF9',
  },
  salonOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  salonOptionName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  salonOptionAddress: {
    fontSize: 12,
    color: colors.textMuted,
  },
  salonOptionRight: {},
  distanceBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLOR_PRIMARY,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  noNearbyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  noNearbyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  noNearbyDesc: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  quickLocationsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
    flexWrap: 'wrap',
  },
  quickLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  quickLocBtn: {
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  quickLocBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  createNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: 4,
  },
  createNewBtnActive: {
    borderColor: COLOR_PRIMARY,
  },
  createNewBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  newSalonForm: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 6,
    marginTop: 4,
  },
  skipSoloBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  skipSoloText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

