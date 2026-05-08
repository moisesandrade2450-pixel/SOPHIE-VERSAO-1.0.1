import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert, ScrollView } from 'react-native';
import { database } from './firebaseConfig';
import { playNotificationSound } from './audioService';
import { COLORS, SALAS, CURSOS } from './constants';

export default function DiretoraTela({ user, onLogout }) {
  const [salasSelecionadas, setSalasSelecionadas] = useState([]);
  const [nomePessoa, setNomePessoa] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [historico, setHistorico] = useState([]);

  const toggleSalaSelecao = (salaId) => {
    setSalasSelecionadas(prev => 
      prev.includes(salaId) 
        ? prev.filter(id => id !== salaId)
        : [...prev, salaId]
    );
  };

  const enviarAviso = async () => {
    if (salasSelecionadas.length === 0 || !nomePessoa.trim()) {
      Alert.alert('Erro', 'Selecione pelo menos uma sala e digite o nome da pessoa');
      return;
    }

    setCarregando(true);
    try {
      // Enviar para cada sala selecionada
      const promises = salasSelecionadas.map(async (salaId) => {
        const avisoRef = database.ref(`avisos/${salaId}`);
        return avisoRef.push({
          pessoas: nomePessoa,
          mensagem: mensagem,
          remetente: user.nome,
          timestamp: new Date().toISOString(),
        });
      });

      await Promise.all(promises);

      // Adicionar ao histórico
      const novoAviso = {
        id: Date.now(),
        salas: salasSelecionadas.map(id => SALAS.find(s => s.id === id)?.nome).join(', '),
        pessoas: nomePessoa,
        mensagem: mensagem,
        hora: new Date().toLocaleTimeString('pt-BR'),
      };

      setHistorico([novoAviso, ...historico]);
      setSalasSelecionadas([]);
      setNomePessoa('');
      setMensagem('');
      
      // Tocar som de sucesso
      await playNotificationSound();
      
      Alert.alert('Sucesso', `Aviso enviado para ${salasSelecionadas.length} sala(s)!`);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar aviso: ' + error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SOPHIE</Text>
          <Text style={styles.headerSubtitle}>Olá, {user.nome}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>📢 Enviar Aviso</Text>

        <Text style={styles.label}>Salas Destino (selecione uma ou mais):</Text>
        <ScrollView style={styles.salasContainer} showsVerticalScrollIndicator={false}>
          {CURSOS.map((curso) => (
            <View key={curso} style={styles.cursoSection}>
              <Text style={styles.cursoTitle}>{curso}</Text>
              <View style={styles.salasGrid}>
                {SALAS.filter(sala => sala.curso === curso).map((sala) => (
                  <TouchableOpacity
                    key={sala.id}
                    style={[
                      styles.salaButton,
                      salasSelecionadas.includes(sala.id) && styles.salaButtonSelected,
                    ]}
                    onPress={() => toggleSalaSelecao(sala.id)}
                  >
                    <Text style={styles.salaButtonText}>{sala.nome.split(' - ')[1]}</Text>
                    {salasSelecionadas.includes(sala.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.selectedCount}>
          {salasSelecionadas.length} sala(s) selecionada(s)
        </Text>

        <Text style={styles.label}>Pessoa a Chamar:</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome do professor ou aluno"
          value={nomePessoa}
          onChangeText={setNomePessoa}
          placeholderTextColor={COLORS.light}
        />

        <Text style={styles.label}>Mensagem (opcional):</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Deixe uma mensagem..."
          value={mensagem}
          onChangeText={setMensagem}
          multiline
          numberOfLines={3}
          placeholderTextColor={COLORS.light}
        />

        <TouchableOpacity
          style={[
            styles.enviarButton,
            (salasSelecionadas.length > 0 && nomePessoa.trim()) ? styles.enviarButtonActive : {},
          ]}
          onPress={enviarAviso}
          disabled={salasSelecionadas.length === 0 || !nomePessoa.trim() || carregando}
        >
          <Text style={styles.enviarButtonText}>
            {carregando ? 'Enviando...' : `📤 Enviar para ${salasSelecionadas.length} sala(s)`}
          </Text>
        </TouchableOpacity>
      </View>

      {historico.length > 0 && (
        <View style={styles.historico}>
          <Text style={styles.sectionTitle}>📋 Últimos Avisos</Text>
          <FlatList
            data={historico}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.avisoCard}>
                <View style={styles.avisoHeader}>
                  <Text style={styles.avisoSala}>{item.salas}</Text>
                  <Text style={styles.avisoHora}>{item.hora}</Text>
                </View>
                <Text style={styles.avisoPessoa}>👤 {item.pessoas}</Text>
                {item.mensagem && (
                  <Text style={styles.avisoMensagem}>{item.mensagem}</Text>
                )}
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lighter,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.light,
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  form: {
    padding: 16,
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 8,
  },
  salasContainer: {
    maxHeight: 200,
    marginBottom: 12,
  },
  cursoSection: {
    marginBottom: 16,
  },
  cursoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  salasGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  salaButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
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
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
  },
  checkmark: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  enviarButton: {
    backgroundColor: COLORS.light,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  enviarButtonActive: {
    backgroundColor: COLORS.success,
  },
  enviarButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  historico: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 20,
    flex: 1,
  },
  avisoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  avisoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  avisoSala: {
    fontWeight: '600',
    color: COLORS.primary,
    fontSize: 12,
  },
  avisoHora: {
    fontSize: 11,
    color: COLORS.light,
  },
  avisoPessoa: {
    fontWeight: '600',
    color: COLORS.dark,
    fontSize: 13,
    marginBottom: 4,
  },
  avisoMensagem: {
    fontSize: 12,
    color: COLORS.dark,
    fontStyle: 'italic',
  },
});
