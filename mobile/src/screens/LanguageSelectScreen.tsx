import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTranslation } from '../i18n/LanguageContext';
import { Language } from '../types';

interface LanguageSelectScreenProps {
  onBack: () => void;
}

export const LanguageSelectScreen: React.FC<LanguageSelectScreenProps> = ({ onBack }) => {
  const { language, setLanguage, t } = useTranslation();

  const options: { id: Language; label: string; flag: string }[] = [
    { id: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
    { id: 'ru', label: 'Русский', flag: '🇷🇺' },
  ];

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('appLanguageTitle')}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          {options.map((opt, index) => {
            const isSelected = language === opt.id;
            return (
              <React.Fragment key={opt.id}>
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.langRow}
                  onPress={() => handleSelect(opt.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.langLeft}>
                    <Text style={styles.flagText}>{opt.flag}</Text>
                    <Text style={[styles.langLabel, isSelected && styles.langLabelActive]}>
                      {opt.label}
                    </Text>
                  </View>

                  {/* Golden Radio Button */}
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>
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
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagText: {
    fontSize: 24,
  },
  langLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  langLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorderSubtle,
  },
});
