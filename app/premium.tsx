import { useFonts, PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { LoadingScreen } from '../components/loading-screen';

const BENEFICIOS = [
  {
    icon: 'sparkles-outline',
    title: 'Mais leituras por dia',
    text: 'Siga sua jornada sem esperar.',
  },
  {
    icon: 'planet-outline',
    title: 'Mais áreas',
    text: 'Explore mais aspectos da vida.',
  },
  {
    icon: 'bookmark-outline',
    title: 'Salve mensagens',
    text: 'Revisite leituras importantes.',
  },
] as const;

export default function PremiumScreen() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
  });

  const { origem } = useLocalSearchParams<{ origem?: string }>();

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateY, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();
  }, [screenOpacity, screenTranslateY]);

  const conteudo = useMemo(() => {
    switch (origem) {
      case 'salvos':
        return {
          titulo: 'Guarde suas mensagens',
          descricao:
            'Salve leituras importantes e revisite cada insight quando quiser.',
          precoLabel: 'Desbloqueie os salvos',
          precoObs: 'Cancele quando quiser',
          cta: 'Salvar com Premium',
          secundario: 'Continuar gratuito',
        };

      case 'interpretacao':
        return {
          titulo: 'Aprofunde sua interpretação',
          descricao:
            'Revele mais sentidos da sua leitura e explore outras áreas da sua vida.',
          precoLabel: 'Continue interpretando',
          precoObs: 'Cancele quando quiser',
          cta: 'Desbloquear interpretação',
          secundario: 'Continuar gratuito',
        };

      case 'limite':
        return {
          titulo: 'Continue sua jornada hoje',
          descricao:
            'No Premium, você faz mais leituras por dia sem precisar esperar até amanhã.',
          precoLabel: 'Vá além do limite diário',
          precoObs: 'Cancele quando quiser',
          cta: 'Continuar com Premium',
          secundario: 'Voltar por enquanto',
        };

      default:
        return {
          titulo: 'Desbloqueie o Oráculo completo',
          descricao:
            'Mais profundidade, mais liberdade e menos limitações na sua jornada.',
          precoLabel: 'Plano Premium',
          precoObs: 'Cancele quando quiser',
          cta: 'Ativar Premium',
          secundario: 'Continuar gratuito',
        };
    }
  }, [origem]);

  function handleComprar() {
    console.log('Comprar premium');
  }

  if (!fontsLoaded) {
    return <LoadingScreen text="Abrindo Premium..." />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />

      <Animated.View
        style={[
          styles.container,
          {
            opacity: screenOpacity,
            transform: [{ translateY: screenTranslateY }],
          },
        ]}
      >
        <View style={styles.glowLayer} pointerEvents="none">
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
            <Defs>
              <RadialGradient id="bgGlow" cx="50%" cy="30%" r="80%">
                <Stop offset="0%" stopColor="#15385A" stopOpacity="0.20" />
                <Stop offset="40%" stopColor="#0C1E36" stopOpacity="0.16" />
                <Stop offset="100%" stopColor="#040916" stopOpacity="0.92" />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#bgGlow)" />
          </Svg>
        </View>

        <SafeAreaView style={styles.safe}>
          <View style={styles.content}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.botaoVoltar}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={16} color="#F4D7A2" />
            </TouchableOpacity>

            <View style={styles.centerWrap}>
              <View style={styles.cardsWrap}>
                <View style={styles.card}>
                  <Text style={styles.titulo}>{conteudo.titulo}</Text>
                  <Text style={styles.descricao}>{conteudo.descricao}</Text>

                  <View style={styles.precoWrap}>
                    <Text style={styles.precoLabel}>{conteudo.precoLabel}</Text>
                    <Text style={styles.preco}>R$ 9,90/mês</Text>
                    <Text style={styles.precoObs}>{conteudo.precoObs}</Text>
                  </View>
                </View>

                <View style={styles.card}>
                  {BENEFICIOS.map(item => (
                    <View key={item.title} style={styles.beneficio}>
                      <Ionicons
                        name={item.icon as any}
                        size={13}
                        color="#F4D7A2"
                        style={styles.iconeBeneficio}
                      />

                      <View style={styles.beneficioTextoWrap}>
                        <Text style={styles.beneficioTitulo}>{item.title}</Text>
                        <Text style={styles.beneficioTexto}>{item.text}</Text>
                      </View>
                    </View>
                  ))}

                  <View style={styles.botoesWrap}>
                    <TouchableOpacity
                      style={styles.botaoPrincipal}
                      onPress={handleComprar}
                      activeOpacity={0.9}
                    >
                      <Ionicons
                        name="diamond-outline"
                        size={16}
                        color="#221104"
                        style={styles.iconeBotao}
                      />
                      <Text style={styles.textoBotao}>{conteudo.cta}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.botaoSecundario}
                      onPress={() => router.back()}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.textoSecundario}>
                        {conteudo.secundario}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  glowLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  safe: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 14,
  },

  botaoVoltar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 215, 162, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(244, 215, 162, 0.26)',
    marginBottom: 8,
  },

  centerWrap: {
    flex: 1,
    justifyContent: 'center',
  },

  cardsWrap: {
    gap: 10,
  },

  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(244, 215, 162, 0.18)',
    backgroundColor: 'rgba(7,17,34,0.64)',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },

  titulo: {
    color: '#F6E7C1',
    fontSize: 19,
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  descricao: {
    color: '#e0f9ff',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  precoWrap: {
    marginTop: 10,
    alignItems: 'center',
  },

  precoLabel: {
    color: '#F4D7A2',
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  preco: {
    color: '#F6E7C1',
    fontSize: 24,
    lineHeight: 28,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  precoObs: {
    marginTop: 2,
    color: '#c1ebf6',
    fontSize: 11,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  beneficio: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  iconeBeneficio: {
    marginRight: 8,
    marginTop: 2,
  },

  beneficioTextoWrap: {
    flex: 1,
  },

  beneficioTitulo: {
    color: '#F6E7C1',
    fontSize: 13,
    marginBottom: 1,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  beneficioTexto: {
    color: '#e0f9ff',
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  botoesWrap: {
    marginTop: 10,
  },

  botaoPrincipal: {
    width: '100%',
    backgroundColor: '#F4D7A2',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },

  iconeBotao: {
    marginRight: 8,
  },

  textoBotao: {
    color: '#221104',
    fontSize: 15,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  botaoSecundario: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoSecundario: {
    color: '#F4D7A2',
    fontSize: 13,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
});