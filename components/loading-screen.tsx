import { ActivityIndicator, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useFonts, PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';

type LoadingScreenProps = {
  text?: string;
};

export function LoadingScreen({
  text = 'Carregando...',
}: LoadingScreenProps) {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
  });

  return (
    <ImageBackground
      source={require('../assets/images/background.png')}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.overlay}>
        <Text style={[styles.title, !fontsLoaded && styles.titleFallback]}>
          Oráculo Diário
        </Text>

        <View style={styles.box}>
          <ActivityIndicator size="small" color="#E8C27A" />
          <Text style={[styles.text, !fontsLoaded && styles.textFallback]}>
            {text}
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(18, 10, 34, 0.60)',
  },
  title: {
    fontSize: 30,
    color: '#E8C27A',
    marginBottom: 24,
    fontFamily: 'PlayfairDisplay_600SemiBold',
    textAlign: 'center',
  },
  titleFallback: {
    fontFamily: undefined,
    fontWeight: '600',
  },
  box: {
    minWidth: 240,
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232,194,122,0.25)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  text: {
    marginTop: 12,
    color: '#E8D8FF',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  textFallback: {
    fontFamily: undefined,
    fontWeight: '600',
  },
});