import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { COLORS } from './constants';

export default function DiretoraLogin({ onLogin }) {
  const [nomeDirectora, setNomeDirectora] = useState('');

  const handleLogin = () => {
    if (nomeDirectora.trim()) {
      onLogin({ role: 'diretora', nome: nomeDirectora });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SOPHIE</Text>
        <Text style={styles.subtitle}>Painel da Diretora</Text>
        <Text style={styles.description}>Sistema de Avisos Escolares</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Digite seu nome:</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome da Diretora"
          value={nomeDirectora}
          onChangeText={setNomeDirectora}
          placeholderTextColor={COLORS.light}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.loginButton, nomeDirectora.trim() && styles.loginButtonActive]}
          onPress={handleLogin}
          disabled={!nomeDirectora.trim()}
        >
          <Text style={styles.loginButtonText}>Entrar como Diretora</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lighter,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: COLORS.secondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.accent,
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
    textAlign: 'center',
  },
  loginButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.light,
    opacity: 0.5,
  },
  loginButtonActive: {
    backgroundColor: COLORS.primary,
    opacity: 1,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
});