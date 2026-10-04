import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { ChevronLeft, TrendingUp, Calendar, Globe, Sparkles } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTranslation } from '../i18n/LanguageContext';
import { Button } from '../components/Button';
import { BarberoLogo } from '../components/BarberoLogo';
import { APP_NAME, APP_BASE_URL } from '../config/appConfig';

interface OnboardingScreenProps {
  onFinish: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    {
      id: 1,
      badge: 'JADVAL',
      title: t('onboardingSlide1Title'),
      desc: t('onboardingSlide1Desc'),
      icon: Calendar,
      mockupType: 'schedule',
    },
    {
      id: 2,
      badge: 'DAROMAD',
      title: t('onboardingSlide2Title'),
      desc: t('onboardingSlide2Desc'),
      icon: TrendingUp,
      mockupType: 'income',
    },
    {
      id: 3,
      badge: 'BOOKING LINK',
      title: t('onboardingSlide3Title'),
      desc: t('onboardingSlide3Desc'),
      icon: Globe,
      mockupType: 'booking',
    },
  ];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onFinish();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const renderMockup = (type: string) => {
    if (type === 'schedule') {
      return (
        <View style={styles.mockupCard}>
          <View style={styles.scheduleSlot}>
            <Text style={styles.slotTime}>09:30</Text>
            <View style={styles.slotClient}>
              <Text style={styles.slotClientName}>Mijoz 1</Text>
              <Text style={styles.slotService}>Soch olish</Text>
            </View>
            <Text style={styles.slotPrice}>50 000 uzs</Text>
          </View>
          <View style={styles.scheduleSlotActive}>
            <Text style={styles.slotTime}>10:00</Text>
            <View style={styles.slotClient}>
              <Text style={styles.slotClientName}>Mijoz 2</Text>
              <Text style={styles.slotService}>Soch + soqol</Text>
            </View>
            <Text style={styles.slotPrice}>70 000 uzs</Text>
          </View>
          <View style={styles.scheduleSlot}>
            <Text style={styles.slotTime}>11:00</Text>
            <View style={styles.slotClient}>
              <Text style={styles.slotClientName}>Mijoz 3</Text>
              <Text style={styles.slotService}>Kreativ soqol tekislash</Text>
            </View>
            <Text style={styles.slotPrice}>45 000 uzs</Text>
          </View>
        </View>
      );
    }

    if (type === 'income') {
      return (
        <View style={styles.mockupCard}>
          <View style={styles.incomeHeader}>
            <Text style={styles.incomeCardSub}>Oylik tushum</Text>
            <Text style={styles.incomeCardAmount}>5 450 000 uzs</Text>
            <View style={styles.incomeGrowthBadge}>
              <Text style={styles.growthText}>+100% o'sish</Text>
            </View>
          </View>
          <View style={styles.miniChart}>
            <View style={[styles.chartBar, { height: 35 }]} />
            <View style={[styles.chartBar, { height: 55 }]} />
            <View style={[styles.chartBar, { height: 40 }]} />
            <View style={[styles.chartBar, { height: 85, backgroundColor: colors.primary }]} />
            <View style={[styles.chartBar, { height: 60 }]} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.mockupCard}>
        <View style={styles.bioCard}>
          <Text style={styles.bioTitle}>{APP_BASE_URL}/b/abubakir</Text>
          <Text style={styles.bioSub}>Mijozlaringiz uchun shaxsiy onlayn yozilish havolasi</Text>
          <View style={styles.bioBadge}>
            <Sparkles size={14} color={colors.primary} />
            <Text style={styles.bioBadgeText}>24/7 onlayn qabul</Text>
          </View>
        </View>
      </View>
    );
  };

  const currentSlide = slides[currentIndex];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <BarberoLogo size="sm" showSubtitle={false} />
        <TouchableOpacity onPress={onFinish} activeOpacity={0.7}>
          <Text style={styles.skipText}>{t('skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Slide Content */}
      <View style={styles.slideContent}>
        {/* Mockup Illustration */}
        <View style={styles.illustrationArea}>
          {renderMockup(currentSlide.mockupType)}
        </View>

        {/* Text Area */}
        <View style={styles.textArea}>
          <Text style={styles.badgeText}>{currentSlide.badge}</Text>
          <Text style={styles.titleText}>{currentSlide.title}</Text>
          <Text style={styles.descText}>{currentSlide.desc}</Text>
        </View>
      </View>

      {/* Bottom Bar: Back + Dots + Next */}
      <View style={styles.bottomBar}>
        {/* Back button square */}
        {currentIndex > 0 ? (
          <TouchableOpacity style={styles.squareBackBtn} onPress={handleBack} activeOpacity={0.7}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.squareBackPlaceholder} />
        )}

        {/* Dots indicator */}
        <View style={styles.dotsContainer}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                currentIndex === i ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Wide Proceed Button */}
        <Button
          title={`${t('continue')} →`}
          onPress={handleNext}
          style={styles.nextBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 48 : 36,
    paddingBottom: 24,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
    fontStyle: 'italic',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationArea: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  mockupCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  incomeHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  incomeCardSub: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  incomeCardAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  incomeGrowthBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  miniChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 90,
    paddingTop: 10,
  },
  chartBar: {
    width: 28,
    backgroundColor: colors.cardBorder,
    borderRadius: 6,
  },
  scheduleSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorderSubtle,
  },
  scheduleSlotActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginVertical: 4,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  slotClient: {
    flex: 1,
    marginLeft: 12,
  },
  slotClientName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  slotService: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  slotPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  bioCard: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  bioTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  bioSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  bioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  bioBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  textArea: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  descText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  squareBackBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  squareBackPlaceholder: {
    width: 52,
    height: 52,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 22,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: colors.cardBorder,
  },
  nextBtn: {
    flex: 1,
  },
});
