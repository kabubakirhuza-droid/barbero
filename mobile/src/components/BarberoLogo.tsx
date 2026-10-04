import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, COLOR_PRIMARY } from '../theme/theme';

interface BarberoLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  dark?: boolean;
}

export const BarberoLogo: React.FC<BarberoLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  dark = false,
}) => {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const emblemSize = isSmall ? 32 : isLarge ? 56 : 42;
  const letterSize = isSmall ? 18 : isLarge ? 32 : 24;
  const titleSize = isSmall ? 18 : isLarge ? 28 : 22;

  return (
    <View style={styles.container}>
      {/* Golden Emblem with Stylized 'B' */}
      <View
        style={[
          styles.emblem,
          {
            width: emblemSize,
            height: emblemSize,
            borderRadius: emblemSize / 2,
            backgroundColor: dark ? '#1A1815' : '#2A241C',
            borderColor: COLOR_PRIMARY,
          },
        ]}
      >
        <Text
          style={[
            styles.emblemText,
            {
              fontSize: letterSize,
              color: COLOR_PRIMARY,
            },
          ]}
        >
          B
        </Text>
        <View style={styles.poleStripes}>
          <View style={[styles.stripe, { backgroundColor: COLOR_PRIMARY }]} />
          <View style={[styles.stripe, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.stripe, { backgroundColor: '#DC2626' }]} />
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text
          style={[
            styles.brandTitle,
            {
              fontSize: titleSize,
              color: dark ? '#FFFFFF' : COLOR_PRIMARY,
            },
          ]}
        >
          BARBERPLAN
        </Text>
        {showSubtitle && (
          <Text style={[styles.brandSubtitle, { color: dark ? '#60A5FA' : colors.textSecondary }]}>
            CRM & ONLINE BRON
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emblem: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: COLOR_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  emblemText: {
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'sans-serif',
    letterSpacing: -0.5,
  },
  poleStripes: {
    position: 'absolute',
    left: 2,
    top: 4,
    bottom: 4,
    width: 3,
    borderRadius: 2,
    overflow: 'hidden',
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  stripe: {
    width: '100%',
    height: '28%',
    borderRadius: 1,
  },
  textContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontWeight: '900',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'sans-serif',
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: -2,
    textTransform: 'uppercase',
  },
});
