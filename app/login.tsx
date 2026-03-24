import { useState } from 'react';
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

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      <Text style={styles.title}>Entrar</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
      />

      <TextInput
        placeholder="Senha"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonOutline}
        onPress={handleSignup}
        disabled={loading}
      >
        <Text style={styles.buttonOutlineText}>
          {loading ? 'Aguarde...' : 'Criar conta'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.googleButton, loading && styles.buttonDisabled]}
        onPress={handleGoogleLogin}
        disabled={loading}
      >
        <Text style={styles.googleButtonText}>
          {loading ? 'Aguarde...' : 'Entrar com Google'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1230',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    color: '#E8C27A',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2a1a45',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    color: '#fff',
  },
  button: {
    backgroundColor: '#3C235A',
    padding: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#F1C97A',
    fontSize: 16,
  },
  buttonOutline: {
    marginTop: 10,
    alignItems: 'center',
  },
  buttonOutlineText: {
    color: '#E8C27A',
  },
  googleButton: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '600',
  },
});