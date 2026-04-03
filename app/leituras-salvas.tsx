import { useFonts, PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { Stack, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { LoadingScreen } from '../components/loading-screen';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const API_URL = 'https://oraculo-vercel.vercel.app/api';

type LeituraSalva = {
  id: number;
  leitura_id: number;
  frase: string;
  area?: string | null;
  interpretacao?: string | null;
  card_id?: string | null;
  created_at?: string | null;
};

type CardLeituraProps = {
  item: LeituraSalva;
  onRemove: (id: number) => void;
  formatarDataHora: (data?: string | null) => string;
};

function CardLeitura({
  item,
  onRemove,
  formatarDataHora,
}: CardLeituraProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.cardLeitura}>
      <View style={styles.cardGlow} pointerEvents="none" />

      <View style={styles.topoCard}>
        <TouchableOpacity
          style={styles.expandButton}
          activeOpacity={0.85}
          onPress={() => setExpanded(prev => !prev)}
        >
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#F4D7A2"
          />
        </TouchableOpacity>

        {!!item.created_at && (
          <Text style={styles.dataTexto}>{formatarDataHora(item.created_at)}</Text>
        )}
      </View>

      <Text style={styles.frase}>{item.frase}</Text>

      {expanded && (
        <>
          <View style={styles.metaRow}>
            {!!item.area && (
              <View style={styles.metaChip}>
                <Ionicons
                  name="sparkles-outline"
                  size={12}
                  color="#F4D7A2"
                />
                <Text style={styles.metaChipTexto}>{item.area}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.deleteIconButton}
              activeOpacity={0.85}
              onPress={() => {
                Alert.alert(
                  'Remover leitura',
                  'Deseja remover esta leitura dos salvos?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Remover',
                      style: 'destructive',
                      onPress: () => onRemove(item.id),
                    },
                  ]
                );
              }}
            >
              <Ionicons name="trash-outline" size={16} color="rgba(255, 197, 122, 0.44)" />
            </TouchableOpacity>
          </View>

          {!!item.interpretacao && (
            <View style={styles.cardInterpretacaoMini}>
              <Text style={styles.rotuloInterpretacao}>Leitura simbólica</Text>
              <Text style={styles.textoInterpretacaoMini}>
                {item.interpretacao}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

export default function LeiturasSalvasScreen() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
  });

  const [carregando, setCarregando] = useState(true);
  const [leituras, setLeituras] = useState<LeituraSalva[]>([]);

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(16)).current;

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
    carregarLeiturasSalvas();
  }, []);

  async function carregarLeiturasSalvas() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        Alert.alert('Login necessário', 'Faça login novamente.');
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_URL}/listar-leituras-salvas`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
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
          data?.error || 'Leituras salvas são um recurso do plano premium.'
        );
        router.back();
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao carregar leituras salvas.');
      }

      setLeituras(Array.isArray(data?.leituras) ? data.leituras : []);
    } catch (error: any) {
      console.log('Erro ao carregar leituras salvas:', error);
      Alert.alert(
        'Erro',
        error?.message || 'Não foi possível carregar suas leituras salvas.'
      );
    } finally {
      setCarregando(false);
    }
  }

  async function removerLeitura(favoritoId: number) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        Alert.alert('Login necessário', 'Faça login novamente.');
        return;
      }

      const response = await fetch(`${API_URL}/remover-leitura-salva`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ favoritoId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao remover.');
      }

      setLeituras(prev => prev.filter(item => item.id !== favoritoId));
    } catch (error: any) {
      console.log('Erro ao remover leitura:', error);
      Alert.alert('Erro', error?.message || 'Não foi possível remover.');
    }
  }

  function formatarDataHora(data?: string | null) {
    if (!data) return '';

    const date = new Date(data);

    if (Number.isNaN(date.getTime())) {
      return data;
    }

    return date.toLocaleDateString('pt-BR');
  }

  if (!fontsLoaded || carregando) {
    return <LoadingScreen text="Abrindo leituras salvas..." />;
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
              <RadialGradient id="savedGlow" cx="50%" cy="28%" r="80%">
                <Stop offset="0%" stopColor="#15385A" stopOpacity="0.20" />
                <Stop offset="40%" stopColor="#0C1E36" stopOpacity="0.16" />
                <Stop offset="100%" stopColor="#040916" stopOpacity="0.92" />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#savedGlow)" />
          </Svg>
        </View>

        <ScrollView
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
              <Text style={styles.titulo}>Leituras salvas</Text>
              <Text style={styles.subtituloTopo}>
                {leituras.length === 0
                  ? 'nenhuma leitura guardada'
                  : `${leituras.length} ${
                      leituras.length === 1 ? 'leitura guardada' : 'leituras guardadas'
                    }`}
              </Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          {leituras.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyGlow} />
              <View style={styles.cardVazio}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="bookmark-outline" size={20} color="#F4D7A2" />
                </View>

                <Text style={styles.rotuloVazio}>Seu arquivo sagrado</Text>
                <Text style={styles.textoVazio}>
                  Você ainda não salvou nenhuma leitura.
                </Text>
                <Text style={styles.textoVazioMenor}>
                  Quando salvar uma leitura com interpretação, ela aparecerá aqui.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.listaWrap}>
              {leituras.map(item => (
                <CardLeitura
                  key={item.id}
                  item={item}
                  onRemove={removerLeitura}
                  formatarDataHora={formatarDataHora}
                />
              ))}
            </View>
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
    backgroundColor: 'rgba(22, 21, 6, 0)',
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
    marginBottom: 22,
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
    fontSize: 28,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
    textShadowColor: 'rgba(0,0,0,0.38)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },

  subtituloTopo: {
    marginTop: 4,
    color: '#c1ebf6',
    fontSize: 13,
    letterSpacing: 1.1,
    textTransform: 'lowercase',
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  emptyWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 38,
  },

  emptyGlow: {
    position: 'absolute',
    top: 48,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(244, 215, 162, 0.08)',
    shadowColor: '#F4D7A2',
    shadowOpacity: 0.28,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },

  cardVazio: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(244, 215, 162, 0.18)',
    backgroundColor: 'rgba(7,17,34,0.62)',
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
  },

  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(244, 215, 162, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 215, 162, 0.20)',
  },

  rotuloVazio: {
    color: '#F4D7A2',
    fontSize: 14,
    letterSpacing: 1.4,
    textTransform: 'lowercase',
    marginBottom: 10,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  textoVazio: {
    color: '#F6E7C1',
    fontSize: 22,
    lineHeight: 32,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  textoVazioMenor: {
    marginTop: 10,
    color: '#c1ebf6',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  listaWrap: {
    gap: 16,
  },

  cardLeitura: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(244, 215, 162, 0.18)',
    backgroundColor: 'rgba(7,17,34,0.64)',
    paddingVertical: 18,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },

  cardGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: 'rgba(127, 165, 255, 0)',
  },

  topoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  expandButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 215, 162, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 215, 162, 0.18)',
  },

  dataTexto: {
    color: '#c1ebf6',
    fontSize: 12,
    fontFamily: 'PlayfairDisplay_600SemiBold',
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

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 14,
    gap: 10,
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

  deleteIconButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 157, 9, 0.04)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 197, 122, 0.44)',
  },

  cardInterpretacaoMini: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 146, 0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },

  rotuloInterpretacao: {
    color: '#C9A96B',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'PlayfairDisplay_600SemiBold',
    textAlign: 'center',
  },

  textoInterpretacaoMini: {
    color: '#e0f9ff',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'left',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
});