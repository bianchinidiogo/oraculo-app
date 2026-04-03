import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFonts, PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import OracleSymbol from '../components/OracleSymbol';

type LoadingScreenProps = {
  text?: string;
};

const LOADING_SYMBOL_SIZE = 160;

export function LoadingScreen({
  text = 'Carregando...',
}: LoadingScreenProps) {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
  });

  return (
    <View style={styles.container}>
      <View style={styles.videoVeil} />

      <View style={styles.glowLayer} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <RadialGradient id="loadingGlow" cx="50%" cy="30%" r="80%">
              <Stop offset="0%" stopColor="#15385A" stopOpacity="0.20" />
              <Stop offset="40%" stopColor="#0C1E36" stopOpacity="0.16" />
              <Stop offset="100%" stopColor="#040916" stopOpacity="0.92" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#loadingGlow)" />
        </Svg>
      </View>

      <View style={styles.overlay}>

        <View style={styles.box}>
          <ActivityIndicator size="small" color="#F4D7A2" />
          <Text style={[styles.text, !fontsLoaded && styles.textFallback]}>
            {text}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  videoVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.50)',
  },

  glowLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },


  box: {
    minWidth: 240,
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(244, 215, 162, 0.18)',
    backgroundColor: 'rgba(7,17,34,0.64)',
    alignItems: 'center',
    overflow: 'hidden',
  },

  text: {
    marginTop: 12,
    color: '#e0f9ff',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  textFallback: {
    fontFamily: undefined,
    fontWeight: '600',
  },
});