import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Calendar, TrendingUp, Users, Clock, ChevronRight } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTranslation } from '../i18n/LanguageContext';
import { Skeleton } from '../components/Skeleton';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { AnalyticsData } from '../types';
import { api } from '../api/apiClient';

export const AnalitikaScreen: React.FC = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'hafta' | 'oy' | 'yil'>('oy');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  // Custom date range bottom sheet
  const [isRangeSheetVisible, setIsRangeSheetVisible] = useState(false);
  const [startDateInput, setStartDateInput] = useState('29 Sen 2026');
  const [endDateInput, setEndDateInput] = useState('4 Okt 2026');

  const fetchAnalytics = async (selectedPeriod: 'hafta' | 'oy' | 'yil') => {
    setLoading(true);
    try {
      const res = await api.getAnalytics(selectedPeriod);
      setData(res);
    } catch (e) {
      // offline fallback matching specifications
      setData({
        period: selectedPeriod,
        revenue: {
          total: 50000,
          formatted: '50 000 uzs',
          totalBookings: 1,
          avgPayment: 50000,
          growthRate: '+100%',
          title: selectedPeriod === 'hafta' ? 'Haftalik daromad' : selectedPeriod === 'yil' ? 'Yillik daromad' : 'Oylik daromad',
          subtitle: "1 ta yozuv, o'rtacha to'lov 50 000 uzs",
        },
        metrics: {
          clients: {
            total: 1,
            growth: '+1 yangi mijoz',
          },
          occupancy: {
            percent: '0%',
            ratio: '1/313 kun',
          },
        },
        dynamics: {
          title: 'Tushum dinamikasi',
          subtitle: "Oylar bo'yicha",
          badge: '+100%',
          chart: [
            { month: 'Yan', amount: 0, heightPercent: 12 },
            { month: 'Fev', amount: 0, heightPercent: 10 },
            { month: 'Mar', amount: 0, heightPercent: 15 },
            { month: 'Apr', amount: 0, heightPercent: 10 },
            { month: 'May', amount: 0, heightPercent: 14 },
            { month: 'Iyun', amount: 0, heightPercent: 18 },
            { month: 'Iyul', amount: 0, heightPercent: 25 },
            { month: 'Avg', amount: 25000, heightPercent: 45 },
            { month: 'Sen', amount: 50000, heightPercent: 88 },
            { month: 'Okt', amount: 0, heightPercent: 10 },
            { month: 'Noy', amount: 0, heightPercent: 10 },
            { month: 'Dek', amount: 0, heightPercent: 10 },
          ],
        },
      });
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Period Switcher + Custom Range Button */}
        <View style={styles.controlsRow}>
          <View style={styles.periodTabs}>
            {(['hafta', 'oy', 'yil'] as const).map((p) => {
              const isActive = period === p;
              const label =
                p === 'hafta' ? t('periodWeek') : p === 'oy' ? t('periodMonth') : t('periodYear');
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodTab, isActive && styles.periodTabActive]}
                  onPress={() => setPeriod(p)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.periodTabText, isActive && styles.periodTabTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Calendar Range Button */}
          <TouchableOpacity
            style={styles.rangeBtn}
            onPress={() => setIsRangeSheetVisible(true)}
            activeOpacity={0.7}
          >
            <Calendar size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loading || !data ? (
          /* Skeletons loader state */
          <View style={styles.skeletonsContainer}>
            <Skeleton height={140} borderRadius={20} />
            <View style={styles.metricsRow}>
              <Skeleton width="48%" height={100} borderRadius={18} />
              <Skeleton width="48%" height={100} borderRadius={18} />
            </View>
            <Skeleton height={220} borderRadius={20} />
          </View>
        ) : (
          <>
            {/* 2. Golden Card: Oylik daromad */}
            <View style={styles.goldenRevenueCard}>
              <View style={styles.goldenTopRow}>
                <Text style={styles.goldenTitle}>{data.revenue.title}</Text>
                <View style={styles.goldenBadge}>
                  <TrendingUp size={12} color="#FFFFFF" />
                  <Text style={styles.goldenBadgeText}>{data.revenue.growthRate}</Text>
                </View>
              </View>

              <Text style={styles.goldenAmount}>{data.revenue.formatted}</Text>
              <Text style={styles.goldenSubtitle}>{data.revenue.subtitle}</Text>
            </View>

            {/* 3. Two Metric Cards: Mijozlar & Bandlik */}
            <View style={styles.metricsRow}>
              {/* Card 1: Mijozlar */}
              <View style={styles.metricCard}>
                <View style={styles.metricCardTop}>
                  <Text style={styles.metricCardLabel}>{t('clientsMetricTitle')}</Text>
                  <View style={styles.metricIconWrap}>
                    <Users size={16} color={colors.primary} />
                  </View>
                </View>
                <Text style={styles.metricValue}>{data.metrics.clients.total}</Text>
                <View style={styles.metricGrowthBadge}>
                  <Text style={styles.metricGrowthText}>{data.metrics.clients.growth}</Text>
                </View>
              </View>

              {/* Card 2: Bandlik */}
              <View style={styles.metricCard}>
                <View style={styles.metricCardTop}>
                  <Text style={styles.metricCardLabel}>{t('occupancyMetricTitle')}</Text>
                  <View style={styles.metricIconWrap}>
                    <Clock size={16} color={colors.primary} />
                  </View>
                </View>
                <Text style={styles.metricValue}>{data.metrics.occupancy.percent}</Text>
                <View style={styles.metricRatioBadge}>
                  <Text style={styles.metricRatioText}>{data.metrics.occupancy.ratio}</Text>
                </View>
              </View>
            </View>

            {/* 4. Tushum dinamikasi with Bar Chart */}
            <View style={styles.dynamicsCard}>
              <View style={styles.dynamicsHeader}>
                <View>
                  <Text style={styles.dynamicsTitle}>{data.dynamics.title}</Text>
                  <Text style={styles.dynamicsSub}>{data.dynamics.subtitle}</Text>
                </View>
                <View style={styles.dynamicsGrowthBadge}>
                  <TrendingUp size={12} color="#059669" />
                  <Text style={styles.dynamicsGrowthText}>{data.dynamics.badge}</Text>
                </View>
              </View>

              {/* Animated Bar Chart */}
              <View style={styles.chartContainer}>
                {data.dynamics.chart.map((bar, i) => {
                  const isCurrent = bar.month === 'Sen';
                  return (
                    <View key={i} style={styles.chartCol}>
                      <View style={styles.chartBarWrapper}>
                        <View
                          style={[
                            styles.chartBar,
                            { height: `${bar.heightPercent}%` },
                            isCurrent && styles.chartBarActive,
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.chartMonthText,
                          isCurrent && styles.chartMonthTextActive,
                        ]}
                      >
                        {bar.month}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* 5. Bottom Sheet: Diapazon tanlash */}
      <BottomSheet
        visible={isRangeSheetVisible}
        onClose={() => setIsRangeSheetVisible(false)}
        title={t('selectRangeTitle')}
      >
        <View style={styles.rangeSheetContent}>
          <View style={styles.rangeInputGroup}>
            <Text style={styles.rangeLabel}>{t('startDateLabel')}</Text>
            <View style={styles.rangeInputBox}>
              <Calendar size={18} color={colors.primary} />
              <TextInput
                style={styles.rangeTextInput}
                value={startDateInput}
                onChangeText={setStartDateInput}
              />
            </View>
          </View>

          <View style={styles.rangeInputGroup}>
            <Text style={styles.rangeLabel}>{t('endDateLabel')}</Text>
            <View style={styles.rangeInputBox}>
              <Calendar size={18} color={colors.primary} />
              <TextInput
                style={styles.rangeTextInput}
                value={endDateInput}
                onChangeText={setEndDateInput}
              />
            </View>
          </View>

          <View style={styles.rangeActionsRow}>
            <Button
              title={t('cancelFilter')}
              variant="outline"
              onPress={() => setIsRangeSheetVisible(false)}
              style={{ flex: 1 }}
            />
            <Button
              title={t('applyFilter')}
              onPress={() => {
                setIsRangeSheetVisible(false);
                fetchAnalytics(period);
              }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </BottomSheet>
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
    padding: 16,
    paddingBottom: 110,
    gap: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  periodTabs: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 12,
  },
  periodTabActive: {
    backgroundColor: colors.primary,
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rangeBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonsContainer: {
    gap: 16,
  },
  goldenRevenueCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  goldenTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goldenTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  goldenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  goldenBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  goldenAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  goldenSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  metricCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metricGrowthBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  metricGrowthText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  metricRatioBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  metricRatioText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dynamicsCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  dynamicsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dynamicsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dynamicsSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dynamicsGrowthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dynamicsGrowthText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarWrapper: {
    height: 105,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  chartBar: {
    width: 14,
    backgroundColor: '#EBE5DC',
    borderRadius: 4,
  },
  chartBarActive: {
    backgroundColor: colors.primary,
    width: 16,
  },
  chartMonthText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 8,
    fontWeight: '600',
  },
  chartMonthTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  rangeSheetContent: {
    gap: 16,
  },
  rangeInputGroup: {
    gap: 6,
  },
  rangeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rangeInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
    height: 48,
  },
  rangeTextInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rangeActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
});
