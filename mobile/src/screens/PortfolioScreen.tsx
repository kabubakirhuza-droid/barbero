import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { Plus, Heart, Globe, Sparkles, Check } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTranslation } from '../i18n/LanguageContext';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { PortfolioPhoto } from '../types';
import { api } from '../api/apiClient';

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2;

export const PortfolioScreen: React.FC = () => {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [isAddSheetVisible, setIsAddSheetVisible] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<PortfolioPhoto | null>(null);

  const samplePhotoUrls = [
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
    'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80',
    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80',
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80',
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80',
    'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80',
  ];

  const loadPortfolio = async () => {
    try {
      const res = await api.getPortfolio();
      if (res?.photos) {
        setPhotos(res.photos);
      }
    } catch (e) {
      setPhotos([
        {
          id: 'pt-1',
          imageUrl: samplePhotoUrls[0],
          caption: 'Klassik erkaklar soch turmagi & soqol konturi',
          likesCount: 38,
          isPublic: true,
          createdAt: '2026-09-20T10:00:00Z',
        },
        {
          id: 'pt-2',
          imageUrl: samplePhotoUrls[1],
          caption: 'Skin fade soch uslubi',
          likesCount: 52,
          isPublic: true,
          createdAt: '2026-09-22T14:30:00Z',
        },
        {
          id: 'pt-3',
          imageUrl: samplePhotoUrls[2],
          caption: 'Modern pompadour va styling',
          likesCount: 41,
          isPublic: true,
          createdAt: '2026-09-25T16:00:00Z',
        },
        {
          id: 'pt-4',
          imageUrl: samplePhotoUrls[3],
          caption: 'Soqol shakllantirish va issiq sochiq muolajasi',
          likesCount: 29,
          isPublic: true,
          createdAt: '2026-09-28T12:00:00Z',
        },
      ]);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const handleLike = async (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likesCount: p.likesCount + 1 } : p))
    );
    try {
      await api.likePortfolioPhoto(id);
    } catch (e) {}
  };

  const handleAddPhoto = async () => {
    const url = newImageUrl.trim() || samplePhotoUrls[Math.floor(Math.random() * samplePhotoUrls.length)];
    const newP: PortfolioPhoto = {
      id: `pt-${Date.now()}`,
      imageUrl: url,
      caption: newCaption.trim() || "Yangi soch turmagi qo'shildi",
      likesCount: 1,
      isPublic: true,
      createdAt: new Date().toISOString(),
    };

    setPhotos((prev) => [newP, ...prev]);
    setIsAddSheetVisible(false);
    setNewImageUrl('');
    setNewCaption('');

    try {
      await api.addPortfolioPhoto(url, newCaption);
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      {/* Top Banner / Add Button */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topTitle}>{t('portfolioTitle')}</Text>
          <Text style={styles.topSubtitle}>{photos.length} ta namuna ishlar</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setIsAddSheetVisible(true)}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>{t('addPhotoBtn')}</Text>
        </TouchableOpacity>
      </View>

      {/* Grid of photos */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {photos.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => setSelectedPhoto(item)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />

              {/* Public Badge */}
              <View style={styles.publicBadge}>
                <Globe size={11} color={colors.primary} />
                <Text style={styles.publicBadgeText}>{t('publicBadge')}</Text>
              </View>

              {/* Bottom Card Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.cardCaption} numberOfLines={2}>
                  {item.caption}
                </Text>

                <TouchableOpacity
                  style={styles.likeRow}
                  onPress={() => handleLike(item.id)}
                  activeOpacity={0.7}
                >
                  <Heart size={14} color={colors.danger} fill={colors.danger} />
                  <Text style={styles.likesText}>{item.likesCount}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Sheet: Add Photo */}
      <BottomSheet
        visible={isAddSheetVisible}
        onClose={() => setIsAddSheetVisible(false)}
        title={t('addPhotoBtn')}
      >
        <View style={styles.addForm}>
          <Text style={styles.fieldLabel}>Rasm tanlash (yoki URL)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
            {samplePhotoUrls.map((url, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setNewImageUrl(url)}
                style={[
                  styles.presetThumb,
                  newImageUrl === url && styles.presetThumbActive,
                ]}
              >
                <Image source={{ uri: url }} style={styles.presetImage} />
                {newImageUrl === url && (
                  <View style={styles.presetCheck}>
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={newImageUrl}
              onChangeText={setNewImageUrl}
              placeholder="Rasm havolasini kiriting (https://...)"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <Text style={styles.fieldLabel}>Izoh / Tavsif</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={newCaption}
              onChangeText={setNewCaption}
              placeholder="Masalan, Skin fade soch uslubi"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <Button
            title={t('saveBtn')}
            onPress={handleAddPhoto}
            style={{ marginTop: 12 }}
          />
        </View>
      </BottomSheet>

      {/* Fullscreen Photo Viewer */}
      {selectedPhoto && (
        <BottomSheet
          visible={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          title={t('portfolioTitle')}
        >
          <View style={styles.viewerContent}>
            <Image source={{ uri: selectedPhoto.imageUrl }} style={styles.viewerImage} />
            <Text style={styles.viewerCaption}>{selectedPhoto.caption}</Text>
            <View style={styles.viewerFooter}>
              <TouchableOpacity
                style={styles.viewerLikeBtn}
                onPress={() => handleLike(selectedPhoto.id)}
              >
                <Heart size={18} color={colors.danger} fill={colors.danger} />
                <Text style={styles.viewerLikeText}>{selectedPhoto.likesCount} ta yoqdi</Text>
              </TouchableOpacity>
              <View style={styles.viewerPublicTag}>
                <Globe size={14} color={colors.primary} />
                <Text style={styles.viewerPublicText}>Mijozlarga ommaviy ko'rinadi</Text>
              </View>
            </View>
          </View>
        </BottomSheet>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  topSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    paddingTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  card: {
    width: itemWidth,
    backgroundColor: colors.card,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.skeleton,
  },
  publicBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  publicBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  cardInfo: {
    padding: 10,
  },
  cardCaption: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 16,
    minHeight: 32,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  likesText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  addForm: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  presetThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 8,
    position: 'relative',
  },
  presetThumbActive: {
    borderColor: colors.primary,
  },
  presetImage: {
    width: '100%',
    height: '100%',
  },
  presetCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 2,
  },
  inputBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  viewerContent: {
    gap: 14,
  },
  viewerImage: {
    width: '100%',
    height: 280,
    borderRadius: 18,
    backgroundColor: colors.skeleton,
  },
  viewerCaption: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  viewerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewerLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  viewerLikeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  viewerPublicTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewerPublicText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
