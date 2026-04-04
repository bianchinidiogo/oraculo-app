import { useFonts, PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { oraculos } from '../data/oraculos';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { LoadingScreen } from '../components/loading-screen';
import OracleSymbol from '../components/OracleSymbol';

const STORAGE_ORACULO = 'oraculo_atual';
const API_URL = 'https://oraculo-vercel.vercel.app/api';

type Oraculo = (typeof oraculos)[number];
type Plano = 'free' | 'premium';
type OraculoSalvo = Oraculo & {
  leituraId?: number | null;
};

type RitualPhase = 'idle' | 'preparing' | 'choosing' | 'revealing';

const HOME_SYMBOL_SIZE = 320;
const STAGE_SYMBOL_SIZE = 160;
const SYMBOL_TOP = '7%';

const CHOICE_DROP_Y = 262;
const SIDE_DROP_Y = 282;
const SIDE_SPREAD_X = 108;

const SELECTED_EXIT_Y = -170;

function buildAnimatedNumber(
  value: Animated.AnimatedInterpolation<string | number> | number,
  fallback = 0
) {
  if (typeof value === 'number') return value;
  try {
    const result = (value as any).__getValue?.();
    return typeof result === 'number' ? result : fallback;
  } catch {
    return fallback;
  }
}

function OracleAnimated({
  size,
  idleValue,
  pulseValue,
  glowValue,
}: {
  size: number;
  idleValue: Animated.Value;
  pulseValue: Animated.Value;
  glowValue: Animated.Value;
}) {
  const wrapperScale = Animated.add(
    idleValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.995, 1.01, 0.995],
    }),
    pulseValue.interpolate({
      inputRange: [0, 0.45, 1],
      outputRange: [0, 0.05, 0.1],
    })
  );

  const raysOpacity = Animated.add(
    idleValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.28, 0.4, 0.28],
    }),
    glowValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.24],
    })
  );

  const circlesScale = Animated.add(
    idleValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.985, 1.008, 0.985],
    }),
    pulseValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.08],
    })
  );

  const circlesOpacity = Animated.add(
    idleValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.82, 0.92, 0.82],
    }),
    glowValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.14],
    })
  );

  const innerGlowScale = Animated.add(
    idleValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.98, 1.02, 0.98],
    }),
    pulseValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.18],
    })
  );

  const innerGlowOpacity = Animated.add(
    idleValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.88, 0.96, 0.88],
    }),
    pulseValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.32],
    })
  );

  const starScale = Animated.add(
    idleValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.995, 1.01, 0.995],
    }),
    pulseValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.12],
    })
  );

  const starOpacity = Animated.add(
    idleValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.84, 0.94, 0.84],
    }),
    glowValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.18],
    })
  );

  return (
    <Animated.View
      style={[
        styles.oracleWrap,
        {
          transform: [{ scale: wrapperScale as any }],
        },
      ]}
    >
      <OracleSymbol
        size={size}
        raysProps={{
          rotation: 0,
          opacity: buildAnimatedNumber(raysOpacity, 0.35),
        }}
        circlesProps={{
          rotation: 0,
          scale: buildAnimatedNumber(circlesScale, 1),
          opacity: buildAnimatedNumber(circlesOpacity, 0.9),
        }}
        innerGlowProps={{
          scale: buildAnimatedNumber(innerGlowScale, 1),
          opacity: buildAnimatedNumber(innerGlowOpacity, 1),
        }}
        starProps={{
          rotation: 0,
          scale: buildAnimatedNumber(starScale, 1),
          opacity: buildAnimatedNumber(starOpacity, 0.9),
        }}
      />
    </Animated.View>
  );
}

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

  const [phase, setPhase] = useState<RitualPhase>('idle');
  const [opcoesOraculo, setOpcoesOraculo] = useState<Oraculo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [inputLocked, setInputLocked] = useState(false);

  const menuTranslateY = useRef(new Animated.Value(0)).current;
  const menuOpacity = useRef(new Animated.Value(1)).current;
  const phraseOpacity = useRef(new Animated.Value(1)).current;

  const splitProgress = useRef(new Animated.Value(0)).current;
  const optionsOpacity = useRef(new Animated.Value(0)).current;
  const optionsFadeOut = useRef(new Animated.Value(0)).current;
  const selectedExitProgress = useRef(new Animated.Value(0)).current;

  const ritualPulse = useRef(new Animated.Value(0)).current;
  const ritualGlow = useRef(new Animated.Value(0)).current;
  const ritualVeil = useRef(new Animated.Value(0)).current;
  const idleBreath = useRef(new Animated.Value(0)).current;

  const hintOpacity = useRef(new Animated.Value(0)).current;
  const hintTranslateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(idleBreath, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(idleBreath, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [idleBreath]);

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

      resetFlow();
      setCooldownAtivo(false);
      setTempoRestante('');
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

  function resetFlow() {
    setPhase('idle');
    setOpcoesOraculo([]);
    setSelectedIndex(null);
    setInputLocked(false);

    menuTranslateY.setValue(0);
    menuOpacity.setValue(1);
    phraseOpacity.setValue(1);

    splitProgress.setValue(0);
    optionsOpacity.setValue(0);
    optionsFadeOut.setValue(0);
    selectedExitProgress.setValue(0);

    ritualPulse.setValue(0);
    ritualGlow.setValue(0);
    ritualVeil.setValue(0);

    hintOpacity.setValue(0);
    hintTranslateY.setValue(10);
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

  function animatePulse(onEnd?: () => void) {
    ritualPulse.setValue(0);
    ritualGlow.setValue(0);
    ritualVeil.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(ritualPulse, {
          toValue: 1,
          duration: 780,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(ritualPulse, {
          toValue: 0,
          duration: 980,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      Animated.sequence([
        Animated.timing(ritualGlow, {
          toValue: 1,
          duration: 540,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(ritualGlow, {
          toValue: 0,
          duration: 1100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
      Animated.sequence([
        Animated.timing(ritualVeil, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(ritualVeil, {
          toValue: 0,
          duration: 1200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) onEnd?.();
    });
  }

  async function iniciarConsulta() {
    if (inputLocked || phase !== 'idle') return;

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

    setInputLocked(true);
    setSelectedIndex(null);
    setPhase('preparing');

    Animated.parallel([
      Animated.timing(menuTranslateY, {
        toValue: 140,
        duration: 520,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(menuOpacity, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(phraseOpacity, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      animatePulse(() => {
        setOpcoesOraculo(tresOpcoes);
        splitProgress.setValue(0);
        optionsOpacity.setValue(0);
        optionsFadeOut.setValue(0);
        selectedExitProgress.setValue(0);
        hintOpacity.setValue(0);
        hintTranslateY.setValue(10);

        Animated.parallel([
          Animated.timing(splitProgress, {
            toValue: 1,
            duration: 950,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(optionsOpacity, {
            toValue: 1,
            duration: 520,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(hintOpacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(hintTranslateY, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          setPhase('choosing');
          setInputLocked(false);
        });
      });
    });
  }

  async function finalizarEscolha(oraculoEscolhido: Oraculo) {
    try {
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
          resetFlow();

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

      setPhase('revealing');

      Animated.parallel([
        Animated.timing(phraseOpacity, {
          toValue: 1,
          duration: 680,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(140),
          Animated.timing(menuTranslateY, {
            toValue: 0,
            duration: 640,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(180),
          Animated.timing(menuOpacity, {
            toValue: 1,
            duration: 560,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setOpcoesOraculo([]);
        setSelectedIndex(null);
        setPhase('idle');
        setInputLocked(false);

        splitProgress.setValue(0);
        optionsOpacity.setValue(0);
        optionsFadeOut.setValue(0);
        selectedExitProgress.setValue(0);
        hintOpacity.setValue(0);
        hintTranslateY.setValue(10);
      });
    } catch (error: any) {
      console.log('Erro ao registrar leitura:', error);
      resetFlow();

      Alert.alert(
        'Erro',
        error?.message || 'Não foi possível registrar sua leitura.'
      );
    }
  }

  async function escolherSimbolo(
    oraculoEscolhido: Oraculo,
    indiceEscolhido: number
  ) {
    if (inputLocked || phase !== 'choosing') return;

    setInputLocked(true);
    setSelectedIndex(indiceEscolhido);

    Animated.parallel([
      Animated.timing(hintOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(hintTranslateY, {
        toValue: 12,
        duration: 300,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(optionsFadeOut, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      selectedExitProgress.setValue(0);

      Animated.parallel([
        Animated.timing(selectedExitProgress, {
          toValue: 1,
          duration: 720,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(80),
          Animated.timing(ritualGlow, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(ritualGlow, {
            toValue: 0.35,
            duration: 260,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
      ]).start(() => {
        animatePulse(() => {
          finalizarEscolha(oraculoEscolhido);
        });
      });
    });
  }

  function renderIndicadoresLeitura() {
    return (
      <View style={styles.indicadoresWrap}>
        {Array.from({ length: maxLeiturasHoje }).map((_, index) => {
          const preenchida = index < leiturasHoje;
          return (
            <View
              key={`dot-${index}`}
              style={[
                styles.indicador,
                preenchida && styles.indicadorPreenchido,
              ]}
            />
          );
        })}
      </View>
    );
  }

  const glowScale = ritualGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 2.1],
  });

  const choiceBaseScale = splitProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  const choiceYCenter = splitProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, CHOICE_DROP_Y],
  });

  const choiceYSide = splitProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, SIDE_DROP_Y],
  });

  if (!fontsLoaded || carregando) {
    return <LoadingScreen text="Carregando seu oráculo..." />;
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.videoVeil,
          {
            opacity: ritualVeil.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 0.7],
            }),
          },
        ]}
      />

      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={styles.botaoTopo}
            disabled={inputLocked}
          >
            <Ionicons name="chevron-back" size={16} color="#F4D7A2" />
          </TouchableOpacity>

          {renderIndicadoresLeitura()}

          <View style={styles.topSpacer} />
        </View>

        <View style={styles.miolo}>
          <View style={styles.simboloCentral} pointerEvents="none">
            <Animated.View
              style={[
                styles.transitionGlow,
                {
                  opacity: ritualGlow,
                  transform: [{ scale: glowScale }],
                },
              ]}
            />

            <OracleAnimated
              size={HOME_SYMBOL_SIZE}
              idleValue={idleBreath}
              pulseValue={ritualPulse}
              glowValue={ritualGlow}
            />
          </View>

          {opcoesOraculo.length > 0 && (
            <View style={styles.choicesLayer} pointerEvents="box-none">
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.choiceHint,
                  {
                    opacity: hintOpacity,
                    transform: [{ translateY: hintTranslateY }],
                  },
                ]}
              >
                faça sua escolha
              </Animated.Text>

              {opcoesOraculo.map((item, index) => {
                const isCenter = index === 1;
                const baseX =
                  index === 0 ? -SIDE_SPREAD_X : index === 2 ? SIDE_SPREAD_X : 0;
                const translateY = isCenter ? choiceYCenter : choiceYSide;

                const isSelected = selectedIndex === index;
                const isUnselected =
                  selectedIndex !== null && selectedIndex !== index;

                const fadeBySelection = isUnselected
                  ? optionsFadeOut.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    })
                  : isSelected
                    ? selectedExitProgress.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [1, 0.92, 0],
                      })
                    : 1;

                const exitTranslateY = isSelected
                  ? selectedExitProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, SELECTED_EXIT_Y],
                    })
                  : 0;

                const exitTranslateX = isSelected
                  ? selectedExitProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [baseX, 0],
                    })
                  : baseX;

                const selectedScale = isSelected
                  ? selectedExitProgress.interpolate({
                      inputRange: [0, 0.7, 1],
                      outputRange: [1, 0.96, 0.82],
                    })
                  : 1;

                return (
                  <Animated.View
                    key={item.id}
                    style={[
                      styles.choiceSymbolWrap,
                      {
                        opacity: Animated.multiply(optionsOpacity, fadeBySelection as any),
                        transform: [
                          { translateX: exitTranslateX as any },
                          { translateY: translateY as any },
                          { translateY: exitTranslateY as any },
                          { scale: choiceBaseScale as any },
                          { scale: selectedScale as any },
                        ],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => escolherSimbolo(item, index)}
                      disabled={inputLocked || phase !== 'choosing'}
                      style={styles.choiceTouch}
                    >
                      <OracleAnimated
                        size={STAGE_SYMBOL_SIZE}
                        idleValue={idleBreath}
                        pulseValue={ritualPulse}
                        glowValue={ritualGlow}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}

          <Animated.View style={[styles.fraseContainer, { opacity: phraseOpacity }]}>
            <View style={styles.fraseTextoWrap}>
              <Text style={styles.frasePrincipal}>{oraculoAtual.frase}</Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.rodapeNav,
              {
                opacity: menuOpacity,
                transform: [{ translateY: menuTranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.85}
              onPress={iniciarConsulta}
              disabled={inputLocked}
            >
              <View
                style={[
                  styles.iconeNavWrapper,
                  phase === 'idle' && !cooldownAtivo && styles.iconeNavAtivo,
                ]}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={16}
                  color={phase === 'idle' && !cooldownAtivo ? '#221104' : '#F4D7A2'}
                />
              </View>
              <Text style={styles.navTexto}>Leitura</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/leituras-salvas' })}
              disabled={inputLocked}
            >
              <View style={styles.iconeNavWrapper}>
                <Ionicons name="bookmark-outline" size={16} color="#F4D7A2" />
              </View>
              <Text style={styles.navTexto}>Salvos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.85}
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
              disabled={inputLocked}
            >
              <View style={styles.iconeNavWrapper}>
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color="#F4D7A2"
                />
              </View>
              <Text style={styles.navTexto}>Interpretar</Text>
            </TouchableOpacity>
          </Animated.View>
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
    backgroundColor: 'rgba(6, 13, 22, 0)',
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 28,
    backgroundColor: 'rgba(22, 21, 6, 0.18)',
  },
  topBar: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  botaoTopo: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 215, 162, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(244, 215, 162, 0.28)',
  },
  topSpacer: {
    width: 28,
    height: 28,
  },
  indicadoresWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  indicador: {
    width: 9,
    height: 9,
    borderRadius: 999,
    borderWidth: 1.1,
    borderColor: 'rgba(244, 215, 162, 0.60)',
    backgroundColor: 'transparent',
  },
  indicadorPreenchido: {
    backgroundColor: '#F4D7A2',
    borderColor: '#F4D7A2',
    shadowColor: '#F4D7A2',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  miolo: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simboloCentral: {
    position: 'absolute',
    top: SYMBOL_TOP,
    left: '50%',
    marginLeft: -(HOME_SYMBOL_SIZE / 2),
    width: HOME_SYMBOL_SIZE,
    height: HOME_SYMBOL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  oracleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitionGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(244, 215, 162, 0.18)',
    shadowColor: '#F4D7A2',
    shadowOpacity: 0.52,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 0 },
  },
  choicesLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 2,
  },
  choiceHint: {
    position: 'absolute',
    top: 320,
    alignSelf: 'center',
    color: '#eef8ff',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'lowercase',
    zIndex: 10,
    textShadowColor: 'rgba(238,248,255,0.28)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  choiceSymbolWrap: {
    position: 'absolute',
    top: SYMBOL_TOP,
    left: '50%',
    marginLeft: -(STAGE_SYMBOL_SIZE / 2),
    width: STAGE_SYMBOL_SIZE,
    height: STAGE_SYMBOL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceTouch: {
    width: STAGE_SYMBOL_SIZE,
    height: STAGE_SYMBOL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fraseContainer: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 210,
    zIndex: 1,
  },
  fraseTextoWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frasePrincipal: {
    fontSize: 30,
    lineHeight: 42,
    textAlign: 'center',
    color: '#F6E7C1',
    fontFamily: 'PlayfairDisplay_600SemiBold',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
    includeFontPadding: false,
  },
  rodapeNav: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 40,
    zIndex: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 68,
  },
  iconeNavWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(244, 215, 162, 0.34)',
    backgroundColor: 'rgba(244, 215, 162, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconeNavAtivo: {
    backgroundColor: '#F4D7A2',
    borderColor: '#F4D7A2',
    shadowColor: '#F4D7A2',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  navTexto: {
    color: '#F4D7A2',
    fontSize: 13,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
});