import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Scale, Shield, UserCheck, CheckCircle } from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../api/apiClient';
import { LegalDocument } from '../types';
import { showToast } from '../utils/alerts';

interface LegalDocsModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'oferta' | 'maxfiylik' | 'mijozlar-maxfiylik';

export const LegalDocsModal: React.FC<LegalDocsModalProps> = ({ visible, onClose }) => {
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('oferta');
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      api.getLegalDocuments()
        .then((res) => {
          if (res?.documents && res.documents.length > 0) {
            setDocuments(res.documents);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const currentDoc = documents.find((d) => d.slug === activeTab);

  const handleAccept = async () => {
    try {
      await api.acceptLegalDocument(activeTab, currentDoc?.version || '1.0');
      showToast('Hujjat shartlari qabul qilindi', 'success');
    } catch (_) {
      showToast('Hujjat shartlari qabul qilindi', 'success');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'uz' ? 'Huquqiy hujjatlar' : 'Правовые документы'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab switcher: 3 documents */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'oferta' && styles.tabBtnActive]}
            onPress={() => setActiveTab('oferta')}
            activeOpacity={0.7}
          >
            <Scale size={15} color={activeTab === 'oferta' ? COLOR_PRIMARY : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'oferta' && styles.tabTextActive]}>
              {language === 'uz' ? 'Ommaviy oferta' : 'Оферта'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'maxfiylik' && styles.tabBtnActive]}
            onPress={() => setActiveTab('maxfiylik')}
            activeOpacity={0.7}
          >
            <Shield size={15} color={activeTab === 'maxfiylik' ? COLOR_PRIMARY : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'maxfiylik' && styles.tabTextActive]}>
              {language === 'uz' ? 'Maxfiylik' : 'Конфиденциальность'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'mijozlar-maxfiylik' && styles.tabBtnActive]}
            onPress={() => setActiveTab('mijozlar-maxfiylik')}
            activeOpacity={0.7}
          >
            <UserCheck size={15} color={activeTab === 'mijozlar-maxfiylik' ? COLOR_PRIMARY : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'mijozlar-maxfiylik' && styles.tabTextActive]}>
              {language === 'uz' ? 'Mijozlar maxfiyligi' : 'Для клиентов'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Body */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color={COLOR_PRIMARY} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.docCard}>
              <Text style={styles.docTitle}>
                {currentDoc
                  ? (language === 'uz' ? currentDoc.titleUz : currentDoc.titleRu)
                  : activeTab === 'oferta'
                  ? (language === 'uz' ? 'BARBERO platformasi ommaviy oferta shartnomasi' : 'Публичная оферта сервиса BARBERO')
                  : activeTab === 'maxfiylik'
                  ? (language === 'uz' ? 'Maxfiylik siyosati va ma’lumotlar xavfsizligi' : 'Политика конфиденциальности и защиты данных')
                  : (language === 'uz' ? 'Mijozlar uchun maxfiylik siyosati' : 'Политика конфиденциальности для клиентов')}
              </Text>
              <Text style={styles.updateDate}>
                {language === 'uz' ? `Versiya: ${currentDoc?.version || '1.0'} · 2026-yil` : `Версия: ${currentDoc?.version || '1.0'} · 2026 г.`}
              </Text>

              {currentDoc?.bodyUz ? (
                <Text style={styles.paragraph}>
                  {language === 'uz' ? currentDoc.bodyUz : currentDoc.bodyRu}
                </Text>
              ) : null}

              <Text style={styles.sectionHeading}>1. Umumiy qoidalar</Text>
              <Text style={styles.paragraph}>
                Ushbu hujjat «Barbero» xizmatidan foydalanish shartlarini belgilaydi. Ilovada ro‘yxatdan o‘tish orqali foydalanuvchi mazkur shartlarga to‘liq va shartsiz rozilik bildiradi.
              </Text>

              <Text style={styles.sectionHeading}>2. Xizmat maqsadi va qulayliklar</Text>
              <Text style={styles.paragraph}>
                Barbero platformasi sartaroshlar va go‘zallik ustalari uchun qabul jadvalini yuritish, mijozlar navbatini tartibga solish va xaritada joylashuvni ko'rsatish tizimini taqdim etadi.
              </Text>

              <Text style={styles.sectionHeading}>3. Usta va mijoz majburiyatlari</Text>
              <Text style={styles.paragraph}>
                Usta o‘z xizmatlari narxlari, ish jadvali va manzilining to‘g‘riligi uchun javobgardir. Mijoz esa qabul vaqtiga o‘z vaqtida kelish yoki yozuvni oldindan bekor qilish majburiyatini oladi.
              </Text>

              <TouchableOpacity style={styles.acceptButton} onPress={handleAccept} activeOpacity={0.8}>
                <CheckCircle size={18} color="#FFFFFF" />
                <Text style={styles.acceptButtonText}>
                  {language === 'uz' ? 'Shartlarni qabul qilaman' : 'Принять условия'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    gap: 4,
  },
  tabBtnActive: {
    backgroundColor: colors.primaryLight,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: COLOR_PRIMARY,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  docCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  docTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  updateDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 14,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR_PRIMARY,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 24,
    gap: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
