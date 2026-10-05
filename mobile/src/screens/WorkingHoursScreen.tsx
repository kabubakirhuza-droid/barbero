import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { ChevronLeft, Clock, Calendar, Check } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTranslation } from '../i18n/LanguageContext';
import { Button } from '../components/Button';
import { WorkingDay } from '../types';

interface WorkingHoursScreenProps {
  onBack: () => void;
}

export const WorkingHoursScreen: React.FC<WorkingHoursScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  const [days, setDays] = useState<WorkingDay[]>([
    { id: '1', dayOfWeek: 'Dushanba', dayIndex: 1, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
    { id: '2', dayOfWeek: 'Seshanba', dayIndex: 2, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
    { id: '3', dayOfWeek: 'Chorshanba', dayIndex: 3, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
    { id: '4', dayOfWeek: 'Payshanba', dayIndex: 4, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
    { id: '5', dayOfWeek: 'Juma', dayIndex: 5, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
    { id: '6', dayOfWeek: 'Shanba', dayIndex: 6, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
    { id: '7', dayOfWeek: 'Yakshanba', dayIndex: 7, isWorking: false, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
  ]);

  const toggleDay = (id?: string) => {
    if (!id) return;
    setDays((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isWorking: !d.isWorking } : d))
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('workingHoursTitle')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {days.map((day) => (
          <View key={day.id} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{day.dayOfWeek}</Text>
              {isEditing ? (
                <Switch
                  value={day.isWorking}
                  onValueChange={() => toggleDay(day.id)}
                  trackColor={{ false: colors.cardBorder, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              ) : (
                <View
                  style={[
                    styles.statusPill,
                    day.isWorking ? styles.statusWorking : styles.statusOff,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      day.isWorking ? styles.textWorking : styles.textOff,
                    ]}
                  >
                    {day.isWorking ? 'Ish kuni' : t('dayOffText')}
                  </Text>
                </View>
              )}
            </View>

            {day.isWorking ? (
              <View style={styles.timesContainer}>
                <View style={styles.timeRow}>
                  <Clock size={16} color={colors.primary} />
                  <Text style={styles.timeLabel}>{t('workTimeText')}:</Text>
                  <Text style={styles.timeValue}>
                    {day.startTime} – {day.endTime}
                  </Text>
                </View>

                <View style={styles.timeRow}>
                  <Calendar size={16} color={colors.textSecondary} />
                  <Text style={styles.timeLabel}>{t('lunchTimeText')}:</Text>
                  <Text style={styles.timeValue}>
                    {day.lunchStart} – {day.lunchEnd}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.dayOffNotice}>
                <Text style={styles.dayOffNoticeText}>{t('dayOffText')}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <Button
          title={isEditing ? 'Saqlash' : t('editScheduleBtn')}
          onPress={() => setIsEditing(!isEditing)}
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
    gap: 12,
    paddingBottom: 24,
  },
  dayCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 10,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusWorking: {
    backgroundColor: colors.primaryLight,
  },
  statusOff: {
    backgroundColor: colors.dangerLight,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textWorking: {
    color: colors.primary,
  },
  textOff: {
    color: colors.danger,
  },
  timesContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dayOffNotice: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  dayOffNoticeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  footer: {
    padding: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorderSubtle,
  },
});
