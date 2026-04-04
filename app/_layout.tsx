import { Stack, router, useSegments } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { DeviceMotion } from 'expo-sensors';
import { supabase } from '../lib/supabase';
import { LoadingScreen } from '../components/loading-screen';

const MAX_TILT = 1;

// profundidade do parallax
const PARALLAX_BACK = 4;
const PARALLAX_MID = 14;
const PARALLAX_FRONT = 30;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export default function RootLayout() {
  const segments = useSegments();

  const [authResolved, setAuthResolved] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const backX = useRef(new Animated.Value(0)).current;
  const backY = useRef(new Animated.Value(0)).current;

  const midX = useRef(new Animated.Value(0)).current;
  const midY = useRef(new Animated.Value(0)).current;

  const frontX = useRef(new Animated.Value(0)).current;
  const frontY = useRef(new Animated.Value(0)).current;

  const motionAnimation = useRef<Animated.CompositeAnimation | null>(null);

  const imageSources = useMemo(
    () => ({
      back: require('../assets/images/bg-layer-back.png'),
      mid: require('../assets/images/bg-layer-mid.png'),
      front: require('../assets/images/bg-layer-front.png'),
    }),
    []
  );

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

  useEffect(() => {
    if (Platform.OS === 'web') return;

    DeviceMotion.setUpdateInterval(50);

    const subscription = DeviceMotion.addListener((motion) => {
      const beta = motion.rotation?.beta ?? 0;
      const gamma = motion.rotation?.gamma ?? 0;

      const nx = clamp(gamma / MAX_TILT, -1, 1);
      const ny = clamp(beta / MAX_TILT, -1, 1);

      motionAnimation.current?.stop();

      motionAnimation.current = Animated.parallel([
        Animated.timing(backX, {
          toValue: nx * PARALLAX_BACK,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(backY, {
          toValue: ny * PARALLAX_BACK,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),

        Animated.timing(midX, {
          toValue: nx * PARALLAX_MID,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(midY, {
          toValue: ny * PARALLAX_MID,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),

        Animated.timing(frontX, {
          toValue: nx * PARALLAX_FRONT,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(frontY, {
          toValue: ny * PARALLAX_FRONT,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]);

      motionAnimation.current.start();
    });

    return () => {
      subscription.remove();
      motionAnimation.current?.stop();
    };
  }, [backX, backY, midX, midY, frontX, frontY]);

  if (!authResolved) {
    return <LoadingScreen text="Verificando sua conta..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundLayer} pointerEvents="none">
        {/* BACK */}
        <Animated.View
          style={[
            styles.absoluteFill,
            styles.isolatedLayer,
            { transform: [{ translateX: backX }, { translateY: backY }] },
          ]}
        >
          <Image
            source={imageSources.back}
            style={[styles.imageFar, { opacity: 1 }]}
            contentFit="cover"
          />
        </Animated.View>

        {/* MID */}
        <Animated.View
          style={[
            styles.absoluteFill,
            styles.isolatedLayer,
            { transform: [{ translateX: midX }, { translateY: midY }] },
          ]}
        >
          <Image
            source={imageSources.mid}
            style={[styles.imageMid, { opacity: 0.5 }]}
            contentFit="cover"
          />

          <View
            style={[
              styles.colorOverlay,
              {
                backgroundColor: 'rgba(29, 155, 177, 0)',
                mixBlendMode: 'screen',
              },
            ]}
          />
        </Animated.View>

        {/* FRONT */}
        <Animated.View
          style={[
            styles.absoluteFill,
            styles.isolatedLayer,
            { transform: [{ translateX: frontX }, { translateY: frontY }] },
          ]}
        >
          <Image
            source={imageSources.front}
            style={[styles.imageNear, { opacity: 0.4 }]}
            contentFit="cover"
          />

          <View
            style={[
              styles.colorOverlay,
              {
                backgroundColor: 'rgba(6, 54, 68, 0)',
                mixBlendMode: 'screen',
              },
            ]}
          />
        </Animated.View>

        <View style={styles.tint} />
      </View>

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02040A',
  },

  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#02040A',
  },

  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },

  isolatedLayer: {
    isolation: 'isolate',
  },

  colorOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  imageFar: {
    width: '114%',
    height: '114%',
    marginLeft: '-7%',
    marginTop: '-7%',
  },

  imageMid: {
    width: '124%',
    height: '124%',
    marginLeft: '-12%',
    marginTop: '-12%',
  },

  imageNear: {
    width: '140%',
    height: '140%',
    marginLeft: '-20%',
    marginTop: '-20%',
  },

  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 10, 24, 0.22)',
  },
});