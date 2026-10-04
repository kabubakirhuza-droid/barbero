import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { X, User, Phone, MessageSquare, Clock, Scissors, Sparkles, Check } from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { api } from '../api/apiClient';

interface InactiveClientsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const InactiveClientsModal: React.FC<InactiveClientsModalProps> = ({
  visible,
  onClose,
}) => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadInactive = async () => {
    setLoading(true);
    try {
      const res = await api.getInactiveClients();
      if (res?.inactiveClients) {
        setClients(res.inactiveClients);
      }
    } catch (e) {
      console.warn('Failed to load inactive clients:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadInactive();
    }
  }, [visible]);

  const handleSendReminder = (client: any) => {
    const rawName = client.name || 'Mijoz';
    const message = `Assalomu alaykum ${rawName}! BarberPlan ustangiz sizni kutmoqda, sochingizni yangilash vaqti keldi ✂️`;
    
    // Clean phone
    let phoneDigits = (client.phone || '').replace(/\D/g, '');
    if (phoneDigits.length === 9) phoneDigits = `998${phoneDigits}`;

    // Try opening telegram or SMS
    const tgUrl = `https://t.me/+${phoneDigits}?text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(tgUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(tgUrl);
        } else {
          Linking.openURL(`sms:+${phoneDigits}?body=${encodeURIComponent(message)}`);
        }
      })
      .catch(() => {
        Linking.openURL(`sms:+${phoneDigits}?body=${encodeURIComponent(message)}`);
      });

    setCopiedId(client.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <Scissors size={20} color={COLOR_PRIMARY} />
              <View>
                <Text style={styles.title}>Mijozlarni qaytarish</Text>
                <Text style={styles.subTitle}>3 haftadan beri kelmagan mijozlar</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Banner */}
          <View style={styles.banner}>
            <Sparkles size={16} color={COLOR_PRIMARY} />
            <Text style={styles.bannerText}>
              Ushbu mijozlarga bitta xabar bilan eslatma yuboring va bo'sh vaqtlaringizni to'ldiring!
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLOR_PRIMARY} />
            </View>
          ) : clients.length === 0 ? (
            <View style={styles.emptyBox}>
              <Check size={36} color="#059669" />
              <Text style={styles.emptyTitle}>Barcha mijozlar faol!</Text>
              <Text style={styles.emptySub}>3 haftadan oshgan nofaol mijozlar mavjud emas</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
              {clients.map((c) => {
                const isCopied = copiedId === c.id;
                return (
                  <View key={c.id} style={styles.clientCard}>
                    <View style={styles.cardTop}>
                      <View style={styles.avatar}>
                        <User size={16} color={COLOR_PRIMARY} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.clientName}>{c.name}</Text>
                        <Text style={styles.clientPhone}>{c.phone || "Telefon yo'q"}</Text>
                      </View>
                      <View style={styles.badge}>
                        <Clock size={11} color={COLOR_PRIMARY} />
                        <Text style={styles.badgeText}>
                          {c.lastVisitDate ? `${c.lastVisitDate}` : 'Eski mijoz'}
                        </Text>
                      </View>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.callBtn}
                        onPress={() => handleCall(c.phone)}
                        activeOpacity={0.7}
                        disabled={!c.phone}
                      >
                        <Phone size={14} color={COLOR_PRIMARY} />
                        <Text style={styles.callBtnText}>Qo'ng'iroq</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.remindBtn, isCopied && styles.remindBtnSuccess]}
                        onPress={() => handleSendReminder(c)}
                        activeOpacity={0.8}
                      >
                        {isCopied ? (
                          <Check size={14} color="#FFFFFF" />
                        ) : (
                          <MessageSquare size={14} color="#FFFFFF" />
                        )}
                        <Text style={styles.remindBtnText}>
                          {isCopied ? 'Yuborildi!' : 'Eslatma yuborish'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
    minHeight: '45%',
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  banner: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8DCC8',
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLOR_PRIMARY,
    flex: 1,
    lineHeight: 16,
  },
  scrollList: {
    maxHeight: 380,
  },
  clientCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  clientPhone: {
    fontSize: 12,
    color: colors.textMuted,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    paddingVertical: 9,
    borderRadius: 12,
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  remindBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLOR_PRIMARY,
    paddingVertical: 9,
    borderRadius: 12,
  },
  remindBtnSuccess: {
    backgroundColor: '#059669',
  },
  remindBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
