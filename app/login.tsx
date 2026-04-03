import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import Svg, {
  Circle,
  Defs,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const player = useVideoPlayer(require('../assets/videos/oraculo-bg.mp4'));

  useEffect(() => {
    player.loop = true;
    player.muted = true;
    player.play();
  }, [player]);

  useEvent(player, 'statusChange', {
    status: player.status,
  });

  async function createSessionFromUrl(url: string) {
    const { params, errorCode } = QueryParams.getQueryParams(url);

    console.log('OAUTH URL RETORNO:', url);
    console.log('OAUTH PARAMS:', params);
    console.log('OAUTH ERROR CODE:', errorCode);

    if (errorCode) {
      throw new Error(errorCode);
    }

    const access_token =
      typeof params.access_token === 'string' ? params.access_token : undefined;
    const refresh_token =
      typeof params.refresh_token === 'string' ? params.refresh_token : undefined;

    if (!access_token || !refresh_token) {
      throw new Error('Tokens não encontrados no retorno do OAuth.');
    }

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    console.log('SET SESSION DATA:', data);
    console.log('SET SESSION ERROR:', error);

    if (error) {
      throw error;
    }

    return data.session;
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha email e senha');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        Alert.alert('Erro', error.message);
        return;
      }

      router.replace('/');
    } catch (err: any) {
      console.log('ERRO LOGIN:', err);
      Alert.alert('Erro', err?.message || 'Falha ao realizar login.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup() {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha email e senha');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        Alert.alert('Erro', error.message);
        return;
      }

      if (data?.session) {
        router.replace('/');
        return;
      }

      Alert.alert('Conta criada', 'Verifique seu email para confirmar.');
    } catch (err: any) {
      console.log('ERRO SIGNUP:', err);
      Alert.alert('Erro', err?.message || 'Falha ao criar conta.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setLoading(true);

      const redirectTo = makeRedirectUri({
        scheme: 'oraculoapp',
      });

      console.log('REDIRECT TO:', redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      console.log('OAUTH DATA:', data);
      console.log('OAUTH ERROR:', error);

      if (error) {
        Alert.alert('Erro', error.message);
        return;
      }

      if (!data?.url) {
        Alert.alert('Erro', 'URL de autenticação não recebida.');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      console.log('RESULT GOOGLE AUTH:', result);

      if (result.type !== 'success' || !result.url) {
        Alert.alert('Aviso', 'Login com Google foi cancelado ou não concluído.');
        return;
      }

      const session = await createSessionFromUrl(result.url);

      console.log('SESSION APOS GOOGLE:', session);
      console.log('ACCESS TOKEN APOS GOOGLE:', session?.access_token);

      if (!session?.access_token) {
        Alert.alert('Erro', 'Sessão não criada corretamente.');
        return;
      }

      router.replace('/');
    } catch (err: any) {
      console.log('ERRO GERAL GOOGLE LOGIN:', err);
      Alert.alert('Erro', err?.message || 'Falha ao entrar com Google.');
    } finally {
      setLoading(false);
    }
  }

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

      <View style={styles.videoVeil} />

      <View style={styles.glowLayer} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <RadialGradient id="bgGlow" cx="50%" cy="34%" r="75%">
              <Stop offset="0%" stopColor="#13385b" stopOpacity="0.22" />
              <Stop offset="40%" stopColor="#0b1f38" stopOpacity="0.18" />
              <Stop offset="100%" stopColor="#040916" stopOpacity="0.92" />
            </RadialGradient>

            <RadialGradient id="goldGlow" cx="50%" cy="50%" r="55%">
              <Stop offset="0%" stopColor="#f5dbab" stopOpacity="0.22" />
              <Stop offset="40%" stopColor="#eebe66" stopOpacity="0.10" />
              <Stop offset="100%" stopColor="#ffdfa4" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Rect width="100%" height="100%" fill="url(#bgGlow)" />
          <Circle cx="50%" cy="28%" r="120" fill="url(#goldGlow)" />
        </Svg>
      </View>

      <View style={styles.content}>
        <View style={styles.symbolWrap} pointerEvents="none">
          <Svg width={140} height={140}>
            <Defs>
              <RadialGradient id="symbolCore" cx="50%" cy="50%" r="60%">
                <Stop offset="0%" stopColor="#805c19" stopOpacity="1" />
                <Stop offset="28%" stopColor="#f5dbab" stopOpacity="0.96" />
                <Stop offset="58%" stopColor="#eebe66" stopOpacity="0.32" />
                <Stop offset="100%" stopColor="#ffdfa4" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            <Circle
              cx={70}
              cy={70}
              r={54}
              fill="none"
              stroke="#ffcd93"
              strokeOpacity={0.18}
              strokeWidth={1}
            />
            <Circle
              cx={70}
              cy={70}
              r={45}
              fill="none"
              stroke="#ffcd93"
              strokeOpacity={0.1}
              strokeWidth={1}
            />

            <Circle cx={70} cy={70} r={24} fill="url(#symbolCore)" />

            <Circle
              cx={70}
              cy={70}
              r={34}
              fill="none"
              stroke="#fcdfab"
              strokeWidth={5}
              opacity={0.08}
            />

            <Circle
              cx={70}
              cy={70}
              r={32}
              fill="none"
              stroke="#ffed9f"
              strokeWidth={1.4}
            />

            <Line
              x1={70}
              y1={38}
              x2={70}
              y2={102}
              stroke="#ffeece"
              strokeWidth={1.3}
            />

            <Line
              x1={38}
              y1={70}
              x2={102}
              y2={70}
              stroke="#ffeece"
              strokeWidth={1.3}
            />

            <Path
              d="
                M 70 38
                Q 92 70
                  70 102
                Q 48 70
                  70 38
              "
              fill="none"
              stroke="#ffeece"
              strokeWidth={1.1}
            />

            <Path
              d="
                M 38 70
                Q 70 48
                  102 70
                Q 70 92
                  38 70
              "
              fill="none"
              stroke="#ffeece"
              strokeWidth={1.1}
            />
          </Svg>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>O ORÁCULO AGUARDA</Text>


          <TextInput
            placeholder="Email"
            placeholderTextColor="rgba(223,244,255,0.42)"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <TextInput
            placeholder="Senha"
            placeholderTextColor="rgba(223,244,255,0.42)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.googleButtonText}>
              {loading ? 'Aguarde...' : 'Entrar com Google'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryActionText}>
              {loading ? 'Aguarde...' : 'Criar conta'}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
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

  videoVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },

  glowLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 28,
  },

  symbolWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },

  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(232,194,122,0.18)',
    backgroundColor: 'rgba(7, 17, 34, 0.64)',
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },

  eyebrow: {
    color: '#DFF4FF',
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10,
    opacity: 0.82,
  },

  title: {
    fontSize: 32,
    color: '#F4D7A2',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 10,
  },

  subtitle: {
    color: '#B7CAE3',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },

  input: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    color: '#F6F3EE',
    borderWidth: 1,
    borderColor: 'rgba(223,244,255,0.08)',
    fontSize: 15,
  },

  primaryButton: {
    marginTop: 8,
    backgroundColor: '#132B49',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#D5A85E',
    shadowColor: '#D5A85E',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },

  primaryButtonText: {
    color: '#F4D7A2',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  googleButton: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(180, 218, 255, 0.16)',
  },

  googleButtonText: {
    color: '#E7F3FF',
    fontSize: 15,
    fontWeight: '600',
  },

  secondaryAction: {
    marginTop: 18,
    alignItems: 'center',
  },

  secondaryActionText: {
    color: '#D8B57A',
    fontSize: 15,
    fontWeight: '600',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  footerHint: {
    marginTop: 18,
    textAlign: 'center',
    color: '#DFF4FF',
    fontSize: 12,
    letterSpacing: 2.4,
    textTransform: 'lowercase',
    opacity: 0.65,
  },
});