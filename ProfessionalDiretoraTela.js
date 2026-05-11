import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Animated, StatusBar, FlatList } from 'react-native';
import { COLORS } from './constants';

const { width, height } = Dimensions.get('window');

export default function ProfessionalDiretoraTela({ user, onLogout }) {
  const [avisos, setAvisos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [mostrarFormAviso, setMostrarFormAviso] = useState(false);
  const [novoAviso, setNovoAviso] = useState({ titulo: '', mensagem: '', tipo: 'aviso' });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Simular carregamento de avisos
    setCarregando(true);
    setTimeout(() => {
      setAvisos([
        {
          id: 1,
          titulo: '📚 Reunião de Pais',
          mensagem: 'Reunião mensal sexta-feira 19h',
          tempo: 'amanhã às 19h',
          tipo: 'reuniao',
          lida: false
        },
        {
          id: 2,
          titulo: '📝 Relatório Bimestral',
          mensagem: 'Enviar relatório de notas dos alunos',
          tempo: 'até sexta-feira',
          tipo: 'tarefa',
          lida: false
        },
        {
          id: 3,
          titulo: '🎓 Evento Cultural',
          mensagem: 'Festival de talentos dia 25',
          tempo: 'próxima semana',
          tipo: 'evento',
          lida: false
        }
      ]);
      setCarregando(false);
    }, 1500);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair do painel da diretora?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', onPress: () => onLogout() }
      ]
    );
  };

  const handleCriarAviso = () => {
    if (!novoAviso.titulo.trim() || !novoAviso.mensagem.trim()) {
      Alert.alert('Erro', 'Preencha título e mensagem do aviso');
      return;
    }

    const avisoCriado = {
      id: Date.now(),
      titulo: novoAviso.titulo,
      mensagem: novoAviso.mensagem,
      tempo: 'agora',
      tipo: novoAviso.tipo,
      lida: false
    };

    setAvisos([avisoCriado, ...avisos]);
    setNovoAviso({ titulo: '', mensagem: '', tipo: 'aviso' });
    setMostrarFormAviso(false);
  };

  const renderAviso = ({ item }) => (
    <TouchableOpacity 
      style={[styles.avisoCard, item.lida && styles.avisoLido]}
      onPress={() => !item.lida && setAvisos(avisos.map(aviso => 
        aviso.id === item.id ? { ...aviso, lida: true } : aviso
      ))}
    >
      <View style={styles.avisoHeader}>
        <Text style={styles.avisoTitulo}>{item.titulo}</Text>
        <Text style={styles.avisoTempo}>{item.tempo}</Text>
      </View>
      <Text style={styles.avisoMensagem}>{item.mensagem}</Text>
      {!item.lida && (
        <View style={styles.avisoBadge}>
          <Text style={styles.avisoBadgeText}>NOVO</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.nome.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.nome}</Text>
            <Text style={styles.userRole}>Diretora</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📢 Painel de Controle</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setMostrarFormAviso(!mostrarFormAviso)}
          >
            <Text style={styles.addButtonText}>➕ Novo Aviso</Text>
          </TouchableOpacity>
        </View>

        {carregando ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        ) : (
          <FlatList
            data={avisos}
            renderItem={renderAviso}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.avisosList}
          />
        )}

        {mostrarFormAviso && (
          <View style={styles.formOverlay}>
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Criar Novo Aviso</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setMostrarFormAviso(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Título</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Título do aviso"
                  value={novoAviso.titulo}
                  onChangeText={(text) => setNovoAviso({ ...novoAviso, titulo: text })}
                  placeholderTextColor={COLORS.lighter}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mensagem</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Digite a mensagem"
                  value={novoAviso.mensagem}
                  onChangeText={(text) => setNovoAviso({ ...novoAviso, mensagem: text })}
                  placeholderTextColor={COLORS.lighter}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tipo</Text>
                <View style={styles.tipoButtons}>
                  <TouchableOpacity 
                    style={[styles.tipoButton, novoAviso.tipo === 'aviso' && styles.tipoButtonActive]}
                    onPress={() => setNovoAviso({ ...novoAviso, tipo: 'aviso' })}
                  >
                    <Text style={styles.tipoButtonText}>📢 Aviso</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.tipoButton, novoAviso.tipo === 'tarefa' && styles.tipoButtonActive]}
                    onPress={() => setNovoAviso({ ...novoAviso, tipo: 'tarefa' })}
                  >
                    <Text style={styles.tipoButtonText}>📝 Tarefa</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.tipoButton, novoAviso.tipo === 'evento' && styles.tipoButtonActive]}
                    onPress={() => setNovoAviso({ ...novoAviso, tipo: 'evento' })}
                  >
                    <Text style={styles.tipoButtonText}>🎓 Evento</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleCriarAviso}>
                <Text style={styles.submitButtonText}>📨 Publicar Aviso</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lighter,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: COLORS.lighter,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.secondary,
  },
  avisosList: {
    gap: 12,
  },
  avisoCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  avisoLido: {
    opacity: 0.6,
    borderLeftColor: COLORS.secondary,
  },
  avisoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  avisoTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
  },
  avisoTempo: {
    fontSize: 14,
    color: COLORS.secondary,
    backgroundColor: COLORS.lighter,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  avisoMensagem: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
    flex: 1,
  },
  avisoBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  avisoBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  formOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 20,
    borderRadius: 15,
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.dark,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  tipoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipoButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  tipoButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tipoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
