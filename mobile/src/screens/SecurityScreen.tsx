import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { ChevronLeft, Lock, Fingerprint, Smartphone, LogOut } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTranslation } from '../i18n/LanguageContext';
import { confirmAction } from '../utils/alerts';

interface SecurityScreenProps {
  onBack: () => void;
}

export const SecurityScreen: React.FC<SecurityScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [pinEnabled, setPinEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [terminatedMessage, setTerminatedMessage] = useState<string | null>(null);

  const [devices, setDevices] = useState([
    {
      id: 'd1',
      name: 'iPhone 15 Pro',
      location: 'Toshkent, UZ',
      isCurrent: true,
      lastActive: 'Hozir faol',
    },
    {
      id: 'd2',
      name: 'MacBook Pro 14"',
      location: 'Toshkent, UZ',
      isCurrent: false,
      lastActive: '2 soat oldin',
    },
  ]);

  const handleTerminateDevice = (id: string, name: string) => {
    confirmAction(
      t('terminateDeviceBtn'),
      `Haqiqatan ham «${name}» qurilmasidan chiqmoqchimisiz?`,
      () => {
        setDevices((prev) => prev.filter((d) => d.id !== id));
        setTerminatedMessage(`«${name}» seansi yakunlandi`);
        setTimeout(() => setTerminatedMessage(null), 3500);
      },
      'Chiqish',
      'Bekor'
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('securityTitle')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Protection card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Lock size={20} color={colors.primary} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.title}>{t('pinCodeLabel')}</Text>
              <Text style={styles.subtitle}>Ilovaga kirishda 4 xonali kod</Text>
            </View>
            <Switch
              value={pinEnabled}
              onValueChange={setPinEnabled}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Fingerprint size={20} color={colors.primary} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.title}>{t('biometricsLabel')}</Text>
              <Text style={styles.subtitle}>Tezkor va xavfsiz autentifikatsiya</Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {terminatedMessage && (
          <View style={styles.toastBanner}>
            <Text style={styles.toastBannerText}>✓ {terminatedMessage}</Text>
          </View>
        )}

        {/* Active devices */}
        <Text style={styles.sectionHeader}>{t('activeDevicesLabel')}</Text>
        <View style={styles.card}>
          {devices.map((dev, idx) => (
            <React.Fragment key={dev.id}>
              {idx > 0 && <View style={styles.divider} />}
              <View style={styles.deviceRow}>
                <View style={styles.deviceIconWrap}>
                  <Smartphone size={20} color={dev.isCurrent ? colors.primary : colors.textSecondary} />
                </View>
                <View style={styles.deviceInfo}>
                  <View style={styles.deviceNameRow}>
                    <Text style={styles.deviceName}>{dev.name}</Text>
                    {dev.isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Ushbu qurilma</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.deviceMeta}>
                    {dev.location} • {dev.lastActive}
                  </Text>
                </View>

                {!dev.isCurrent && (
                  <TouchableOpacity
                    style={styles.terminateBtn}
                    onPress={() => handleTerminateDevice(dev.id, dev.name)}
                    activeOpacity={0.7}
                  >
                    <LogOut size={16} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
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
  placeholder: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorderSubtle,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
    marginLeft: 4,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  deviceIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: {
    flex: 1,
    gap: 3,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  currentBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  deviceMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  terminateBtn: {
    padding: 8,
  },
  toastBanner: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    alignItems: 'center',
  },
  toastBannerText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700',
  },
});
