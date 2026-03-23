import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha email e senha');
      return;
    }
    
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    
    setLoading(false);
    
    if (error) {
      Alert.alert('Erro', error.message);
    } else {
      Alert.alert('Sucesso', 'Login realizado!');
    }
  }
  
  async function handleSignup() {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha email e senha');
      return;
    }
    
    setLoading(true);
    
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    
    setLoading(false);
    
    if (error) {
      Alert.alert('Erro', error.message);
    } else {
      Alert.alert('Conta criada', 'Verifique seu email');
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
      />

      <TextInput
        placeholder="Senha"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonOutline} onPress={handleSignup}>
        <Text style={styles.buttonOutlineText}>Criar conta</Text>
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
});