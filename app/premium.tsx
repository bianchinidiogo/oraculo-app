import { useFonts, PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { Stack, router } from 'expo-router';
import { useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const BENEFICIOS = [
  {
    icon: 'sparkles-outline',
    title: 'Mais leituras por dia',
    text: 'Continue sua jornada sem precisar esperar até amanhã.',
  },
  {
    icon: 'planet-outline',
    title: 'Interpretação em todas as áreas',
    text: 'Amor, trabalho, dinheiro, família e muito mais no mesmo dia.',
  },
  {
    icon: 'bookmark-outline',
    title: 'Salve suas mensagens',
    text: 'Guarde leituras importantes para revisitar quando quiser.',
  },
  {
    icon: 'moon-outline',
    title: 'Experiência mais profunda',
    text: 'Acesse o lado completo do Oráculo com menos limites.',
  },
] as const;

type PremiumScreenProps = {
  origem?: 'interpretacao' | 'salvos' | 'home' | 'limite' | string;
};

export default function PremiumScreen() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
  });

  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.55)).current;

  useMemo(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.04,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 0.95,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0.55,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [glow, pulse]);

  if (!fontsLoaded) return null;

  function handleComprar() {
    // aqui depois você liga com RevenueCat / Stripe / IAP
    // por enquanto deixamos o gancho pronto
    console.log('CTA premium clicado');
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: 'fade',
          presentation: 'card',
        }}
      />

      <ImageBackground
        source={require('../assets/images/background.png')}
        resizeMode="cover"
        style={styles.background}
      >
        <LinearGradient
          colors={[
            'rgba(10, 6, 24, 0.86)',
            'rgba(20, 10, 38, 0.92)',
            'rgba(14, 8, 28, 0.97)',
          ]}
          style={styles.overlay}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.botaoVoltar}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-back" size={22} color="#E8C27A" />
              </TouchableOpacity>
            </View>

            <Animated.View
              style={[
                styles.simboloWrap,
                {
                  transform: [{ scale: pulse }],
                  opacity: glow,
                },
              ]}
            >
              <View style={styles.auraMaior} />
              <View style={styles.auraMenor} />
              <View style={styles.simboloCentro}>
                <Ionicons name="sparkles" size={34} color="#F6E7C1" />
              </View>
            </Animated.View>

            <Text style={styles.titulo}>Desperte todo o poder do Oráculo</Text>

            <Text style={styles.subtitulo}>
              Vá além da leitura gratuita e aprofunde sua jornada com uma
              experiência mais completa, fluida e memorável.
            </Text>

            <View style={styles.cardPreco}>
              <Text style={styles.badge}>Plano Premium</Text>

              <Text style={styles.precoLabel}>Acesso completo</Text>

              <Text style={styles.precoTexto}>
                Menos que um café por semana
              </Text>

              <Text style={styles.precoObs}>
                Desbloqueie mais leituras, mais interpretações e suas mensagens salvas.
              </Text>
            </View>

            <View style={styles.beneficiosContainer}>
              {BENEFICIOS.map(item => (
                <View key={item.title} style={styles.beneficioCard}>
                  <View style={styles.iconeBeneficio}>
                    <Ionicons name={item.icon as any} size={20} color="#E8C27A" />
                  </View>

                  <View style={styles.beneficioTextoWrap}>
                    <Text style={styles.beneficioTitulo}>{item.title}</Text>
                    <Text style={styles.beneficioTexto}>{item.text}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.botaoPrincipal}
              activeOpacity={0.88}
              onPress={handleComprar}
            >
              <LinearGradient
                colors={['#E4B96D', '#D59B4E', '#B97731']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradienteBotao}
              >
                <Ionicons
                  name="diamond-outline"
                  size={18}
                  color="#261533"
                  style={styles.iconeBotao}
                />
                <Text style={styles.textoBotaoPrincipal}>Ativar Premium</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSecundario}
              activeOpacity={0.82}
              onPress={() => router.back()}
            >
              <Text style={styles.textoBotaoSecundario}>
                Continuar no plano gratuito
              </Text>
            </TouchableOpacity>

            <Text style={styles.rodapeTexto}>
              O Premium foi pensado para quem deseja aprofundar a leitura e
              revisitar mensagens importantes sempre que sentir necessidade.
            </Text>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  container: {
    minHeight: '100%',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 42,
  },
  header: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  botaoVoltar: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(232,194,122,0.25)',
  },
  simboloWrap: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraMaior: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: 'rgba(160, 113, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(160, 113, 255, 0.18)',
  },
  auraMenor: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 999,
    backgroundColor: 'rgba(232,194,122,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(232,194,122,0.25)',
  },
  simboloCentro: {
    width: 68,
    height: 68,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(232,194,122,0.28)',
  },
  titulo: {
    color: '#F3D7A0',
    fontSize: 31,
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  subtitulo: {
    color: '#E8D8FF',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 22,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  cardPreco: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(232,194,122,0.25)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 20,
    alignItems: 'center',
  },
  badge: {
    color: '#1D112A',
    backgroundColor: '#E8C27A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 13,
    marginBottom: 14,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  precoLabel: {
    color: '#F6E7C1',
    fontSize: 20,
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  precoTexto: {
    color: '#E8C27A',
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  precoObs: {
    color: '#CDBBEF',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  beneficiosContainer: {
    gap: 12,
    marginBottom: 24,
  },
  beneficioCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(184,146,255,0.20)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 14,
  },
  iconeBeneficio: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232,194,122,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232,194,122,0.18)',
    marginRight: 12,
  },
  beneficioTextoWrap: {
    flex: 1,
  },
  beneficioTitulo: {
    color: '#F6E7C1',
    fontSize: 17,
    marginBottom: 4,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  beneficioTexto: {
    color: '#D9CCF5',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  botaoPrincipal: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gradienteBotao: {
    minHeight: 58,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  iconeBotao: {
    marginRight: 8,
  },
  textoBotaoPrincipal: {
    color: '#261533',
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  botaoSecundario: {
    width: '100%',
    minHeight: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginBottom: 16,
  },
  textoBotaoSecundario: {
    color: '#E8D8FF',
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  rodapeTexto: {
    color: '#BFA7E8',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
});