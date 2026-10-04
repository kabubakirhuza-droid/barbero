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
import { ChevronLeft, Scale, Shield, UserCheck } from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { useTranslation } from '../i18n/LanguageContext';

interface LegalDocsModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'offer' | 'privacy' | 'client_privacy';

export const LegalDocsModal: React.FC<LegalDocsModalProps> = ({ visible, onClose }) => {
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('offer');

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
            style={[styles.tabBtn, activeTab === 'offer' && styles.tabBtnActive]}
            onPress={() => setActiveTab('offer')}
            activeOpacity={0.7}
          >
            <Scale size={15} color={activeTab === 'offer' ? COLOR_PRIMARY : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'offer' && styles.tabTextActive]}>
              {language === 'uz' ? 'Ommaviy oferta' : 'Оферта'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'privacy' && styles.tabBtnActive]}
            onPress={() => setActiveTab('privacy')}
            activeOpacity={0.7}
          >
            <Shield size={15} color={activeTab === 'privacy' ? COLOR_PRIMARY : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
              {language === 'uz' ? 'Maxfiylik' : 'Конфиденциальность'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'client_privacy' && styles.tabBtnActive]}
            onPress={() => setActiveTab('client_privacy')}
            activeOpacity={0.7}
          >
            <UserCheck size={15} color={activeTab === 'client_privacy' ? COLOR_PRIMARY : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'client_privacy' && styles.tabTextActive]}>
              {language === 'uz' ? 'Mijozlar maxfiyligi' : 'Для клиентов'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Body */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.docCard}>
            {activeTab === 'offer' && (
              <>
                <Text style={styles.docTitle}>
                  {language === 'uz'
                    ? 'BARBERO platformasi ommaviy oferta shartnomasi'
                    : 'Публичная оферта сервиса BARBERO'}
                </Text>
                <Text style={styles.updateDate}>
                  {language === 'uz' ? 'Oxirgi yangilanish: 2026-yil 1-oktabr' : 'Последнее обновление: 1 октября 2026 г.'}
                </Text>

                <Text style={styles.sectionHeading}>1. Umumiy qoidalar</Text>
                <Text style={styles.paragraph}>
                  Ushbu Ommaviy oferta «BarberPlan» xizmatidan foydalanish shartlarini belgilaydi. Ilovada ro‘yxatdan o‘tish orqali foydalanuvchi mazkur shartlarga to‘liq va shartsiz rozilik bildiradi.
                </Text>

                <Text style={styles.sectionHeading}>2. Xizmat maqsadi va bepul foydalanish</Text>
                <Text style={styles.paragraph}>
                  BarberPlan platformasi sartaroshlar va go‘zallik ustalari uchun qabul jadvalini yuritish, mijozlar navbatini tartibga solish va onlayn bronlash tizimini taqdim etadi. Hozirgi bosqichda tizimning barcha imkoniyatlari ustalarga bepul taqdim etiladi.
                </Text>

                <Text style={styles.sectionHeading}>3. Usta va mijoz majburiyatlari</Text>
                <Text style={styles.paragraph}>
                  Usta o‘z xizmatlari narxlari, ish jadvali va manzilining to‘g‘riligi uchun javobgardir. Mijoz esa qabul vaqtiga o‘z vaqtida kelish yoki yozuvni oldindan bekor qilish majburiyatini oladi.
                </Text>

                <Text style={styles.sectionHeading}>4. Tomonlarning javobgarligi</Text>
                <Text style={styles.paragraph}>
                  Platforma xizmat ko‘rsatuvchi usta va mijoz o‘rtasidagi to‘g‘ridan-to‘g‘ri shaxsiy kelishuvlar, xizmat ko‘rsatish sifati yoki tomonlarning kelishuvga rioya qilmasligi uchun moddiy javobgar bo‘lmaydi.
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
                  Biz ustalarning ismi, telefon raqami, xizmatlar ro‘yxati, ish joyi geolokatsiyasi va qabul jadvallarini faqat xizmatni ko‘rsatish maqsadida saqlaymiz.
                </Text>

                <Text style={styles.sectionHeading}>2. Ma’lumotlarni saqlash va himoyalash</Text>
                <Text style={styles.paragraph}>
                  Barcha ma’lumotlar shifrlangan protokollar (HTTPS/TLS) orqali uzatiladi va uchinchi shaxslarga tijoriy maqsadlarda sotilmaydi yoki berilmaydi.
                </Text>

                <Text style={styles.sectionHeading}>3. Foydalanuvchi huquqlari</Text>
                <Text style={styles.paragraph}>
                  Foydalanuvchi istalgan vaqtda o‘z hisobini tozalash, ma’lumotlarini tahrirlash yoki o‘chirish huquqiga ega.
                </Text>
              </>
            )}

            {activeTab === 'client_privacy' && (
              <>
                <Text style={styles.docTitle}>
                  {language === 'uz'
                    ? 'Mijozlar uchun maxfiylik siyosati'
                    : 'Политика конфиденциальности для клиентов'}
                </Text>
                <Text style={styles.updateDate}>
                  {language === 'uz' ? 'Oxirgi yangilanish: 2026-yil 1-oktabr' : 'Последнее обновление: 1 октября 2026 г.'}
                </Text>

                <Text style={styles.sectionHeading}>1. Mijoz ma’lumotlaridan foydalanish</Text>
                <Text style={styles.paragraph}>
                  Onlayn bron qilish orqali yozilgan mijozning ismi va telefon raqami faqat tanlangan ustaga qabul vaqtini tasdiqlash va eslatma yuborish uchun taqdim etiladi.
                </Text>

                <Text style={styles.sectionHeading}>2. Bildirishnomalar va xavfsizlik</Text>
                <Text style={styles.paragraph}>
                  Mijozga qabul holati va eslatmalar faqat uning roziligi bilan SMS yoki Telegram orqali yuboriladi. Hech qanday spam yuborilmaydi.
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
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: colors.primaryLight,
  },
  tabText: {
    fontSize: 11,
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
