import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { ChevronLeft, Check } from 'lucide-react-native';
import { colors, badgeOptions } from '../theme/colors';
import { useTranslation } from '../i18n/LanguageContext';
import { Button } from '../components/Button';
import { api } from '../api/apiClient';

interface AddServiceModalProps {
  onClose: () => void;
  onServiceCreated: () => void;
}

export const AddServiceModal: React.FC<AddServiceModalProps> = ({ onClose, onServiceCreated }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [priceStr, setPriceStr] = useState('50000');
  const [duration, setDuration] = useState(30);
  const [selectedColor, setSelectedColor] = useState(colors.badgeGold);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  // Quick chips
  const nameChips = ['Soch olish', 'Soch + soqol', 'Bolalar sochi', 'Soqol olish'];
  const priceChips = [50000, 30000, 70000];
  const durationChips = [15, 20, 30, 45];

  const formatPriceWithSpaces = (raw: string) => {
    const num = parseInt(raw.replace(/\D/g, '') || '0', 10);
    return num.toLocaleString();
  };

  const handlePriceInput = (text: string) => {
    const clean = text.replace(/\D/g, '');
    setPriceStr(clean);
  };

  const isFormValid = name.trim().length > 0 && parseInt(priceStr || '0', 10) > 0;

  const handleSave = async () => {
    if (!isFormValid) return;
    setLoading(true);

    try {
      await api.createService({
        name: name.trim(),
        price: parseInt(priceStr, 10),
        duration,
        badgeColor: selectedColor,
        isActive,
      });
      onServiceCreated();
      onClose();
    } catch (err) {
      // offline/fallback
      onServiceCreated();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('addServiceTitle')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Xizmat nomi */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>{t('serviceNameLabel')}</Text>
          <View style={styles.textInputBox}>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder={t('serviceNamePlaceholder')}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Quick chips for Name */}
          <View style={styles.chipsRow}>
            {nameChips.map((chip) => (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, name === chip && styles.chipActive]}
                onPress={() => setName(chip)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, name === chip && styles.chipTextActive]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. Narxi */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>{t('servicePriceLabel')}</Text>
          <View style={styles.priceInputBox}>
            <TextInput
              style={styles.priceTextInput}
              value={formatPriceWithSpaces(priceStr)}
              onChangeText={handlePriceInput}
              keyboardType="number-pad"
            />
            <Text style={styles.priceSuffix}>uzs</Text>
          </View>

          {/* Quick chips for Price */}
          <View style={styles.chipsRow}>
            {priceChips.map((chip) => (
              <TouchableOpacity
                key={chip}
                style={[
                  styles.chip,
                  parseInt(priceStr, 10) === chip && styles.chipActive,
                ]}
                onPress={() => setPriceStr(chip.toString())}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    parseInt(priceStr, 10) === chip && styles.chipTextActive,
                  ]}
                >
                  {chip.toLocaleString()} uzs
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. Davomiyligi */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>{t('serviceDurationLabel')}</Text>
          <View style={styles.chipsRow}>
            {durationChips.map((chip) => (
              <TouchableOpacity
                key={chip}
                style={[styles.durationChip, duration === chip && styles.chipActive]}
                onPress={() => setDuration(chip)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, duration === chip && styles.chipTextActive]}>
                  {chip} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. Badge rangi */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>{t('badgeColorLabel')}</Text>
          <View style={styles.badgeColorsRow}>
            {badgeOptions.map((opt) => {
              const isSelected = selectedColor === opt.color;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.badgeCircle, { backgroundColor: opt.color }]}
                  onPress={() => setSelectedColor(opt.color)}
                  activeOpacity={0.8}
                >
                  {isSelected && <Check size={18} color="#FFFFFF" strokeWidth={3} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. Faol deb belgilash */}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('setActiveLabel')}</Text>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: colors.cardBorder, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </ScrollView>

      {/* 6. Saqlash Button */}
      <View style={styles.footer}>
        <Button
          title={t('saveBtn')}
          onPress={handleSave}
          disabled={!isFormValid}
          loading={loading}
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
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    gap: 22,
    paddingBottom: 40,
  },
  fieldSection: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  textInputBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    height: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  priceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    height: 52,
    paddingHorizontal: 16,
  },
  priceTextInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  priceSuffix: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  chip: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  durationChip: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  badgeColorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  badgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  footer: {
    padding: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorderSubtle,
  },
});
