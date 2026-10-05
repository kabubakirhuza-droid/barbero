import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MapPin, Navigation, Scissors, Clock, User, ChevronRight, Compass } from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';

interface Master {
  masterId: string;
  fullName: string;
  username: string;
}

export interface SalonWithLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  memberCount?: number;
  mastersCount?: number;
  masters?: Master[];
  distanceMeters?: number;
}

interface SalonsMapViewProps {
  salons: SalonWithLocation[];
  onSelectSalon: (salon: SalonWithLocation) => void;
  userCoords?: { lat: number; lng: number };
}

const { width } = Dimensions.get('window');

export const SalonsMapView: React.FC<SalonsMapViewProps & { onRequestLocation?: () => void; userAddress?: string }> = ({
  salons,
  onSelectSalon,
  userCoords,
  onRequestLocation,
  userAddress = "Toshkent sh.",
}) => {
  const [selectedSalon, setSelectedSalon] = useState<SalonWithLocation | null>(
    salons[0] || null
  );

  useEffect(() => {
    if (salons.length > 0 && !selectedSalon) {
      setSelectedSalon(salons[0]);
    }
  }, [salons, selectedSalon]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handleMsg = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SELECT_SALON') {
        const found = salons.find((s) => s.id === event.data.id);
        if (found) {
          setSelectedSalon(found);
          onSelectSalon(found);
        }
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, [salons, onSelectSalon]);

  const centerLat = userCoords?.lat || (salons[0]?.latitude ?? 41.311081);
  const centerLng = userCoords?.lng || (salons[0]?.longitude ?? 69.240562);

  // Generate interactive leaflet map HTML for Web iframe
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html { margin: 0; padding: 0; height: 100%; width: 100%; background: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        #map { height: 100%; width: 100%; }
        .barber-marker {
          background: #2563EB;
          border: 2.5px solid #FFFFFF;
          color: white;
          width: 38px;
          height: 38px;
          border-radius: 19px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 16px;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.4);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .barber-marker:hover { transform: scale(1.15); }
        .user-marker {
          background: #2563EB;
          border: 3px solid #FFFFFF;
          width: 18px;
          height: 18px;
          border-radius: 9px;
          box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.25);
        }
        .leaflet-popup-content-wrapper {
          border-radius: 16px;
          background: #FFFFFF;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .popup-title { font-weight: 800; font-size: 15px; color: #1F2937; margin-bottom: 4px; }
        .popup-addr { font-size: 12px; color: #6B7280; margin-bottom: 8px; }
        .popup-btn {
          background: #2563EB;
          color: white;
          text-align: center;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12px;
          text-decoration: none;
          display: block;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        ${
          userCoords
            ? `
        // Accuracy circle
        L.circle([${userCoords.lat}, ${userCoords.lng}], {
          color: '#2563EB',
          fillColor: '#3B82F6',
          fillOpacity: 0.15,
          radius: 120
        }).addTo(map);

        // User location marker
        L.marker([${userCoords.lat}, ${userCoords.lng}], {
          icon: L.divIcon({ className: 'user-marker', iconSize: [18, 18] })
        }).addTo(map).bindPopup('<b>Mening joylashuvim</b>');
        `
            : ''
        }

        const salonsData = ${JSON.stringify(salons)};
        salonsData.forEach(salon => {
          const customIcon = L.divIcon({
            className: 'barber-marker',
            html: '💈',
            iconSize: [38, 38],
            iconAnchor: [19, 19]
          });
          const marker = L.marker([salon.latitude || 41.311, salon.longitude || 69.240], { icon: customIcon }).addTo(map);
          marker.bindPopup(\`
            <div style="min-width:140px">
              <div class="popup-title">\${salon.name}</div>
              <div class="popup-addr">\${salon.address || ''}</div>
              <a href="#" class="popup-btn" onclick="window.parent.postMessage({ type: 'SELECT_SALON', id: '\${salon.id}' }, '*'); return false;">Tanlash →</a>
            </div>
          \`);
          marker.on('click', () => {
            window.parent.postMessage({ type: 'SELECT_SALON', id: salon.id }, '*');
          });
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* Map Display View */}
      <View style={styles.mapFrame}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={mapHtml}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: 20,
            }}
            title="Sartaroshxonalar xaritasi"
          />
        ) : (
          /* Native fallback interactive schema representation */
          <View style={styles.nativeMapPlaceholder}>
            <Compass size={40} color={COLOR_PRIMARY} />
            <Text style={styles.mapMockText}>
              Xarita: {salons.length} ta sartaroshxona
            </Text>
          </View>
        )}

        {/* Floating Compass / GPS Indicator */}
        <TouchableOpacity
          style={styles.gpsFloatingBadge}
          onPress={onRequestLocation}
          activeOpacity={0.8}
          accessibilityLabel="Mening joylashuvim"
        >
          <Navigation size={14} color="#FFFFFF" />
          <Text style={styles.gpsText}>
            {userCoords ? userAddress || 'Joylashuv aniqlandi' : 'Mening joylashuvim'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Carousel of Salons on the Map */}
      <View style={styles.bottomCarousels}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, height: 160 }}
          contentContainerStyle={styles.cardsScroll}
        >
          {salons.map((salon) => {
            const isSelected = selectedSalon?.id === salon.id;
            const mastersCount =
              salon.memberCount ||
              salon.mastersCount ||
              (salon.masters?.length ?? 1);

            return (
              <TouchableOpacity
                key={salon.id}
                style={[
                  styles.mapSalonCard,
                  isSelected && styles.mapSalonCardActive,
                ]}
                onPress={() => {
                  setSelectedSalon(salon);
                  onSelectSalon(salon);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.iconCircle}>
                    <Scissors size={18} color={COLOR_PRIMARY} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.salonName} numberOfLines={1}>
                      {salon.name}
                    </Text>
                    <View style={styles.metaRow}>
                      <MapPin size={11} color={colors.textMuted} />
                      <Text style={styles.metaAddress} numberOfLines={1}>
                        {salon.address || 'Toshkent sh.'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.pillRow}>
                  <View style={styles.pill}>
                    <User size={11} color={colors.textSecondary} />
                    <Text style={styles.pillText}>{mastersCount} ta usta</Text>
                  </View>
                  <View style={[styles.pill, styles.openPill]}>
                    <Clock size={11} color="#059669" />
                    <Text style={[styles.pillText, { color: '#059669' }]}>
                      Ochiq
                    </Text>
                  </View>
                </View>

                {/* Book Action button */}
                <TouchableOpacity
                  style={styles.bookBtn}
                  onPress={() => onSelectSalon(salon)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bookBtnText}>Vaqt band qilish →</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapFrame: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    backgroundColor: '#FAF6F0',
    position: 'relative',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  nativeMapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapMockText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  gpsFloatingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(26, 24, 21, 0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  gpsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomCarousels: {
    paddingVertical: 12,
    flexGrow: 0,
    flexShrink: 0,
    height: 180,
  },
  cardsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  mapSalonCard: {
    width: width > 400 ? 300 : 270,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    gap: 10,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  mapSalonCardActive: {
    borderColor: COLOR_PRIMARY,
    backgroundColor: '#FFFDF9',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salonName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaAddress: {
    fontSize: 11,
    color: colors.textMuted,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  openPill: {
    backgroundColor: '#ECFDF5',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  bookBtn: {
    backgroundColor: COLOR_PRIMARY,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
