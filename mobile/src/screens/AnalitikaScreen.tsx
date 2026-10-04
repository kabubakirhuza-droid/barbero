import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Calendar, TrendingUp, Users, Clock, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTranslation } from '../i18n/LanguageContext';
import { Skeleton } from '../components/Skeleton';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { AnalyticsData } from '../types';
import { api } from '../api/apiClient';

export const AnalitikaScreen: React.FC = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'hafta' | 'oy' | 'yil' | 'custom'>('oy');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const defaultTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Custom date range bottom sheet
  const [isRangeSheetVisible, setIsRangeSheetVisible] = useState(false);
  const [startDateInput, setStartDateInput] = useState(defaultFrom);
  const [endDateInput, setEndDateInput] = useState(defaultTo);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(
    async (
      selectedPeriod: 'hafta' | 'oy' | 'yil' | 'custom',
      customFrom?: string,
      customTo?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getAnalytics(
          selectedPeriod === 'custom' ? 'oy' : selectedPeriod,
          customFrom,
          customTo
        );
        setData(res);
      } catch (err: any) {
        console.warn('[AnalitikaScreen] Error fetching analytics:', err.message);
        if (!data) {
          setError(err.message || 'Maʼlumotlarni yuklab bo‘lmadi');
        }
      } finally {
        setLoading(false);
      }
    },
    [data]
  );

  useEffect(() => {
    if (period !== 'custom') {
      fetchAnalytics(period);
    }
  }, [period]);

  const handleApplyCustomRange = () => {
    setRangeError(null);
    const from = startDateInput.trim();
    const to = endDateInput.trim();

    if (!from || !to) {
      setRangeError("Sanalar to'liq kiritilishi kerak (YYYY-MM-DD)");
      return;
    }

    if (from > to) {
      setRangeError(t('rangeErrorMsg'));
      return;
    }

    setIsRangeSheetVisible(false);
    setPeriod('custom');
    fetchAnalytics('custom', from, to);
  };

  const isEmpty = data && data.revenue.totalBookings === 0;

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
            style={[styles.rangeBtn, period === 'custom' && styles.rangeBtnActive]}
            onPress={() => setIsRangeSheetVisible(true)}
            activeOpacity={0.7}
          >
            <Calendar size={18} color={period === 'custom' ? '#FFFFFF' : colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Loading State: Skeletons */}
        {loading && !data && (
          <View style={styles.skeletonsContainer}>
            <Skeleton height={140} borderRadius={20} />
            <View style={styles.metricsRow}>
              <Skeleton width="48%" height={110} borderRadius={18} />
              <Skeleton width="48%" height={110} borderRadius={18} />
            </View>
            <Skeleton height={230} borderRadius={20} />
          </View>
        )}

        {/* Error State with Retry */}
        {error && !data && !loading && (
          <View style={styles.errorContainer}>
            <AlertCircle size={36} color={colors.danger} />
            <Text style={styles.errorTitle}>{t('somethingWentWrong')}</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <Button
              title={t('retryBtn')}
              onPress={() => fetchAnalytics(period)}
              variant="outline"
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {/* Loaded Data Content */}
        {data && (
          <>
            {/* 2. Golden Card: Daromad */}
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

            {/* 4. Empty state indicator if 0 bookings in period */}
            {isEmpty && (
              <View style={styles.emptyCard}>
                <BarChart2 size={28} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>{t('noDataYet')}</Text>
                <Text style={styles.emptySubtitle}>
                  Ushbu davrda hali tasdiqlangan yozuvlar mavjud emas
                </Text>
              </View>
            )}

            {/* 5. Tushum dinamikasi with dynamic Bar Chart */}
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chartContainer}>
                  {data.dynamics.chart.map((bar, i) => {
                    const isCurrent = !!bar.isCurrent;
                    const label = bar.label || bar.month || '';
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
                          {label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
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
          {rangeError && (
            <View style={styles.rangeErrorBox}>
              <AlertCircle size={16} color={colors.danger} />
              <Text style={styles.rangeErrorText}>{rangeError}</Text>
            </View>
          )}

          <View style={styles.rangeInputGroup}>
            <Text style={styles.rangeLabel}>{t('startDateLabel')} (YYYY-MM-DD)</Text>
            <View style={styles.rangeInputBox}>
              <Calendar size={18} color={colors.primary} />
              <TextInput
                style={styles.rangeTextInput}
                value={startDateInput}
                onChangeText={setStartDateInput}
                placeholder="2026-09-01"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.rangeInputGroup}>
            <Text style={styles.rangeLabel}>{t('endDateLabel')} (YYYY-MM-DD)</Text>
            <View style={styles.rangeInputBox}>
              <Calendar size={18} color={colors.primary} />
              <TextInput
                style={styles.rangeTextInput}
                value={endDateInput}
                onChangeText={setEndDateInput}
                placeholder="2026-09-30"
                placeholderTextColor={colors.textMuted}
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
              onPress={handleApplyCustomRange}
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
  rangeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  skeletonsContainer: {
    gap: 16,
  },
  errorContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
    marginVertical: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  errorSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
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
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
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
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
    minWidth: '100%',
    justifyContent: 'space-around',
    gap: 8,
  },
  chartCol: {
    alignItems: 'center',
    minWidth: 28,
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
  rangeErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FCEBEB',
    padding: 10,
    borderRadius: 10,
  },
  rangeErrorText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
    flex: 1,
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
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },
  rangeActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
});
