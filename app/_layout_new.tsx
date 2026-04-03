import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { supabase } from '../lib/supabase';

const DEV_DEMO_MODE = __DEV__ && false;

const mockSession = {
  access_token: 'dev-access-token',
  refresh_token: 'dev-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: {
    id: 'dev-user-id',
    email: 'demo@oraculo.app',
    app_metadata: {},
    user_metadata: { name: 'Demo User' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
};

const mockLeituras = [
  {
    id: 1,
    leitura_id: 101,
    frase: 'Confie no silêncio antes da resposta.',
    area: 'Espiritualidade',
    interpretacao:
      'Há um chamado para desacelerar e perceber sinais sutis. Nem toda resposta vem em forma de ação imediata.',
    card_id: '7',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    leitura_id: 102,
    frase: 'A porta certa se abre quando você para de forçar.',
    area: 'Trabalho',
    interpretacao:
      'Seu caminho profissional pede mais alinhamento do que esforço bruto. Observe o que flui com menos resistência.',
    card_id: '12',
    created_at: new Date().toISOString(),
  },
];

function jsonResponse(body: any, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

function installDemoMode() {
  if (!DEV_DEMO_MODE) return;

  const auth = supabase.auth as any;

  auth.getSession = async () => ({
    data: { session: mockSession },
    error: null,
  });

  auth.signInWithPassword = async () => ({
    data: { session: mockSession, user: mockSession.user },
    error: null,
  });

  auth.signUp = async () => ({
    data: { session: mockSession, user: mockSession.user },
    error: null,
  });

  auth.signOut = async () => ({
    error: null,
  });

  const originalFetch = global.fetch.bind(global);

  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (!url.includes('oraculo-vercel.vercel.app/api')) {
      return originalFetch(input, init);
    }

    if (url.includes('/status-diario')) {
      return jsonResponse({
        plano: 'premium',
        leiturasHoje: 1,
        maxLeiturasHoje: 3,
        leiturasRestantes: 2,
        interpretacaoRealizadaHoje: false,
        areasUsadasHoje: [],
        areasDisponiveisHoje: [
          'Amor',
          'Trabalho',
          'Dinheiro',
          'Família',
          'Espiritualidade',
          'Saúde',
          'Propósito',
        ],
      });
    }

    if (url.includes('/registrar-leitura')) {
      return jsonResponse({
        plano: 'premium',
        leitura: { id: 999 },
        leiturasHoje: 1,
        maxLeiturasHoje: 3,
        leiturasRestantes: 2,
      });
    }

    if (url.includes('/interpretar')) {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      const area = body?.area || 'Propósito';
      const frase = body?.frase || 'Mensagem do oráculo';

      return jsonResponse({
        plano: 'premium',
        interpretacao:
          `Esta é uma interpretação simulada para a área de ${area}. ` +
          `A mensagem "${frase}" sugere um momento de percepção, pausa e alinhamento interior. ` +
          `Use este texto apenas para validar layout, espaçamento e experiência visual no Expo Go.`,
        areasUsadasHoje: [area],
        areasDisponiveisHoje: [
          'Amor',
          'Trabalho',
          'Dinheiro',
          'Família',
          'Espiritualidade',
          'Saúde',
          'Propósito',
        ].filter(item => item !== area),
      });
    }

    if (url.includes('/favoritar-leitura')) {
      return jsonResponse({
        jaFavoritada: false,
        mensagem: 'Sua leitura foi salva com sucesso.',
      });
    }

    if (url.includes('/listar-leituras-salvas')) {
      return jsonResponse({
        leituras: mockLeituras,
      });
    }

    if (url.includes('/remover-leitura-salva')) {
      return jsonResponse({
        success: true,
      });
    }

    return jsonResponse({ error: 'Endpoint mockado não implementado.' }, 404);
  };
}

export default function RootLayout() {
  const player = useVideoPlayer(require('../assets/videos/oraculo-bg.mp4'));

  useEffect(() => {
    installDemoMode();
  }, []);

  useEffect(() => {
    player.loop = true;
    player.muted = true;
    player.play();
  }, [player]);

  return (
    <View style={styles.container}>
      <View style={styles.videoLayer} pointerEvents="none">
        <VideoView
          style={styles.video}
          player={player}
          contentFit="cover"
          nativeControls={false}
          surfaceType="textureView"
          useExoShutter={false}
        />
      </View>

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: 'rgba(13, 6, 22, 0.62)',
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});