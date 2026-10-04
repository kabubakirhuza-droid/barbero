import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { X, Star, MessageSquarePlus, Check, User } from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';
import { api } from '../api/apiClient';

export interface ReviewItem {
  id: string;
  masterId: string;
  clientName: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

interface ReviewsListModalProps {
  visible: boolean;
  onClose: () => void;
  masterId: string;
  masterName?: string;
  canAddReview?: boolean;
}

export const ReviewsListModal: React.FC<ReviewsListModalProps> = ({
  visible,
  onClose,
  masterId,
  masterName = 'BarberPlan Master',
  canAddReview = true,
}) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [avgRating, setAvgRating] = useState<number>(5.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Form states
  const [newClientName, setNewClientName] = useState<string>('');
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const loadReviews = async () => {
    if (!masterId) return;
    setLoading(true);
    try {
      const res = await api.getReviews(masterId);
      if (res?.reviews) {
        setReviews(res.reviews);
        setAvgRating(res.avgRating || 5.0);
      }
    } catch (e) {
      console.warn('Failed to load reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && masterId) {
      loadReviews();
    }
  }, [visible, masterId]);

  const handleSubmitReview = async () => {
    if (!newClientName.trim()) return;
    setSubmitting(true);
    try {
      await api.submitReview(masterId, newClientName.trim(), newRating, newComment.trim());
      setSuccessMessage('Rahmat! Sharhingiz muvaffaqiyatli saqlandi ⭐');
      setShowAddForm(false);
      setNewComment('');
      setNewClientName('');
      loadReviews();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (e) {
      console.warn('Submit review error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Mijozlar bahosi va sharhlari</Text>
              <Text style={styles.subTitle}>{masterName}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Rating Summary Pill */}
          <View style={styles.ratingSummaryCard}>
            <View style={styles.ratingLeft}>
              <Text style={styles.bigRatingNum}>{avgRating.toFixed(1)}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    color={s <= Math.round(avgRating) ? '#F59E0B' : '#E5E7EB'}
                    fill={s <= Math.round(avgRating) ? '#F59E0B' : 'transparent'}
                  />
                ))}
              </View>
              <Text style={styles.totalReviewsCount}>{reviews.length} ta sharh</Text>
            </View>

            {canAddReview && !showAddForm && (
              <TouchableOpacity
                style={styles.addReviewBtn}
                onPress={() => setShowAddForm(true)}
                activeOpacity={0.8}
              >
                <MessageSquarePlus size={16} color="#FFFFFF" />
                <Text style={styles.addReviewBtnText}>Baholash</Text>
              </TouchableOpacity>
            )}
          </View>

          {successMessage ? (
            <View style={styles.successBanner}>
              <Check size={16} color="#059669" />
              <Text style={styles.successBannerText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Add Review Form */}
          {showAddForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Fikr va baho qoldirish</Text>
              
              <Text style={styles.inputLabel}>Bahongiz:</Text>
              <View style={styles.starPickerRow}>
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <TouchableOpacity
                    key={starVal}
                    onPress={() => setNewRating(starVal)}
                    style={styles.starBtn}
                    activeOpacity={0.7}
                  >
                    <Star
                      size={28}
                      color={starVal <= newRating ? '#F59E0B' : '#D1D5DB'}
                      fill={starVal <= newRating ? '#F59E0B' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Ismingiz:</Text>
              <TextInput
                style={styles.inputField}
                value={newClientName}
                onChangeText={setNewClientName}
                placeholder="Masalan: Sardor"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>Sharhingiz (ixtiyoriy):</Text>
              <TextInput
                style={[styles.inputField, { height: 64 }]}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Usta ishi, qulaylik va xizmat haqida fikringiz..."
                placeholderTextColor={colors.textMuted}
                multiline
              />

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelFormBtn}
                  onPress={() => setShowAddForm(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelFormBtnText}>Bekor qilish</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitFormBtn}
                  onPress={handleSubmitReview}
                  disabled={submitting || !newClientName.trim()}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitFormBtnText}>Yuborish</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Reviews List */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLOR_PRIMARY} />
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.emptyBox}>
              <Star size={36} color={COLOR_PRIMARY} />
              <Text style={styles.emptyTitle}>Hozircha sharhlar yo'q</Text>
              <Text style={styles.emptySub}>Birinchi bo'lib baho qoldiring!</Text>
            </View>
          ) : (
            <ScrollView style={styles.reviewsScroll} showsVerticalScrollIndicator={false}>
              {reviews.map((item) => (
                <View key={item.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeaderRow}>
                    <View style={styles.avatarMini}>
                      <User size={14} color={COLOR_PRIMARY} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.clientName}>{item.clientName}</Text>
                      <View style={styles.starsRowMini}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            color={s <= item.rating ? '#F59E0B' : '#E5E7EB'}
                            fill={s <= item.rating ? '#F59E0B' : 'transparent'}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  {item.comment ? <Text style={styles.commentText}>{item.comment}</Text> : null}
                </View>
              ))}
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
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subTitle: {
    fontSize: 13,
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
  ratingSummaryCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  ratingLeft: {
    gap: 3,
  },
  bigRatingNum: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  totalReviewsCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  addReviewBtn: {
    backgroundColor: COLOR_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  addReviewBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  successBanner: {
    backgroundColor: '#ECFDF5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successBannerText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLOR_PRIMARY,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 4,
  },
  starPickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  starBtn: {
    padding: 4,
  },
  inputField: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelFormBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.card,
  },
  cancelFormBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  submitFormBtn: {
    backgroundColor: COLOR_PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  submitFormBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  reviewsScroll: {
    maxHeight: 320,
  },
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 6,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  starsRowMini: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  commentText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
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
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
