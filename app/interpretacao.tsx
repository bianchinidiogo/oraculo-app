import { useFonts, PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { LoadingScreen } from '../components/loading-screen';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import OracleSymbol from '../components/OracleSymbol';

const API_URL = 'https://oraculo-vercel.vercel.app/api';
const HOME_SYMBOL_SIZE = 260;

const AREAS_DA_VIDA = [
  'Amor',
  'Trabalho',
  'Dinheiro',
  'Família',
  'Espiritualidade',
  'Saúde',
  'Propósito',
] as const;

type Plano = 'free' | 'premium';

export default function InterpretacaoScreen() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
  });

  const { frase, leituraId, cardId } = useLocalSearchParams<{
    frase?: string;
    leituraId?: string;
    cardId?: string;
  }>();

  const [areaSelecionada, setAreaSelecionada] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [carregandoStatus, setCarregandoStatus] = useState(true);
  const [interpretacao, setInterpretacao] = useState('');
  const [salvandoLeitura, setSalvandoLeitura] = useState(false);

  const [plano, setPlano] = useState<Plano>('free');
  const [interpretacaoRealizadaHoje, setInterpretacaoRealizadaHoje] =
    useState(false);
  const [areasUsadasHoje, setAreasUsadasHoje] = useState<string[]>([]);
  const [_areasDisponiveisHoje, setAreasDisponiveisHoje] = useState<string[]>([
    ...AREAS_DA_VIDA,
  ]);

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(16)).current;
  const idleBreath = useRef(new Animated.Value(0)).current;
  const ritualPulse = useRef(new Animated.Value(0)).current;

  const scrollRef = useRef<ScrollView | null>(null);
  const interpretacaoY = useRef(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateY, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [screenOpacity, screenTranslateY]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(idleBreath, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(idleBreath, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [idleBreath]);

  useEffect(() => {
    ritualPulse.setValue(0);

    Animated.sequence([
      Animated.timing(ritualPulse, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ritualPulse, {
        toValue: 0,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [ritualPulse]);

  useEffect(() => {
    carregarStatus();
  }, []);

  useEffect(() => {
    if (!interpretacao) return;

    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, interpretacaoY.current - 24),
        animated: true,
      });
    }, 120);

    return () => clearTimeout(timeout);
  }, [interpretacao]);

  async function carregarStatus() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        Alert.alert('Login necessário', 'Faça login novamente.');
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_URL}/status-diario`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao carregar status diário.');
      }

      const planoAtual: Plano = data?.plano === 'premium' ? 'premium' : 'free';
      const areasUsadas = Array.isArray(data?.areasUsadasHoje)
        ? data.areasUsadasHoje
        : [];
      const areasDisponiveis = Array.isArray(data?.areasDisponiveisHoje)
        ? data.areasDisponiveisHoje
        : [...AREAS_DA_VIDA];

      setPlano(planoAtual);
      setInterpretacaoRealizadaHoje(!!data?.interpretacaoRealizadaHoje);
      setAreasUsadasHoje(areasUsadas);
      setAreasDisponiveisHoje(areasDisponiveis);

      if (planoAtual === 'free' && data?.interpretacaoRealizadaHoje) {
        setAreaSelecionada('');
      }
    } catch (error: any) {
      console.log('Erro ao carregar status da interpretação:', error);
      Alert.alert(
        'Erro',
        error?.message || 'Não foi possível carregar o status de interpretação.'
      );
    } finally {
      setCarregandoStatus(false);
    }
  }

  function areaEstaBloqueada(area: string) {
    if (plano === 'free') {
      return interpretacaoRealizadaHoje;
    }

    return areasUsadasHoje.includes(area);
  }

  function podeGerarInterpretacao() {
    if (!areaSelecionada) return false;
    if (carregando) return false;
    if (carregandoStatus) return false;
    if (areaEstaBloqueada(areaSelecionada)) return false;
    return true;
  }

  async function gerarInterpretacao() {
    if (!frase) {
      Alert.alert('Erro', 'Frase não encontrada.');
      return;
    }

    if (!areaSelecionada) {
      Alert.alert(
        'Escolha uma área',
        'Selecione uma área da vida para interpretar.'
      );
      return;
    }

    if (plano === 'free' && interpretacaoRealizadaHoje) {
      Alert.alert(
        'Limite diário',
        'No plano gratuito, você já realizou sua interpretação de hoje.'
      );
      return;
    }

    if (plano === 'premium' && areasUsadasHoje.includes(areaSelecionada)) {
      Alert.alert(
        'Área já interpretada',
        `Você já realizou a interpretação da área ${areaSelecionada} hoje.`
      );
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      Alert.alert('Login necessário', 'Faça login novamente.');
      router.replace('/login');
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch(`${API_URL}/interpretar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          frase,
          area: areaSelecionada,
          cardId: cardId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert('Sessão inválida', 'Faça login novamente.');
          router.replace('/login');
          return;
        }

        if (response.status === 429) {
          Alert.alert(
            'Limite diário',
            data?.error || 'Você já realizou essa interpretação hoje.'
          );

          await carregarStatus();
          return;
        }

        throw new Error(data?.error || 'Erro ao interpretar');
      }

      if (!data?.interpretacao) {
        throw new Error('A API respondeu sem interpretação.');
      }

      setInterpretacao(data.interpretacao);

      const planoAtual: Plano = data?.plano === 'premium' ? 'premium' : 'free';
      const novasAreasUsadas = Array.isArray(data?.areasUsadasHoje)
        ? data.areasUsadasHoje
        : planoAtual === 'premium'
          ? [...new Set([...areasUsadasHoje, areaSelecionada])]
          : [areaSelecionada];

      const novasAreasDisponiveis = Array.isArray(data?.areasDisponiveisHoje)
        ? data.areasDisponiveisHoje
        : planoAtual === 'premium'
          ? AREAS_DA_VIDA.filter(area => !novasAreasUsadas.includes(area))
          : [];

      setPlano(planoAtual);
      setInterpretacaoRealizadaHoje(true);
      setAreasUsadasHoje(novasAreasUsadas);
      setAreasDisponiveisHoje(novasAreasDisponiveis);
    } catch (error: any) {
      console.log('Erro ao gerar interpretação:', error);

      Alert.alert(
        'Erro',
        error?.message || 'Não foi possível gerar a interpretação.'
      );
    } finally {
      setCarregando(false);
    }
  }

  async function salvarLeitura() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      Alert.alert('Login necessário', 'Faça login novamente.');
      router.replace('/login');
      return;
    }

    if (!leituraId) {
      Alert.alert(
        'Nova leitura necessária',
        'Essa mensagem foi aberta sem um registro válido. Gere uma nova leitura antes de salvar.'
      );
      return;
    }

    if (!interpretacao || !areaSelecionada) {
      Alert.alert(
        'Atenção',
        'Gere a interpretação antes de salvar esta leitura.'
      );
      return;
    }

    setSalvandoLeitura(true);

    try {
      const response = await fetch(`${API_URL}/favoritar-leitura`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          leituraId: Number(leituraId),
          frase,
          area: areaSelecionada,
          interpretacao,
          cardId: cardId || null,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        Alert.alert('Sessão inválida', 'Faça login novamente.');
        router.replace('/login');
        return;
      }

      if (response.status === 403) {
        Alert.alert(
          'Recurso premium',
          data?.error || 'Salvar leituras é um recurso do plano premium.'
        );
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível salvar a leitura.');
      }

      Alert.alert(
        data?.jaFavoritada ? 'Leitura atualizada' : 'Leitura salva',
        data?.mensagem ||
          (data?.jaFavoritada
            ? 'A leitura salva foi atualizada com a interpretação.'
            : 'Sua leitura foi salva com sucesso.')
      );
    } catch (error: any) {
      console.log('Erro ao salvar leitura:', error);
      Alert.alert(
        'Erro',
        error?.message || 'Não foi possível salvar a leitura.'
      );
    } finally {
      setSalvandoLeitura(false);
    }
  }

  const symbolScale = Animated.add(
    idleBreath.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.995, 1.01, 0.995],
    }),
    ritualPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.08],
    })
  );

  const symbolGlowScale = Animated.add(
    idleBreath.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.98, 1.02, 0.98],
    }),
    ritualPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.18],
    })
  );

  const symbolGlowOpacity = Animated.add(
    idleBreath.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.18, 0.24, 0.18],
    }),
    ritualPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.22],
    })
  );

  if (!fontsLoaded || carregandoStatus) {
    return <LoadingScreen text="Abrindo interpretação..." />;
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

      <Animated.View
        style={[
          styles.container,
          {
            opacity: screenOpacity,
            transform: [{ translateY: screenTranslateY }],
          },
        ]}
      >
        <View style={styles.videoVeil} />

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

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.botaoVoltar}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={16} color="#F4D7A2" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.titulo}>Interpretação</Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.topSymbolWrap} pointerEvents="none">
            <Animated.View
              style={[
                styles.symbolGlow,
                {
                  opacity: symbolGlowOpacity,
                  transform: [{ scale: symbolGlowScale }],
                },
              ]}
            />

            <Animated.View
              style={{
                transform: [{ scale: symbolScale }],
              }}
            >
              <OracleSymbol
                size={HOME_SYMBOL_SIZE}
                raysProps={{ rotation: 0, opacity: 0.34 }}
                circlesProps={{ rotation: 0, scale: 1, opacity: 0.88 }}
                innerGlowProps={{ scale: 1, opacity: 1 }}
                starProps={{ rotation: 0, scale: 1, opacity: 0.92 }}
              />
            </Animated.View>
          </View>

          <View style={styles.cardMensagem}>
            <View style={styles.cardGlow} pointerEvents="none" />
            <Text style={styles.frase}>{frase}</Text>
          </View>

          <View style={styles.areaHeader}>
            <Text style={styles.subtitulo}>Escolha uma área da vida</Text>
          </View>

          <View style={styles.areasContainer}>
            {AREAS_DA_VIDA.map(area => {
              const selecionada = areaSelecionada === area;
              const bloqueada = areaEstaBloqueada(area);

              return (
                <TouchableOpacity
                  key={area}
                  style={[
                    styles.botaoArea,
                    selecionada && styles.botaoAreaSelecionada,
                    bloqueada && styles.botaoAreaBloqueada,
                  ]}
                  onPress={() => {
                    if (!bloqueada) {
                      setAreaSelecionada(area);
                    }
                  }}
                  activeOpacity={bloqueada ? 1 : 0.85}
                  disabled={bloqueada}
                >
                  <Text
                    style={[
                      styles.textoArea,
                      selecionada && styles.textoAreaSelecionada,
                      bloqueada && styles.textoAreaBloqueada,
                    ]}
                    numberOfLines={1}
                  >
                    {area}
                  </Text>

                  {bloqueada && (
                    <Ionicons
                      name="lock-closed"
                      size={11}
                      color="#c1ebf6"
                      style={styles.iconeBloqueio}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.botaoPrincipal,
              !podeGerarInterpretacao() && styles.botaoDesativado,
            ]}
            onPress={gerarInterpretacao}
            disabled={!podeGerarInterpretacao()}
            activeOpacity={0.88}
          >
            <Ionicons
              name={carregando ? 'hourglass-outline' : 'sparkles-outline'}
              size={16}
              color="#221104"
              style={styles.iconeBotaoPrincipal}
            />
            <Text style={styles.textoBotaoPrincipal}>
              {carregando ? 'Interpretando...' : 'Revelar interpretação'}
            </Text>
          </TouchableOpacity>

          {carregando && (
            <ActivityIndicator
              size="large"
              color="#F4D7A2"
              style={styles.loader}
            />
          )}

          {!!interpretacao && (
            <>
              <View
                style={styles.cardInterpretacao}
                onLayout={event => {
                  interpretacaoY.current = event.nativeEvent.layout.y;
                }}
              >
                <View style={styles.cardGlowSecondary} pointerEvents="none" />
                {!!areaSelecionada && (
                  <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                      <Ionicons
                        name="sparkles-outline"
                        size={12}
                        color="#F4D7A2"
                      />
                      <Text style={styles.metaChipTexto}>{areaSelecionada}</Text>
                    </View>
                  </View>
                )}

                <Text style={styles.textoInterpretacao}>{interpretacao}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.botaoSalvar,
                  salvandoLeitura && styles.botaoDesativado,
                ]}
                onPress={salvarLeitura}
                activeOpacity={0.88}
                disabled={salvandoLeitura}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={16}
                  color="#F4D7A2"
                  style={styles.iconeBotaoSalvar}
                />
                <Text style={styles.textoBotaoSalvar}>
                  {salvandoLeitura ? 'Salvando...' : 'Salvar leitura'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  videoVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 13, 22, 0)',
  },

  glowLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  botaoVoltar: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 215, 162, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(244, 215, 162, 0.26)',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  headerSpacer: {
    width: 42,
    height: 42,
  },

  titulo: {
    color: '#F6E7C1',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
    textShadowColor: 'rgba(0,0,0,0.38)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },

  topSymbolWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
    marginBottom: 0,
    minHeight: 260,
  },

  symbolGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: 'rgba(244, 215, 162, 0.12)',
    shadowColor: '#F4D7A2',
    shadowOpacity: 0.30,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },

  cardMensagem: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(244, 215, 162, 0.18)',
    backgroundColor: 'rgba(7,17,34,0.64)',
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 18,
    overflow: 'hidden',
  },

  cardGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 76, 255, 0)',
  },

  cardGlowSecondary: {
    position: 'absolute',
    top: -48,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 178, 35, 0.05)',
  },

  frase: {
    color: '#F6E7C1',
    fontSize: 24,
    lineHeight: 34,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
    textShadowColor: 'rgba(0,0,0,0.30)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  areaHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },

  subtitulo: {
    color: '#c1ebf6',
    fontSize: 15,
    letterSpacing: 1,
    textTransform: 'lowercase',
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  areasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 22,
  },

  botaoArea: {
    minWidth: 96,
    maxWidth: 132,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 146, 0.16)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  botaoAreaSelecionada: {
    backgroundColor: 'rgba(244, 215, 162, 0.12)',
    borderColor: '#F4D7A2',
  },

  botaoAreaBloqueada: {
    opacity: 0.42,
    borderColor: 'rgba(193, 235, 246, 0.20)',
    backgroundColor: 'rgba(255,255,255,0.018)',
  },

  textoArea: {
    color: '#e0f9ff',
    fontSize: 13,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  textoAreaSelecionada: {
    color: '#F6E7C1',
  },

  textoAreaBloqueada: {
    color: '#c1ebf6',
  },

  iconeBloqueio: {
    marginLeft: 5,
  },

  botaoPrincipal: {
    width: '100%',
    minHeight: 50,
    backgroundColor: '#F4D7A2',
    borderWidth: 1.2,
    borderColor: '#F4D7A2',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#F4D7A2',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },

  botaoDesativado: {
    opacity: 0.5,
  },

  iconeBotaoPrincipal: {
    marginRight: 8,
  },

  textoBotaoPrincipal: {
    color: '#221104',
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  loader: {
    marginTop: 20,
  },

  cardInterpretacao: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 146, 0.18)',
    backgroundColor: 'rgba(7,17,34,0.64)',
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginTop: 24,
    overflow: 'hidden',
  },

  metaRow: {
    alignItems: 'center',
    marginBottom: 12,
  },

  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(19, 43, 73, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(244, 215, 162, 0.18)',
  },

  metaChipTexto: {
    color: '#F4D7A2',
    fontSize: 13,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  textoInterpretacao: {
    color: '#e0f9ff',
    fontSize: 16,
    lineHeight: 26,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  botaoSalvar: {
    width: '100%',
    minHeight: 48,
    backgroundColor: 'rgba(255, 157, 9, 0.04)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 197, 122, 0.44)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 14,
  },

  iconeBotaoSalvar: {
    marginRight: 8,
  },

  textoBotaoSalvar: {
    color: '#F4D7A2',
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
});