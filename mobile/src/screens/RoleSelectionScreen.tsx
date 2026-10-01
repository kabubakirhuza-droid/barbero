import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { Scissors, User } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { BarberoLogo } from '../components/BarberoLogo';
import { UserRole } from '../types';

interface RoleSelectionScreenProps {
  onRoleSelected: (role: UserRole) => void;
}

const { width } = Dimensions.get('window');

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ onRoleSelected }) => {
  const clientScale = useRef(new Animated.Value(1)).current;
  const masterScale = useRef(new Animated.Value(1)).current;

  const animatePress = (scaleAnim: Animated.Value, callback: () => void) => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 30 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start(() => callback());
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoArea}>
        <BarberoLogo size="lg" showSubtitle={true} />
        <Text style={styles.tagline}>Sartaroshxona va go'zallik ustalari uchun</Text>
      </View>

      {/* Title */}
      <View style={styles.titleArea}>
        <Text style={styles.title}>Siz kim sifatida{'\n'}ro'yxatdan o'tasiz?</Text>
        <Text style={styles.subtitle}>
          Rolni tanlang — keyinchalik o'zgartirib bo'lmaydi
        </Text>
      </View>

      {/* Role Cards */}
      <View style={styles.cardsContainer}>
        {/* CLIENT Card */}
        <Animated.View style={[styles.roleCardWrapper, { transform: [{ scale: clientScale }] }]}>
          <TouchableOpacity
            style={[styles.roleCard, styles.clientCard]}
            onPress={() => animatePress(clientScale, () => onRoleSelected('CLIENT'))}
            activeOpacity={0.9}
          >
            <View style={[styles.iconCircle, styles.clientIconCircle]}>
              <User size={36} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.roleEmoji}>👤</Text>
            <Text style={styles.roleTitle}>Men mijozman</Text>
            <Text style={styles.roleDesc}>
              Ustalardan vaqt band qilaman, navbat olaman
            </Text>
            <View style={[styles.roleChip, styles.clientChip]}>
              <Text style={[styles.roleChipText, { color: colors.primary }]}>Mijoz</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* MASTER Card */}
        <Animated.View style={[styles.roleCardWrapper, { transform: [{ scale: masterScale }] }]}>
          <TouchableOpacity
            style={[styles.roleCard, styles.masterCard]}
            onPress={() => animatePress(masterScale, () => onRoleSelected('MASTER'))}
            activeOpacity={0.9}
          >
            <View style={[styles.iconCircle, styles.masterIconCircle]}>
              <Scissors size={36} color="#fff" strokeWidth={2} />
            </View>
            <Text style={styles.roleEmoji}>✂️</Text>
            <Text style={[styles.roleTitle, { color: '#fff' }]}>Men ustaman</Text>
            <Text style={[styles.roleDesc, { color: 'rgba(255,255,255,0.85)' }]}>
              Sartaroshxona ochaman, jadval boshqaraman
            </Text>
            <View style={[styles.roleChip, styles.masterChip]}>
              <Text style={[styles.roleChipText, { color: '#fff' }]}>Usta / Barber</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Footer */}
      <Text style={styles.footerNote}>
        Davom etish orqali siz{' '}
        <Text style={styles.footerLink}>Foydalanish shartlari</Text>
        {' '}va{' '}
        <Text style={styles.footerLink}>Maxfiylik siyosati</Text>
        {'\n'}ga rozilik bildirasiz
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 32,
    alignItems: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
  },
  tagline: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  titleArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cardsContainer: {
    width: '100%',
    gap: 14,
    flex: 1,
    justifyContent: 'center',
  },
  roleCardWrapper: {
    width: '100%',
  },
  roleCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
  },
  clientCard: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  masterCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  clientIconCircle: {
    backgroundColor: colors.primaryLight,
  },
  masterIconCircle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  roleEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  roleDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  roleChip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  clientChip: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  masterChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerNote: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
