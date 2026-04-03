import { Stack, router, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { supabase } from '../lib/supabase';
import { LoadingScreen } from '../components/loading-screen';

export default function RootLayout() {
  const segments = useSegments();

  const [authResolved, setAuthResolved] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const player = useVideoPlayer(require('../assets/videos/oraculo-bg.mp4'));

  // 🎥 vídeo sempre rodando
  useEffect(() => {
    player.loop = true;
    player.muted = true;
    player.play();
  }, [player]);

  // 🔐 checagem inicial de auth
  useEffect(() => {
    let mounted = true;

    async function bootstrapAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setIsAuthenticated(!!session?.user);
      setAuthResolved(true);
    }

    bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
      setAuthResolved(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 🚪 controle de acesso
  useEffect(() => {
    if (!authResolved) return;

    const currentRoute = segments[0];
    const inLogin = currentRoute === 'login';

    if (!isAuthenticated && !inLogin) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && inLogin) {
      router.replace('/');
    }
  }, [authResolved, isAuthenticated, segments]);

  // ⏳ loading inicial
  if (!authResolved) {
    return <LoadingScreen text="Verificando sua conta..." />;
  }

  return (
    <View style={styles.container}>
      {/* 🎥 FUNDO GLOBAL */}
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

      {/* 📱 ROTAS */}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: 'transparent', // 🔥 MUITO IMPORTANTE
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