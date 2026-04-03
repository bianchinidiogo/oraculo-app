import { useFonts, PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { LoadingScreen } from '../components/loading-screen';

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

export default function LeiturasSalvasScreen() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
  });

  const [carregando, setCarregando] = useState(true);
  const [leituras, setLeituras] = useState<LeituraSalva[]>([]);

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

          <Text style={styles.titulo}>Leituras Salvas</Text>

          {leituras.length === 0 ? (
            <View style={styles.cardVazio}>
              <Text style={styles.textoVazio}>
                Você ainda não salvou nenhuma leitura.
              </Text>
            </View>
          ) : (
            leituras.map(item => (
              <View key={item.id} style={styles.cardLeitura}>
                <Text style={styles.rotulo}>Mensagem</Text>
                <Text style={styles.frase}>{item.frase}</Text>

                {!!item.area && (
                  <View style={styles.linhaInfo}>
                    <Text style={styles.infoTexto}>Área: {item.area}</Text>
                  </View>
                )}

                {!!item.created_at && (
                  <View style={styles.linhaInfo}>
                    <Text style={styles.infoTexto}>
                      Salva em: {formatarDataHora(item.created_at)}
                    </Text>
                  </View>
                )}

                {!!item.interpretacao && (
                  <View style={styles.cardInterpretacaoMini}>
                    <Text style={styles.rotulo}>Interpretação salva</Text>
                    <Text style={styles.textoInterpretacaoMini}>
                      {item.interpretacao}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.botaoAbrir}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: '/interpretacao',
                      params: {
                        frase: item.frase,
                        leituraId: String(item.leitura_id),
                        cardId: String(item.card_id || ''),
                      },
                    })
                  }
                >
                  <Text style={styles.textoBotaoAbrir}>
                    Interpretar novamente
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoRemover}
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
                          onPress: () => removerLeitura(item.id),
                        },
                      ]
                    );
                  }}
                >
                  <Text style={styles.textoBotaoRemover}>Remover</Text>
                </TouchableOpacity>
              </View>
            ))
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
    marginBottom: 22,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  cardVazio: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(232,194,122,0.22)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  textoVazio: {
    color: '#E8D8FF',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  cardLeitura: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(232,194,122,0.22)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
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
    marginBottom: 14,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  linhaInfo: {
    marginBottom: 10,
  },
  infoTexto: {
    color: '#BFA7E8',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  cardInterpretacaoMini: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(184,146,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    marginTop: 6,
  },
  textoInterpretacaoMini: {
    color: '#F2E8FF',
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  botaoAbrir: {
    width: '100%',
    backgroundColor: '#3C235A',
    borderWidth: 1.2,
    borderColor: '#D5A85E',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  textoBotaoAbrir: {
    color: '#F1C97A',
    fontSize: 17,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  botaoRemover: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.2,
    borderColor: '#FF7A7A',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 10,
  },
  textoBotaoRemover: {
    color: '#FF9A9A',
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
});