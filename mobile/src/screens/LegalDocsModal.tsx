import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { ChevronLeft, FileText, Shield, Scale } from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { useTranslation } from '../i18n/LanguageContext';

interface LegalDocsModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'terms' | 'privacy' | 'offer';

export const LegalDocsModal: React.FC<LegalDocsModalProps> = ({ visible, onClose }) => {
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('terms');

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

        {/* Tab switcher */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'terms' && styles.tabBtnActive]}
            onPress={() => setActiveTab('terms')}
            activeOpacity={0.7}
          >
            <FileText size={16} color={activeTab === 'terms' ? COLOR_PRIMARY : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>
              {language === 'uz' ? 'Shartlar' : 'Условия'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'privacy' && styles.tabBtnActive]}
            onPress={() => setActiveTab('privacy')}
            activeOpacity={0.7}
          >
            <Shield size={16} color={activeTab === 'privacy' ? COLOR_PRIMARY : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
              {language === 'uz' ? 'Maxfiylik' : 'Конфиденциальность'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'offer' && styles.tabBtnActive]}
            onPress={() => setActiveTab('offer')}
            activeOpacity={0.7}
          >
            <Scale size={16} color={activeTab === 'offer' ? COLOR_PRIMARY : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'offer' && styles.tabTextActive]}>
              {language === 'uz' ? 'Oferta' : 'Оферта'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Body */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.docCard}>
            {activeTab === 'terms' && (
              <>
                <Text style={styles.docTitle}>
                  {language === 'uz'
                    ? 'BARBERO ilovasidan foydalanish shartlari'
                    : 'Условия использования сервиса BARBERO'}
                </Text>
                <Text style={styles.updateDate}>
                  {language === 'uz' ? 'Oxirgi yangilanish: 2026-yil 1-oktabr' : 'Последнее обновление: 1 октября 2026 г.'}
                </Text>

                <Text style={styles.sectionHeading}>1. Umumiy qoidalar</Text>
                <Text style={styles.paragraph}>
                  Ushbu Foydalanish shartlari «BARBERO» ilovasi va xizmatlaridan foydalanish qoidalarini belgilaydi. Ilovadan ro‘yxatdan o‘tish orqali siz mazkur shartlarga to‘liq rozilik bildirasiz.
                </Text>

                <Text style={styles.sectionHeading}>2. Usta va mijoz majburiyatlari</Text>
                <Text style={styles.paragraph}>
                  Xizmat ko‘rsatuvchi usta o‘z xizmatlari narxlari, ish jadvali va manzilining to‘g‘riligi uchun javobgardir. Mijoz esa qabul vaqtiga o‘z vaqtida kelish yoki yozuvni oldindan bekor qilish majburiyatini oladi.
                </Text>

                <Text style={styles.sectionHeading}>3. To‘lovlar va obuna</Text>
                <Text style={styles.paragraph}>
                  BARBERO Pro tariflari usta tomonidan tanlangan muddat uchun oldindan to‘lanadi. To‘lovlar Click, Payme va Uzum Bank orqali xavfsiz amalga oshiriladi.
                </Text>
              </>
            )}

            {activeTab === 'privacy' && (
              <>
                <Text style={styles.docTitle}>
                  {language === 'uz'
                    ? 'Maxfiylik siyosati va ma’lumotlar xavfsizligi'
                    : 'Политика конфиденциальности и защиты данных'}
                </Text>
                <Text style={styles.updateDate}>
                  {language === 'uz' ? 'Oxirgi yangilanish: 2026-yil 1-oktabr' : 'Последнее обновление: 1 октября 2026 г.'}
                </Text>

                <Text style={styles.sectionHeading}>1. To‘planadigan ma’lumotlar</Text>
                <Text style={styles.paragraph}>
                  Biz foydalanuvchilarning ismi, telefon raqami, manzil/lokatsiya ma’lumotlari va xizmatlar bo‘yicha yozuvlarni xizmat sifatini oshirish maqsadida saqlaymiz.
                </Text>

                <Text style={styles.sectionHeading}>2. Ma’lumotlarni himoya qilish</Text>
                <Text style={styles.paragraph}>
                  Barcha ma’lumotlar shifrlangan holda uzatiladi (SSL/TLS) va uchinchi shaxslarga tijoriy maqsadlarda sotilmaydi yoki berilmaydi.
                </Text>

                <Text style={styles.sectionHeading}>3. Foydalanuvchi huquqlari</Text>
                <Text style={styles.paragraph}>
                  Foydalanuvchi o‘z shaxsiy ma’lumotlarini ko‘rish, tahrirlash yoki hisobini butunlay o‘chirish huquqiga ega.
                </Text>
              </>
            )}

            {activeTab === 'offer' && (
              <>
                <Text style={styles.docTitle}>
                  {language === 'uz'
                    ? 'Ommaviy oferta shartnomasi'
                    : 'Публичная оферта на оказание услуг'}
                </Text>
                <Text style={styles.updateDate}>
                  {language === 'uz' ? 'Oxirgi yangilanish: 2026-yil 1-oktabr' : 'Последнее обновление: 1 октября 2026 г.'}
                </Text>

                <Text style={styles.sectionHeading}>1. Shartnoma predmeti</Text>
                <Text style={styles.paragraph}>
                  BARBERO platformasi ustalarga mijozlar bazasini boshqarish, jadval yuritish va onlayn bronlash tizimini taqdim etadi.
                </Text>

                <Text style={styles.sectionHeading}>2. Xizmat haqi va hisob-kitob</Text>
                <Text style={styles.paragraph}>
                  Xizmat ko‘rsatish narxlari ilovaning «Obunalar» bo‘limida ko‘rsatilgan tariflar asosida hisoblanadi.
                </Text>

                <Text style={styles.sectionHeading}>3. Fors-major holatlari</Text>
                <Text style={styles.paragraph}>
                  Tomonlar yengib bo‘lmas kuch holatlari yuzaga kelganda majburiyatlarni bajarmaslik javobgarligidan ozod etiladi.
                </Text>
              </>
            )}
          </View>
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
    borderBottomColor: colors.cardBorderSubtle,
    backgroundColor: colors.background,
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
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: colors.primaryLight,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: COLOR_PRIMARY,
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    gap: 10,
  },
  docTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 24,
  },
  updateDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 10,
  },
  paragraph: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
