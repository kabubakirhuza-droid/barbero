import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { Scissors, User, ChevronRight } from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { BarberoLogo } from '../components/BarberoLogo';
import { UserRole } from '../types';

interface RoleSelectionScreenProps {
  onRoleSelected: (role: UserRole) => void;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({
  onRoleSelected,
}) => {
  const clientScale = useRef(new Animated.Value(1)).current;
  const masterScale = useRef(new Animated.Value(1)).current;

  const animatePress = (scaleAnim: Animated.Value, callback: () => void) => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 30,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
      }),
    ]).start(() => callback());
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo & Tagline */}
        <View style={styles.logoArea}>
          <BarberoLogo size="lg" showSubtitle={true} />
          <Text style={styles.tagline}>
            Sartaroshxona va go'zallik ustalari uchun
          </Text>
        </View>

        {/* Title */}
        <View style={styles.titleArea}>
          <Text style={styles.title}>
            Siz kim sifatida{'\n'}ro'yxatdan o'tasiz?
          </Text>
          <Text style={styles.subtitle}>
            O'zingizga mos rolni tanlang — keyinchalik ham profil orqali boshqarish mumkin
          </Text>
        </View>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          {/* CLIENT Card */}
          <Animated.View
            style={[
              styles.roleCardWrapper,
              { transform: [{ scale: clientScale }] },
            ]}
          >
            <TouchableOpacity
              style={[styles.roleCard, styles.clientCard]}
              onPress={() =>
                animatePress(clientScale, () => onRoleSelected('CLIENT'))
              }
              activeOpacity={0.88}
            >
              <View style={[styles.iconCircle, styles.clientIconCircle]}>
                <User size={28} color={COLOR_PRIMARY} strokeWidth={2.2} />
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.clientTitle}>Men mijozman</Text>
                  <View style={styles.clientChip}>
                    <Text style={styles.clientChipText}>Mijoz</Text>
                  </View>
                </View>

                <Text style={styles.clientDesc}>
                  Ustalardan vaqt band qilaman, navbat olaman
                </Text>
              </View>

              <ChevronRight size={20} color={COLOR_PRIMARY} />
            </TouchableOpacity>
          </Animated.View>

          {/* MASTER Card */}
          <Animated.View
            style={[
              styles.roleCardWrapper,
              { transform: [{ scale: masterScale }] },
            ]}
          >
            <TouchableOpacity
              style={[styles.roleCard, styles.masterCard]}
              onPress={() =>
                animatePress(masterScale, () => onRoleSelected('MASTER'))
              }
              activeOpacity={0.88}
            >
              <View style={[styles.iconCircle, styles.masterIconCircle]}>
                <Scissors size={28} color="#FFFFFF" strokeWidth={2.2} />
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.masterTitle}>Men ustaman</Text>
                  <View style={styles.masterChip}>
                    <Text style={styles.masterChipText}>Usta / Barber</Text>
                  </View>
                </View>

                <Text style={styles.masterDesc}>
                  Sartaroshxona ochaman, jadval boshqaraman
                </Text>
              </View>

              <ChevronRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Footer */}
        <View style={styles.footerArea}>
          <Text style={styles.footerNote}>
            Davom etish orqali siz{' '}
            <Text style={styles.footerLink}>Foydalanish shartlari</Text> va{' '}
            <Text style={styles.footerLink}>Maxfiylik siyosati</Text>ga rozilik
            bildirasiz
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 32,
    alignItems: 'center',
    minHeight: '100%',
    justifyContent: 'space-between',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tagline: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  titleArea: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  cardsContainer: {
    width: '100%',
    maxWidth: 440,
    gap: 14,
    marginVertical: 8,
  },
  roleCardWrapper: {
    width: '100%',
  },
  roleCard: {
    width: '100%',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
  },
  clientCard: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  masterCard: {
    backgroundColor: '#1E1B18',
    borderColor: COLOR_PRIMARY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientIconCircle: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  masterIconCircle: {
    backgroundColor: COLOR_PRIMARY,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  clientTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  masterTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  clientDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  masterDesc: {
    fontSize: 12,
    color: '#D8D1C7',
    lineHeight: 17,
  },
  clientChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  clientChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  masterChip: {
    backgroundColor: 'rgba(166, 124, 46, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLOR_PRIMARY,
  },
  masterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5C07B',
  },
  footerArea: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  footerNote: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: COLOR_PRIMARY,
    fontWeight: '700',
  },
});
