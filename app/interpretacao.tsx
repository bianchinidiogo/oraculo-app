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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const STORAGE_INTERPRETACAO_DIA = 'oraculo_interpretacao_dia';

// TROQUE PELO IP DO SEU COMPUTADOR NA MESMA REDE WIFI
const API_URL = 'https://oraculo-vercel.vercel.app/api';

const AREAS_DA_VIDA = [
  'Amor',
  'Trabalho',
  'Dinheiro',
  'Família',
  'Espiritualidade',
  'Saúde',
  'Propósito',
];

export default function InterpretacaoScreen() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
  });

  const { frase, id } = useLocalSearchParams<{
    frase?: string;
    id?: string;
  }>();

  const [areaSelecionada, setAreaSelecionada] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [interpretacao, setInterpretacao] = useState('');
  const [bloqueadoHoje, setBloqueadoHoje] = useState(false);

  useEffect(() => {
    verificarLimiteDiario();
  }, []);

  function obterDataLocal() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  async function verificarLimiteDiario() {
    try {
      const hoje = obterDataLocal();
      const ultimaInterpretacao = await AsyncStorage.getItem(STORAGE_INTERPRETACAO_DIA);
      setBloqueadoHoje(ultimaInterpretacao === hoje);
    } catch (error) {
      console.log('Erro ao verificar interpretação diária:', error);
    }
  }

  async function resetarCooldownInterpretacao() {
    try {
      await AsyncStorage.removeItem(STORAGE_INTERPRETACAO_DIA);
      setBloqueadoHoje(false);
      setInterpretacao('');

      Alert.alert('Modo Dev', 'Cooldown da interpretação resetado com sucesso.');
    } catch (error) {
      console.log('Erro ao resetar cooldown da interpretação:', error);
      Alert.alert('Erro', 'Não foi possível resetar o cooldown.');
    }
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

    if (bloqueadoHoje) {
      Alert.alert(
        'Limite diário',
        'Você já fez sua interpretação de hoje. Volte amanhã.'
      );
      return;
    }

    setCarregando(true);

    try {
      const endpoint = `${API_URL}/interpretar`;

      console.log('Chamando endpoint:', endpoint);
      console.log('Payload:', {
        frase,
        area: areaSelecionada,
        cardId: id,
        userId: 'usuario-teste-1',
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frase,
          area: areaSelecionada,
          cardId: id,
          userId: 'usuario-teste-1',
        }),
      });

      const data = await response.json();

      console.log('Status da API:', response.status);
      console.log('Resposta da API:', data);

      if (!response.ok) {
        if (response.status === 429) {
          Alert.alert(
            'Limite diário',
            data?.error || 'Você já fez sua interpretação de hoje.'
          );
          return;
        }

        throw new Error(data?.error || 'Erro ao interpretar');
      }

      if (!data?.interpretacao) {
        throw new Error('A API respondeu sem interpretação.');
      }

      setInterpretacao(data.interpretacao);

      const hoje = obterDataLocal();
      await AsyncStorage.setItem(STORAGE_INTERPRETACAO_DIA, hoje);
      setBloqueadoHoje(true);
    } catch (error: any) {
      console.log('Erro ao gerar interpretação:', error);

      Alert.alert(
        'Erro de conexão',
        error?.message ||
          'Não foi possível conectar ao servidor. Verifique o IP da API e se o celular está na mesma rede Wi-Fi do computador.'
      );
    } finally {
      setCarregando(false);
    }
  }

  if (!fontsLoaded) {
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

          <Text style={styles.subtitulo}>Escolha uma área da vida</Text>

          <View style={styles.areasContainer}>
            {AREAS_DA_VIDA.map(area => {
              const selecionada = areaSelecionada === area;

              return (
                <TouchableOpacity
                  key={area}
                  style={[
                    styles.botaoArea,
                    selecionada && styles.botaoAreaSelecionada,
                  ]}
                  onPress={() => setAreaSelecionada(area)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.textoArea,
                      selecionada && styles.textoAreaSelecionada,
                    ]}
                  >
                    {area}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.botaoPrincipal,
              (carregando || bloqueadoHoje) && styles.botaoDesativado,
            ]}
            onPress={gerarInterpretacao}
            disabled={carregando || bloqueadoHoje}
            activeOpacity={0.85}
          >
            <Text style={styles.textoBotaoPrincipal}>
              {bloqueadoHoje
                ? 'Interpretação já realizada hoje'
                : carregando
                ? 'Interpretando...'
                : 'Gerar interpretação'}
            </Text>
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity
              style={styles.botaoDev}
              onPress={resetarCooldownInterpretacao}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={18} color="#1a1230" />
              <Text style={styles.textoBotaoDev}>Resetar cooldown</Text>
            </TouchableOpacity>
          )}

          {carregando && (
            <ActivityIndicator
              size="large"
              color="#E8C27A"
              style={styles.loader}
            />
          )}

          {!!interpretacao && (
            <View style={styles.cardInterpretacao}>
              <Text style={styles.rotulo}>Leitura simbólica</Text>
              <Text style={styles.textoInterpretacao}>{interpretacao}</Text>
            </View>
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
    borderColor: 'rgba(232,194,122,0.28)',
  },
  titulo: {
    fontSize: 32,
    color: '#E8C27A',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  cardFrase: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(232,194,122,0.35)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  rotulo: {
    fontSize: 14,
    color: '#C9A96B',
    marginBottom: 10,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  frase: {
    fontSize: 24,
    lineHeight: 34,
    color: '#F6E7C1',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  subtitulo: {
    fontSize: 20,
    color: '#F6E7C1',
    marginBottom: 14,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  areasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  botaoArea: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#7B5BBE',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  botaoAreaSelecionada: {
    backgroundColor: '#4B2B75',
    borderColor: '#E8C27A',
  },
  textoArea: {
    color: '#F6E7C1',
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  textoAreaSelecionada: {
    color: '#F1C97A',
  },
  botaoPrincipal: {
    width: '100%',
    backgroundColor: '#3C235A',
    borderWidth: 1.5,
    borderColor: '#D5A85E',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 12,
  },
  botaoDesativado: {
    opacity: 0.55,
  },
  textoBotaoPrincipal: {
    color: '#F1C97A',
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  botaoDev: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8C27A',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    marginBottom: 8,
  },
  textoBotaoDev: {
    color: '#1a1230',
    fontSize: 15,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  loader: {
    marginTop: 20,
  },
  cardInterpretacao: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232,194,122,0.35)',
    padding: 18,
  },
  textoInterpretacao: {
    fontSize: 18,
    lineHeight: 30,
    color: '#F6E7C1',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
});