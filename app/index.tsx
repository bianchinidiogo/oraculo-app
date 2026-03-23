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

const STORAGE_ORACULO = 'oraculo_atual';
const API_URL = 'https://oraculo-vercel.vercel.app/api';

type Oraculo = (typeof oraculos)[number];

export default function HomeScreen() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
  });

  const [oraculoAtual, setOraculoAtual] = useState<Oraculo>(oraculos[0]);
  const [cooldownAtivo, setCooldownAtivo] = useState(false);
  const [tempoRestante, setTempoRestante] = useState('');
  const [carregando, setCarregando] = useState(true);

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
        setCooldownAtivo(!!data?.leituraRealizadaHoje);
        setTempoRestante(data?.leituraRealizadaHoje ? 'disponível amanhã' : '');
      } else {
        setCooldownAtivo(false);
        setTempoRestante('');
      }
    } catch (error) {
      console.log('Erro ao carregar dados do oráculo:', error);
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

    if (cooldownAtivo) {
      Alert.alert(
        'Consulta já realizada',
        'Você já consultou seu oráculo hoje. Uma nova consulta estará disponível amanhã.'
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
              setCooldownAtivo(true);
              setTempoRestante('disponível amanhã');
              setAnimandoEscolha(false);

              Alert.alert(
                'Consulta já realizada',
                data?.error || 'Você já consultou seu oráculo hoje.'
              );
              return;
            }

            throw new Error(data?.error || 'Erro ao registrar leitura.');
          }

          setOraculoAtual(oraculoEscolhido);
          setModoEscolha(false);
          setOpcoesOraculo([]);
          setCooldownAtivo(true);
          setTempoRestante('disponível amanhã');
          setAnimandoEscolha(false);

          await AsyncStorage.setItem(
            STORAGE_ORACULO,
            JSON.stringify(oraculoEscolhido)
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

  if (!fontsLoaded || carregando) {
    return null;
  }

  return (
    <ImageBackground
      source={require('../assets/images/background.png')}
      resizeMode="cover"
      style={styles.background}
      imageStyle={styles.bgImage}
    >
      <View style={styles.overlay}>
        <Text style={styles.titulo}>Oráculo Diário</Text>

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

                  <Ionicons
                    name="copy-outline"
                    size={18}
                    color="#E8C27A"
                  />
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.botaoPrincipal,
            cooldownAtivo && !modoEscolha && styles.botaoDesativado,
          ]}
          onPress={iniciarConsulta}
          activeOpacity={cooldownAtivo ? 1 : 0.8}
        >
          <Text style={styles.textoBotaoPrincipal}>
            {modoEscolha
              ? 'Escolha sua carta'
              : cooldownAtivo
              ? 'Consulta realizada hoje'
              : 'Consultar'}
          </Text>
        </TouchableOpacity>

        {!modoEscolha && (
          <TouchableOpacity
            style={styles.botaoInterpretar}
            onPress={() =>
              router.push({
                pathname: '/interpretacao',
                params: {
                  frase: oraculoAtual.frase,
                  id: String(oraculoAtual.id),
                },
              })
            }
            activeOpacity={0.85}
          >
            <Text style={styles.textoBotaoInterpretar}>Interpretar</Text>
          </TouchableOpacity>
        )}
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: '#1a12308f',
  },
  titulo: {
    fontSize: 34,
    color: '#E8C27A',
    marginBottom: 24,
    letterSpacing: 0.5,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  cartasContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  cartaAnimadaWrapper: {
    width: 96,
    height: 160,
  },
  cartaFechada: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#7B5BBE',
    backgroundColor: '#24153E',
    shadowColor: '#B083FF',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cartaFechadaImagem: {
    borderRadius: 20,
  },
  cartaMeio: {
    marginHorizontal: 14,
    marginTop: -18,
  },
  cartaVerso: {
    flex: 1,
  },
  cartaVersoOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 12, 35, 0.1)',
  },
  cardContainer: {
    width: 205,
    height: 340,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 2,
    borderColor: '#7B5BBE',
    backgroundColor: '#1A1230',
    shadowColor: '#B083FF',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  carta: {
    width: '100%',
    height: '100%',
  },
  cartaImagem: {
    borderRadius: 24,
  },
  cartaOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 22,
    backgroundColor: 'rgba(20, 12, 35, 0.24)',
  },
  areaCentralTexto: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  fraseNaCarta: {
    width: '100%',
    fontSize: 22,
    lineHeight: 30,
    textAlign: 'center',
    color: '#F6E7C1',
    fontFamily: 'PlayfairDisplay_600SemiBold',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    includeFontPadding: false,
    flexWrap: 'wrap',
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
  botaoPrincipal: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#3C235A',
    borderWidth: 1.5,
    borderColor: '#D5A85E',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 14,
  },
  botaoDesativado: {
    opacity: 0.55,
  },
  textoBotaoPrincipal: {
    color: '#F1C97A',
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  botaoInterpretar: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.2,
    borderColor: '#B892FF',
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 14,
  },
  textoBotaoInterpretar: {
    color: '#E8D8FF',
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
});