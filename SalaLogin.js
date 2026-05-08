import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, SALAS } from './constants';

export default function SalaLogin({ onLogin }) {
  const [salaId, setSalaId] = useState(null);

  const handleSelectSala = (id) => {
    setSalaId(id);
    // Login automático ao selecionar sala
    const salaInfo = SALAS.find(s => s.id === id);
    onLogin({ 
      role: 'sala', 
      salaId, 
      nomeUsuario: salaInfo.nome // Usa o nome da sala como usuário
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SOPHIE</Text>
        <Text style={styles.subtitle}>Sala de Aula</Text>
        <Text style={styles.description}>Sistema de Avisos Escolares</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Toque na sala que você representa:</Text>
        <View style={styles.salaGrid}>
          {SALAS.map((sala) => (
            <TouchableOpacity
              key={sala.id}
              style={[
                styles.salaButton,
                salaId === sala.id && styles.salaButtonSelected,
              ]}
              onPress={() => handleSelectSala(sala.id)}
            >
              <Text style={styles.salaButtonText}>{sala.nome.split(' - ')[0]}</Text>
              <Text style={styles.salaButtonSubText}>{sala.nome.split(' - ')[1]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {salaId && (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedText}>
              ✅ Sala selecionada: {SALAS.find(s => s.id === salaId)?.nome}
            </Text>
            <Text style={styles.instructionText}>
              Entrando automaticamente...
            </Text>
          </View>
        )}
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
    marginBottom: 40,
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
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
  },
  salaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  salaButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    backgroundColor: COLORS.light,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  salaButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.secondary,
  },
  salaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  salaButtonSubText: {
    fontSize: 11,
    color: COLORS.dark,
    marginTop: 4,
  },
  selectedInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.success + '20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.dark,
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