import { useFonts, PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const API_URL = 'https://oraculo-vercel.vercel.app/api';

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
  const [interpretacaoRealizadaHoje, setInterpretacaoRealizadaHoje] = useState(false);
  const [areasUsadasHoje, setAreasUsadasHoje] = useState<string[]>([]);
  const [areasDisponiveisHoje, setAreasDisponiveisHoje] = useState<string[]>([
    ...AREAS_DA_VIDA,
  ]);

  useEffect(() => {
    carregarStatus();
  }, []);

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

  function obterTextoStatus() {
    if (plano === 'premium') {
      if (areasDisponiveisHoje.length === 0) {
        return 'Você já interpretou todas as áreas disponíveis hoje.';
      }

      return `Áreas disponíveis hoje: ${areasDisponiveisHoje.length}/${AREAS_DA_VIDA.length}`;
    }

    return interpretacaoRealizadaHoje
      ? 'No plano gratuito, você já usou sua interpretação de hoje.'
      : 'No plano gratuito, você tem 1 interpretação disponível hoje.';
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

  if (!fontsLoaded || carregandoStatus) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          presentation: 'card',
        }}
      />

      <ImageBackground
        source={require('../assets/images/background.png')}
        resizeMode="cover"
        style={styles.background}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.botaoVoltar}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color="#E8C27A" />
            </TouchableOpacity>
          </View>

          <Text style={styles.titulo}>Interpretação</Text>

          <View style={styles.cardFrase}>
            <Text style={styles.rotulo}>Sua mensagem</Text>
            <Text style={styles.frase}>{frase}</Text>
          </View>

          <View style={styles.cardStatus}>
            <Text style={styles.statusTitulo}>
              {plano === 'premium' ? 'Plano Premium' : 'Plano Gratuito'}
            </Text>
            <Text style={styles.statusTexto}>{obterTextoStatus()}</Text>

            {plano === 'premium' && areasUsadasHoje.length > 0 && (
              <Text style={styles.statusTextoMenor}>
                Já usadas hoje: {areasUsadasHoje.join(', ')}
              </Text>
            )}
          </View>

          <Text style={styles.subtitulo}>Escolha uma área da vida</Text>

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
                  >
                    {area}
                  </Text>

                  {bloqueada && (
                    <Ionicons
                      name="lock-closed"
                      size={14}
                      color="#9F8BB9"
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
            activeOpacity={0.85}
          >
            <Text style={styles.textoBotaoPrincipal}>
              {carregando ? 'Interpretando...' : 'Gerar interpretação'}
            </Text>
          </TouchableOpacity>

          {carregando && (
            <ActivityIndicator
              size="large"
              color="#E8C27A"
              style={styles.loader}
            />
          )}

          {!!interpretacao && (
            <>
              <View style={styles.cardInterpretacao}>
                <Text style={styles.rotulo}>Leitura simbólica</Text>
                <Text style={styles.textoInterpretacao}>{interpretacao}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.botaoSalvar,
                  salvandoLeitura && styles.botaoDesativado,
                ]}
                onPress={salvarLeitura}
                activeOpacity={0.85}
                disabled={salvandoLeitura}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={18}
                  color="#E8D8FF"
                  style={styles.iconeBotaoSalvar}
                />
                <Text style={styles.textoBotaoSalvar}>
                  {salvandoLeitura ? 'Salvando...' : 'Salvar leitura'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    minHeight: '100%',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
    backgroundColor: '#1a1230dd',
  },
  header: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  titulo: {
    fontSize: 34,
    color: '#E8C27A',
    marginBottom: 18,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  cardFrase: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(232,194,122,0.22)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  rotulo: {
    color: '#C9A96B',
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  frase: {
    color: '#F6E7C1',
    fontSize: 22,
    lineHeight: 30,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  cardStatus: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(184,146,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  statusTitulo: {
    color: '#F1C97A',
    fontSize: 18,
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  statusTexto: {
    color: '#E8D8FF',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  statusTextoMenor: {
    color: '#BFA7E8',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  subtitulo: {
    color: '#E8C27A',
    fontSize: 22,
    marginBottom: 14,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  areasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  botaoArea: {
    minWidth: 132,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: '#7B5BBE',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  botaoAreaSelecionada: {
    backgroundColor: '#3C235A',
    borderColor: '#E8C27A',
  },
  botaoAreaBloqueada: {
    opacity: 0.48,
    borderColor: '#6A5A84',
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  textoArea: {
    color: '#E8D8FF',
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  textoAreaSelecionada: {
    color: '#F6E7C1',
  },
  textoAreaBloqueada: {
    color: '#B6A6C9',
  },
  iconeBloqueio: {
    marginLeft: 6,
  },
  botaoPrincipal: {
    width: '100%',
    backgroundColor: '#3C235A',
    borderWidth: 1.5,
    borderColor: '#D5A85E',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  botaoDesativado: {
    opacity: 0.5,
  },
  textoBotaoPrincipal: {
    color: '#F1C97A',
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  loader: {
    marginTop: 20,
  },
  cardInterpretacao: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(232,194,122,0.22)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginTop: 24,
  },
  textoInterpretacao: {
    color: '#F2E8FF',
    fontSize: 17,
    lineHeight: 28,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  botaoSalvar: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.2,
    borderColor: '#7FA6FF',
    paddingVertical: 15,
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
    color: '#E8D8FF',
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
});