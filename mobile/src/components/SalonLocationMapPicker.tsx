import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MapPin, Navigation, Compass, CheckCircle2, Crosshair } from 'lucide-react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';

export interface Coords {
  lat: number;
  lng: number;
}

export interface SalonLocationMapPickerProps {
  coords: Coords;
  address?: string;
  salonName?: string;
  onCoordsChange: (coords: Coords, addressHint?: string) => void;
  height?: number;
}

const DISTRICT_PRESETS = [
  { name: 'Chilonzor', lat: 41.2721, lng: 69.2045, addr: 'Toshkent sh., Chilonzor tumani' },
  { name: 'Yunusobod', lat: 41.3645, lng: 69.2872, addr: 'Toshkent sh., Yunusobod tumani' },
  { name: 'Markaz', lat: 41.3111, lng: 69.2406, addr: 'Toshkent sh., Markaz (Amir Temur)' },
  { name: 'Mirzo Ulug‘bek', lat: 41.3283, lng: 69.3346, addr: 'Toshkent sh., Mirzo Ulug‘bek tumani' },
  { name: 'Yakkasaroy', lat: 41.2858, lng: 69.2553, addr: 'Toshkent sh., Yakkasaroy tumani' },
];

export const SalonLocationMapPicker: React.FC<SalonLocationMapPickerProps> = ({
  coords,
  address,
  salonName = 'BarberPlan Sartaroshxonasi',
  onCoordsChange,
  height = 240,
}) => {
  const [activeDistrict, setActiveDistrict] = useState<string>('Yunusobod');
  const [userGps, setUserGps] = useState<Coords | null>(null);
  const [locating, setLocating] = useState<boolean>(false);

  // Auto detect user GPS on mount
  useEffect(() => {
    detectUserGps(false);
  }, []);

  const detectUserGps = (moveMarker: boolean = true) => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          setUserGps({ lat, lng });
          setLocating(false);

          if (moveMarker) {
            setActiveDistrict('Mening joylashuvim');
            onCoordsChange({ lat, lng }, 'Mening aniq joylashuvim');
          }
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'MAP_CLICKED_COORDS') {
          const { lat, lng } = event.data;
          if (typeof lat === 'number' && typeof lng === 'number') {
            onCoordsChange({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
          }
        } else if (event.data && event.data.type === 'TRIGGER_GPS') {
          detectUserGps(true);
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [onCoordsChange]);

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html { margin: 0; padding: 0; height: 100%; width: 100%; background: #FBF8F4; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
        #map { height: 100%; width: 100%; }
        .salon-pin {
          background: #2563EB;
          border: 3px solid #FFFFFF;
          color: white;
          width: 44px;
          height: 44px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.45);
          cursor: grab;
          animation: pulsePin 2s infinite;
        }
        @keyframes pulsePin {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.5); }
          70% { box-shadow: 0 0 0 12px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        .user-gps-dot {
          background: #2563EB;
          border: 3px solid #FFFFFF;
          width: 20px;
          height: 20px;
          border-radius: 10px;
          box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.35);
          cursor: pointer;
          animation: gpsPulse 1.8s infinite;
        }
        @keyframes gpsPulse {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.6); }
          70% { box-shadow: 0 0 0 14px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        .instruction-banner {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          background: rgba(26, 24, 21, 0.85);
          color: #FFF;
          font-size: 11px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          white-space: nowrap;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="instruction-banner">📍 Joylashuvni o'zgartirish uchun xaritani bosing</div>
      <script>
        const map = L.map('map', { zoomControl: false }).setView([${coords.lat}, ${coords.lng}], 15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        ${
          userGps
            ? `
        // User real GPS position dot
        const userIcon = L.divIcon({
          className: 'user-gps-dot',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        const userMarker = L.marker([${userGps.lat}, ${userGps.lng}], { icon: userIcon }).addTo(map);
        userMarker.bindPopup('<b>📍 Siz turgan joy (GPS)</b><br><a href="#" onclick="window.parent.postMessage({ type: \\'TRIGGER_GPS\\' }, \\'*\\'); return false;" style="color:#2563EB; font-weight:700; font-size:12px;">Sartaroshxonani shu yerga qo\\'yish</a>');
        `
            : ''
        }

        const pinIcon = L.divIcon({
          className: 'salon-pin',
          html: '💈',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        let marker = L.marker([${coords.lat}, ${coords.lng}], { icon: pinIcon, draggable: true }).addTo(map);
        marker.bindPopup('<b>${salonName.replace(/'/g, "\\'")}</b><br>${(address || 'Toshkent').replace(/'/g, "\\'")}').openPopup();

        marker.on('dragend', function(e) {
          const latlng = e.target.getLatLng();
          window.parent.postMessage({ type: 'MAP_CLICKED_COORDS', lat: latlng.lat, lng: latlng.lng }, '*');
        });

        map.on('click', function(e) {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          marker.setLatLng([lat, lng]);
          window.parent.postMessage({ type: 'MAP_CLICKED_COORDS', lat: lat, lng: lng }, '*');
        });
      </script>
    </body>
    </html>
  `;

  const handleSelectDistrict = (item: typeof DISTRICT_PRESETS[0]) => {
    setActiveDistrict(item.name);
    onCoordsChange({ lat: item.lat, lng: item.lng }, item.addr);
  };

  return (
    <View style={styles.container}>
      {/* Header and Coordinates */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleBox}>
          <Compass size={16} color={COLOR_PRIMARY} />
          <Text style={styles.headerTitle}>Xaritada joylashuv</Text>
        </View>

        <View style={styles.coordsBadge}>
          <MapPin size={12} color={COLOR_PRIMARY} />
          <Text style={styles.coordsText}>
            {coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°
          </Text>
        </View>
      </View>

      {/* District Presets and Current Location GPS Button */}
      <View style={styles.districtChips}>
        <TouchableOpacity
          style={[
            styles.gpsLiveButton,
            activeDistrict === 'Mening joylashuvim' && styles.gpsLiveButtonActive,
          ]}
          onPress={() => detectUserGps(true)}
          activeOpacity={0.7}
        >
          {locating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Crosshair size={13} color="#FFFFFF" />
          )}
          <Text style={styles.gpsLiveButtonText}>
            {locating ? 'Aniqlanmoqda...' : '🎯 Mening turgan joyim'}
          </Text>
        </TouchableOpacity>

        {DISTRICT_PRESETS.map((item) => {
          const isSelected = activeDistrict === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.districtChip, isSelected && styles.districtChipActive]}
              onPress={() => handleSelectDistrict(item)}
              activeOpacity={0.7}
            >
              {isSelected && <CheckCircle2 size={12} color="#FFFFFF" />}
              <Text style={[styles.districtChipText, isSelected && styles.districtChipTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Map Viewer Container */}
      <View style={[styles.mapWrapper, { height }]}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={mapHtml}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: 16,
            }}
            title="Sartaroshxona joylashuvi xaritasi"
          />
        ) : (
          <View style={styles.nativeFallback}>
            <MapPin size={36} color={COLOR_PRIMARY} />
            <Text style={styles.fallbackTitle}>Xarita: Toshkent shahri</Text>
            <Text style={styles.fallbackSub}>
              {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
            </Text>
          </View>
        )}

        <View style={styles.floatingIndicator}>
          <Navigation size={13} color="#FFFFFF" />
          <Text style={styles.floatingText} numberOfLines={1}>
            {address || 'Toshkent sh.'}
          </Text>
        </View>

        {/* Quick GPS Floating Action Button on the Map */}
        <TouchableOpacity
          style={styles.floatingGpsBtn}
          onPress={() => detectUserGps(true)}
          activeOpacity={0.8}
        >
          {locating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Crosshair size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    gap: 10,
    marginTop: 6,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  coordsText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  districtChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  gpsLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  gpsLiveButtonActive: {
    backgroundColor: '#1D4ED8',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
  },
  gpsLiveButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  districtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  districtChipActive: {
    backgroundColor: COLOR_PRIMARY,
    borderColor: COLOR_PRIMARY,
  },
  districtChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  districtChipTextActive: {
    color: '#FFFFFF',
  },
  mapWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: '#F5EFE6',
    position: 'relative',
  },
  nativeFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 16,
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  fallbackSub: {
    fontSize: 12,
    color: colors.textMuted,
  },
  floatingIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    maxWidth: '75%',
    backgroundColor: 'rgba(26, 24, 21, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  floatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingGpsBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
