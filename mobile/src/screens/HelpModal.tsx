import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import {
  ChevronLeft,
  HelpCircle,
  MessageCircle,
  Phone,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Mail,
  ExternalLink,
} from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { useTranslation } from '../i18n/LanguageContext';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ visible, onClose }) => {
  const { t, language } = useTranslation();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

  const faqs = language === 'uz' ? [
    {
      q: 'BARBERO ilovasiga yangi mijozni qanday qo‘shish mumkin?',
      a: '«Jadval» bo‘limida kerakli vaqt katagidagi «+ Bo‘sh vaqt» tugmasini yoki o‘ng tarafdagi «+» tugmasini bosing. Mijoz ismi, telefon raqami va kerakli xizmatni tanlab «Saqlash» tugmasini bosing.',
    },
    {
      q: 'Obunani qanday faollashtirish yoki uzaytirish mumkin?',
      a: '«Profil» bo‘limidagi «Mening obunam» bandiga kiring va «Obunani uzaytirish / Sotib olish» tugmasini bosing. Click, Payme yoki Uzum Bank orqali to‘lovni amalga oshirishingiz mumkin.',
    },
    {
      q: 'Telegram orqali SMS eslatmalar qanday ishlaydi?',
      a: 'Mijoz yozilganda va qabul vaqtidan 2 soat oldin tizim avtomatik ravishda mijozga Telegram Gateway orqali eslatma va manzilni yuboradi.',
    },
    {
      q: 'Sartaroshxonani xaritaga qanday joylashtirish mumkin?',
      a: '«Sartaroshxona va xarita» bo‘limiga o‘tib, lokatsiyani tanlang va xaritada o‘z sartaroshxonangizni ko‘rsatib saqlang.',
    },
    {
      q: 'Daromadlar va mijozlar hisoboti qayerda ko‘rinadi?',
      a: 'Pastki paneldagi «Analitika» bo‘limida kunlik, haftalik va oylik daromadlar, o‘rtacha chek va eng ommabop xizmatlar ko‘rsatiladi.',
    },
  ] : [
    {
      q: 'Как добавить нового клиента в приложение BARBERO?',
      a: 'В разделе «Расписание» нажмите на нужный временной слот или кнопку «+». Введите имя клиента, номер телефона, выберите услугу и нажмите «Сохранить».',
    },
    {
      q: 'Как активировать или продлить подписку?',
      a: 'Перейдите в раздел «Профиль» -> «Моя подписка» и нажмите «Продлить / Купить подписку». Оплату можно произвести через Click, Payme или Uzum Bank.',
    },
    {
      q: 'Как работают уведомления и напоминания в Telegram?',
      a: 'При записи клиента и за 2 часа до визита система автоматически отправляет клиенту напоминание и локацию через Telegram Gateway.',
    },
    {
      q: 'Как добавить барбершоп на карту?',
      a: 'Перейдите в раздел «Барбершоп и карта», укажите точный адрес на карте и сохраните геопозицию.',
    },
    {
      q: 'Где посмотреть отчет о доходах и клиентах?',
      a: 'В нижней панели в разделе «Аналитика» доступны графики доходов за день/неделю/месяц, средний чек и топ услуг.',
    },
  ];

  const handleOpenTelegram = () => {
    const url = 'https://t.me/barbero_support';
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => {});
    }
  };

  const handleCallSupport = () => {
    const phone = 'tel:+998712000000';
    Linking.openURL(phone).catch(() => {});
  };

  const handleSendTicket = () => {
    if (!ticketMessage.trim()) return;
    setTicketSent(true);
    setTicketMessage('');
    setTimeout(() => {
      setTicketSent(false);
    }, 4000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{language === 'uz' ? 'Yordam va qo‘llab-quvvatlash' : 'Помощь и поддержка'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Support Channels Banner */}
          <View style={styles.quickContactCard}>
            <View style={styles.supportBadge}>
              <HelpCircle size={18} color={COLOR_PRIMARY} />
              <Text style={styles.supportBadgeText}>24/7 Support</Text>
            </View>
            <Text style={styles.quickContactTitle}>
              {language === 'uz' ? 'Biz bilan qanday bog‘lanish mumkin?' : 'Как с нами связаться?'}
            </Text>
            <Text style={styles.quickContactSubtitle}>
              {language === 'uz'
                ? 'Savollaringiz bormi? Mutaxassislarimiz har doim sizga yordam berishga tayyor.'
                : 'Есть вопросы? Наши специалисты готовы помочь вам в любое время.'}
            </Text>

            <View style={styles.channelButtonsRow}>
              <TouchableOpacity style={styles.tgBtn} onPress={handleOpenTelegram} activeOpacity={0.85}>
                <MessageCircle size={20} color="#FFFFFF" />
                <Text style={styles.tgBtnText}>Telegram: @barbero_support</Text>
                <ExternalLink size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.phoneBtn} onPress={handleCallSupport} activeOpacity={0.85}>
                <Phone size={18} color={COLOR_PRIMARY} />
                <Text style={styles.phoneBtnText}>+998 (71) 200-00-00</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FAQ Accordion */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              {language === 'uz' ? 'Ko‘p beriladigan savollar (FAQ)' : 'Часто задаваемые вопросы (FAQ)'}
            </Text>
          </View>

          <View style={styles.faqList}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <View key={idx} style={styles.faqCard}>
                  <TouchableOpacity
                    style={styles.faqQuestionRow}
                    onPress={() => setOpenFaqIndex(isOpen ? null : idx)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faqQuestionText}>{faq.q}</Text>
                    {isOpen ? (
                      <ChevronUp size={20} color={COLOR_PRIMARY} />
                    ) : (
                      <ChevronDown size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                  {isOpen && (
                    <View style={styles.faqAnswerContainer}>
                      <View style={styles.faqAnswerDivider} />
                      <Text style={styles.faqAnswerText}>{faq.a}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Direct message ticket form */}
          <View style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <Mail size={20} color={COLOR_PRIMARY} />
              <Text style={styles.ticketTitle}>
                {language === 'uz' ? 'To‘g‘ridan-to‘g‘ri xabar yuborish' : 'Отправить сообщение в поддержку'}
              </Text>
            </View>
            <Text style={styles.ticketSubtitle}>
              {language === 'uz'
                ? 'Muammo yoki taklifingizni yozing, tez orada javob beramiz.'
                : 'Опишите вашу проблему или предложение, мы ответим в ближайшее время.'}
            </Text>

            {ticketSent ? (
              <View style={styles.successBanner}>
                <CheckCircle2 size={22} color="#10B981" />
                <Text style={styles.successBannerText}>
                  {language === 'uz' ? 'Xabaringiz qabul qilindi! Rahmat.' : 'Ваше сообщение принято! Спасибо.'}
                </Text>
              </View>
            ) : (
              <View style={styles.ticketInputWrap}>
                <TextInput
                  style={styles.ticketInput}
                  placeholder={language === 'uz' ? 'Savolingizni shu yerga yozing...' : 'Напишите ваш вопрос здесь...'}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  value={ticketMessage}
                  onChangeText={setTicketMessage}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, !ticketMessage.trim() && styles.sendBtnDisabled]}
                  onPress={handleSendTicket}
                  disabled={!ticketMessage.trim()}
                  activeOpacity={0.8}
                >
                  <Send size={18} color="#FFFFFF" />
                  <Text style={styles.sendBtnText}>{language === 'uz' ? 'Yuborish' : 'Отправить'}</Text>
                </TouchableOpacity>
              </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  quickContactCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    gap: 12,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  supportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  supportBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  quickContactTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  quickContactSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  channelButtonsRow: {
    gap: 10,
    marginTop: 6,
  },
  tgBtn: {
    backgroundColor: '#2AABEE',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  tgBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  phoneBtn: {
    backgroundColor: colors.inputBackground,
    borderRadius: 14,
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  phoneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionHeaderRow: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 10,
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqAnswerDivider: {
    height: 1,
    backgroundColor: colors.cardBorderSubtle,
    marginBottom: 10,
  },
  faqAnswerText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  ticketCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    gap: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  ticketSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  ticketInputWrap: {
    gap: 10,
  },
  ticketInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },
  sendBtn: {
    backgroundColor: COLOR_PRIMARY,
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
});
