import { useFonts, PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ImageBackground,
  Animated,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { oraculos } from '../data/oraculos';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { LoadingScreen } from '../components/loading-screen';

const STORAGE_ORACULO = 'oraculo_atual';
const API_URL = 'https://oraculo-vercel.vercel.app/api';

type Oraculo = (typeof oraculos)[number];
type Plano = 'free' | 'premium';

type OraculoSalvo = Oraculo & {
  leituraId?: number | null;
};

export default function HomeScreen() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
  });

  const [oraculoAtual, setOraculoAtual] = useState<OraculoSalvo>(oraculos[0]);
  const [cooldownAtivo, setCooldownAtivo] = useState(false);
  const [tempoRestante, setTempoRestante] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [plano, setPlano] = useState<Plano>('free');
  const [leiturasHoje, setLeiturasHoje] = useState(0);
  const [maxLeiturasHoje, setMaxLeiturasHoje] = useState(1);
  const [leiturasRestantes, setLeiturasRestantes] = useState(1);

  const [modoEscolha, setModoEscolha] = useState(false);
  const [opcoesOraculo, setOpcoesOraculo] = useState<Oraculo[]>([]);
  const [animandoEscolha, setAnimandoEscolha] = useState(false);

  const opacidadeCartas = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  useEffect(() => {
    iniciarApp();
  }, []);

  async function iniciarApp() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace('/login');
        return;
      }

      await carregarEstadoInicial();
    } catch (error) {
      console.log('Erro ao iniciar app:', error);
      router.replace('/login');
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();

      setCooldownAtivo(false);
      setTempoRestante('');
      setModoEscolha(false);
      setOpcoesOraculo([]);
      setPlano('free');
      setLeiturasHoje(0);
      setMaxLeiturasHoje(1);
      setLeiturasRestantes(1);

      router.replace('/login');
    } catch (error) {
      console.log('Erro ao fazer logout:', error);
      Alert.alert('Erro', 'Não foi possível sair da conta.');
    }
  }

  async function carregarEstadoInicial() {
    try {
      const oraculoSalvo = await AsyncStorage.getItem(STORAGE_ORACULO);

      if (oraculoSalvo) {
        setOraculoAtual(JSON.parse(oraculoSalvo));
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setCooldownAtivo(false);
        setTempoRestante('');
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

      if (response.ok) {
        const planoAtual: Plano = data?.plano === 'premium' ? 'premium' : 'free';
        const leiturasHojeAtual = Number(data?.leiturasHoje || 0);
        const maxLeiturasAtual = Number(data?.maxLeiturasHoje || 1);
        const leiturasRestantesAtual = Math.max(
          0,
          Number(data?.leiturasRestantes ?? 0)
        );

        setPlano(planoAtual);
        setLeiturasHoje(leiturasHojeAtual);
        setMaxLeiturasHoje(maxLeiturasAtual);
        setLeiturasRestantes(leiturasRestantesAtual);

        const esgotou = leiturasRestantesAtual <= 0;
        setCooldownAtivo(esgotou);
        setTempoRestante(esgotou ? 'disponível amanhã' : '');
      } else {
        setPlano('free');
        setLeiturasHoje(0);
        setMaxLeiturasHoje(1);
        setLeiturasRestantes(1);
        setCooldownAtivo(false);
        setTempoRestante('');
      }
    } catch (error) {
      console.log('Erro ao carregar dados do oráculo:', error);
      setPlano('free');
      setLeiturasHoje(0);
      setMaxLeiturasHoje(1);
      setLeiturasRestantes(1);
      setCooldownAtivo(false);
      setTempoRestante('');
    } finally {
      setCarregando(false);
    }
  }

  function embaralharArray<T>(array: T[]) {
    const copia = [...array];

    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }

    return copia;
  }

  function gerarTresOraculosUnicos() {
    const baseSemAtual = oraculos.filter(item => item.id !== oraculoAtual.id);
    const base = baseSemAtual.length >= 3 ? baseSemAtual : oraculos;
    return embaralharArray(base).slice(0, 3);
  }

  async function iniciarConsulta() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      Alert.alert(
        'Login necessário',
        'Entre na sua conta para realizar sua consulta diária.'
      );
      router.replace('/login');
      return;
    }

    if (leiturasRestantes <= 0) {
      Alert.alert(
        'Limite diário',
        plano === 'premium'
          ? 'Você já realizou suas 3 leituras de hoje.'
          : 'Você já realizou sua leitura de hoje.'
      );
      return;
    }

    const tresOpcoes = gerarTresOraculosUnicos();

    opacidadeCartas.forEach(anim => anim.setValue(1));
    setAnimandoEscolha(false);

    setOpcoesOraculo(tresOpcoes);
    setModoEscolha(true);
  }

  async function revelarCarta(
    oraculoEscolhido: Oraculo,
    indiceEscolhido: number
  ) {
    if (animandoEscolha) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      Alert.alert(
        'Login necessário',
        'Entre na sua conta para realizar sua consulta diária.'
      );
      router.replace('/login');
      return;
    }

    setAnimandoEscolha(true);

    const animacoes = opacidadeCartas.map((anim, index) =>
      Animated.timing(anim, {
        toValue: index === indiceEscolhido ? 1 : 0,
        duration: 600,
        useNativeDriver: true,
      })
    );

    Animated.parallel(animacoes).start(() => {
      setTimeout(async () => {
        try {
          const response = await fetch(`${API_URL}/registrar-leitura`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              cardId: String(oraculoEscolhido.id),
              frase: oraculoEscolhido.frase,
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
              setModoEscolha(false);
              setOpcoesOraculo([]);
              setAnimandoEscolha(false);

              const maxLeituras = Number(data?.maxLeiturasHoje || maxLeiturasHoje);
              setMaxLeiturasHoje(maxLeituras);
              setLeiturasRestantes(0);
              setCooldownAtivo(true);
              setTempoRestante('disponível amanhã');

              Alert.alert(
                'Limite diário',
                data?.error ||
                  (plano === 'premium'
                    ? 'Você já realizou suas 3 leituras de hoje.'
                    : 'Você já realizou sua leitura de hoje.')
              );
              return;
            }

            throw new Error(data?.error || 'Erro ao registrar leitura.');
          }

          const leituraId = data?.leitura?.id ?? null;
          const leiturasHojeAtualizadas = Number(data?.leiturasHoje || 0);
          const maxLeiturasAtualizadas = Number(
            data?.maxLeiturasHoje || maxLeiturasHoje
          );
          const leiturasRestantesAtualizadas = Math.max(
            0,
            Number(data?.leiturasRestantes ?? 0)
          );

          const novoOraculoAtual: OraculoSalvo = {
            ...oraculoEscolhido,
            leituraId,
          };

          setOraculoAtual(novoOraculoAtual);
          setModoEscolha(false);
          setOpcoesOraculo([]);
          setAnimandoEscolha(false);

          setPlano(data?.plano === 'premium' ? 'premium' : 'free');
          setLeiturasHoje(leiturasHojeAtualizadas);
          setMaxLeiturasHoje(maxLeiturasAtualizadas);
          setLeiturasRestantes(leiturasRestantesAtualizadas);

          const esgotou = leiturasRestantesAtualizadas <= 0;
          setCooldownAtivo(esgotou);
          setTempoRestante(esgotou ? 'disponível amanhã' : '');

          await AsyncStorage.setItem(
            STORAGE_ORACULO,
            JSON.stringify(novoOraculoAtual)
          );
        } catch (error: any) {
          console.log('Erro ao registrar leitura:', error);
          setModoEscolha(false);
          setOpcoesOraculo([]);
          setAnimandoEscolha(false);

          Alert.alert(
            'Erro',
            error?.message || 'Não foi possível registrar sua leitura.'
          );
        }
      }, 900);
    });
  }

  async function copiarFrase() {
    await Clipboard.setStringAsync(oraculoAtual.frase);
    Alert.alert('Copiado', 'A frase foi copiada com sucesso.');
  }

  function obterTextoStatus() {
    if (modoEscolha) {
      return 'Escolha sua carta';
    }

    if (leiturasRestantes <= 0) {
      return 'Leituras esgotadas hoje\n• disponível amanhã';
    }

    return `Leituras hoje: ${leiturasHoje}/${maxLeiturasHoje}`;
  }

  if (!fontsLoaded || carregando) {
    return <LoadingScreen text="Carregando seu oráculo..." />;
  }

  return (
    <ImageBackground
      source={require('../assets/images/background.png')}
      resizeMode="cover"
      style={styles.background}
      imageStyle={styles.bgImage}
    >
      <View style={styles.overlay}>
        <View style={styles.topo}>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.75}
            style={styles.botaoTopo}
          >
            <Ionicons name="chevron-back" size={20} color="#E8C27A" />
          </TouchableOpacity>

          <Text style={styles.titulo}>Oráculo Diário</Text>

          <View style={styles.espacoTopo} />
        </View>

        <Text style={styles.statusTexto}>{obterTextoStatus()}</Text>

        <View style={styles.miolo}>
          <View style={styles.areaCentral}>
            {modoEscolha ? (
              <View style={styles.cartasContainer}>
                {opcoesOraculo.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    style={[
                      styles.cartaAnimadaWrapper,
                      index === 1 && styles.cartaMeio,
                      { opacity: opacidadeCartas[index] },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.cartaFechada}
                      activeOpacity={0.85}
                      disabled={animandoEscolha}
                      onPress={() => revelarCarta(item, index)}
                    >
                      <ImageBackground
                        source={item.imagem}
                        style={styles.cartaVerso}
                        resizeMode="cover"
                        imageStyle={styles.cartaFechadaImagem}
                      >
                        <View style={styles.cartaVersoOverlay} />
                      </ImageBackground>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={copiarFrase}
                style={styles.cardContainer}
              >
                <ImageBackground
                  source={require('../assets/images/carta-oraculo_frente.png')}
                  style={styles.carta}
                  resizeMode="cover"
                  imageStyle={styles.cartaImagem}
                >
                  <View style={styles.cartaOverlay}>
                    <View style={styles.areaCentralTexto}>
                      <Text style={styles.fraseNaCarta}>{oraculoAtual.frase}</Text>
                    </View>

                    <View style={styles.rodapeCarta}>
                      {__DEV__ ? (
                        <Text style={styles.fraseId}>#{oraculoAtual.id}</Text>
                      ) : (
                        <View />
                      )}

                      <Ionicons name="copy-outline" size={18} color="#E8C27A" />
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.rodapeNav}>
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.8}
              onPress={iniciarConsulta}
            >
              <View
                style={[
                  styles.iconeNavWrapper,
                  !modoEscolha && !cooldownAtivo && styles.iconeNavAtivo,
                ]}
              >
                <Ionicons
                  name="home-outline"
                  size={22}
                  color={!modoEscolha && !cooldownAtivo ? '#E8C27A' : '#E8D8FF'}
                />
              </View>
              <Text style={styles.navTexto}>Início</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/leituras-salvas' })}
            >
              <View style={styles.iconeNavWrapper}>
                <Ionicons name="bookmark-outline" size={21} color="#E8D8FF" />
              </View>
              <Text style={styles.navTexto}>Salvos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/interpretacao',
                  params: {
                    frase: oraculoAtual.frase,
                    leituraId: String(oraculoAtual.leituraId || ''),
                    cardId: String(oraculoAtual.id),
                  },
                })
              }
            >
              <View style={styles.iconeNavWrapper}>
                <Ionicons
                  name="document-text-outline"
                  size={21}
                  color="#E8D8FF"
                />
              </View>
              <Text style={styles.navTexto}>Interpretação</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  bgImage: {
    opacity: 1,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 78,
    paddingBottom: 34,
    backgroundColor: 'rgba(18, 10, 34, 0.50)',
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  botaoTopo: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  espacoTopo: {
    width: 34,
    height: 34,
  },
  titulo: {
    flex: 1,
    textAlign: 'center',
    fontSize: 30,
    color: '#E8C27A',
    letterSpacing: 0.3,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  statusTexto: {
    textAlign: 'center',
    color: '#F3D7A0',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 10,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  miolo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
  },
  areaCentral: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartasContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartaAnimadaWrapper: {
    width: 92,
    height: 154,
  },
  cartaMeio: {
    marginHorizontal: 12,
    marginTop: -14,
  },
  cartaFechada: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#7B5BBE',
    backgroundColor: '#24153E',
    shadowColor: '#B083FF',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cartaFechadaImagem: {
    borderRadius: 12,
  },
  cartaVerso: {
    flex: 1,
  },
  cartaVersoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 12, 35, 0.10)',
  },
  cardContainer: {
    width: 230,
    height: 382,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#7B5BBE',
    backgroundColor: '#1A1230',
    shadowColor: '#B083FF',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  carta: {
    width: '100%',
    height: '100%',
  },
  cartaImagem: {
    borderRadius: 16,
  },
  cartaOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 20,
    backgroundColor: 'rgba(20, 12, 35, 0.18)',
  },
  areaCentralTexto: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  fraseNaCarta: {
    width: '100%',
    fontSize: 23,
    lineHeight: 34,
    textAlign: 'center',
    color: '#F6E7C1',
    fontFamily: 'PlayfairDisplay_600SemiBold',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    includeFontPadding: false,
  },
  rodapeCarta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fraseId: {
    fontSize: 14,
    color: '#C9A96B',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  rodapeNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    width: '100%',
    marginTop: 18,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 82,
  },
  iconeNavWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(232,194,122,0.35)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconeNavAtivo: {
    backgroundColor: 'rgba(168, 123, 255, 0.16)',
    borderColor: '#D5A85E',
  },
  navTexto: {
    color: '#E8D8FF',
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
});