import { useFonts, PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { Stack, router } from 'expo-router';
import { useEffect, useRef } from 'react';
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

export default function MinhaAssinaturaScreen() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
  });

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
  }, []);

  if (!fontsLoaded) {
    return <LoadingScreen text="Abrindo assinatura..." />;
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
        {/* BACKGROUND GLOW */}
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
            {/* BOTÃO VOLTAR */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.botaoVoltar}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={16} color="#F4D7A2" />
            </TouchableOpacity>

            <View style={styles.centerWrap}>
              <View style={styles.cardsWrap}>
                
                {/* CARD STATUS */}
                <View style={styles.card}>
                  <Text style={styles.titulo}>Minha Assinatura</Text>
                  <Text style={styles.descricao}>
                    Seu plano Premium está ativo
                  </Text>

                  <View style={styles.statusWrap}>
                    <View style={styles.statusChipPremium}>
                      <Ionicons
                        name="diamond-outline"
                        size={12}
                        color="#221104"
                        style={styles.statusChipIcone}
                      />
                      <Text style={styles.statusChipTextoPremium}>
                        Premium
                      </Text>
                    </View>

                    <Text style={styles.statusValor}>
                      Renovação ativa
                    </Text>
                  </View>

                  <Text style={styles.textoApoio}>
                    Sua assinatura está ativa e sua próxima renovação está prevista
                    para 10/05/2026.
                  </Text>
                </View>

                {/* CARD DETALHES */}
                <View style={styles.card}>
                  <Text style={styles.blocoTitulo}>Seu plano atual</Text>

                  <View style={styles.precoWrap}>
                    <Text style={styles.preco}>R$ 9,90/mês</Text>
                    <Text style={styles.precoObs}>
                      Acesso Premium em andamento
                    </Text>
                  </View>

                  <View style={styles.listaBeneficios}>
                    <View style={styles.beneficio}>
                      <Ionicons
                        name="sparkles-outline"
                        size={13}
                        color="#F4D7A2"
                        style={styles.iconeBeneficio}
                      />
                      <Text style={styles.beneficioTexto}>
                        Mais leituras por dia
                      </Text>
                    </View>

                    <View style={styles.beneficio}>
                      <Ionicons
                        name="planet-outline"
                        size={13}
                        color="#F4D7A2"
                        style={styles.iconeBeneficio}
                      />
                      <Text style={styles.beneficioTexto}>
                        Mais áreas disponíveis
                      </Text>
                    </View>

                    <View style={styles.beneficio}>
                      <Ionicons
                        name="bookmark-outline"
                        size={13}
                        color="#F4D7A2"
                        style={styles.iconeBeneficio}
                      />
                      <Text style={styles.beneficioTexto}>
                        Salve mensagens importantes
                      </Text>
                    </View>
                  </View>

                  <View style={styles.botoesWrap}>
                    <TouchableOpacity
                      style={styles.botaoPrincipal}
                      activeOpacity={0.9}
                    >
                      <Ionicons
                        name="settings-outline"
                        size={16}
                        color="#221104"
                        style={styles.iconeBotao}
                      />
                      <Text style={styles.textoBotao}>
                        Gerenciar assinatura
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.botaoSecundario}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.textoSecundario}>
                        Restaurar compras
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
    paddingTop: 10,
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
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  descricao: {
    color: '#F6E7C1',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  statusWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },

  statusChipPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#F4D7A2',
    borderWidth: 1,
    borderColor: '#F4D7A2',
    marginBottom: 8,
  },

  statusChipIcone: {
    marginRight: 6,
  },

  statusChipTextoPremium: {
    color: '#221104',
    fontSize: 12,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  statusValor: {
    color: '#e0f9ff',
    fontSize: 13,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  textoApoio: {
    color: '#c1ebf6',
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  blocoTitulo: {
    color: '#F6E7C1',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  precoWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },

  preco: {
    color: '#F6E7C1',
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  precoObs: {
    marginTop: 2,
    color: '#c1ebf6',
    fontSize: 11,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  listaBeneficios: {
    marginBottom: 12,
  },

  beneficio: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  iconeBeneficio: {
    marginRight: 8,
  },

  beneficioTexto: {
    flex: 1,
    color: '#e0f9ff',
    fontSize: 12,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  botoesWrap: {
    marginTop: 4,
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
  },

  textoSecundario: {
    color: '#F4D7A2',
    fontSize: 13,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
});