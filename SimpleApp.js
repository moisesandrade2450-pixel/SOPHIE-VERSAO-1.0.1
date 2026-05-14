import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, StatusBar, ScrollView } from 'react-native';
import { COLORS, SALAS } from './constants';
import AlunoSalaTela from './AlunoSalaTela';
import ProfessionalDiretoraTela from './ProfessionalDiretoraTela';

export default function SimpleApp() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('menu');
  const [loginData, setLoginData] = useState({ usuario: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [selectedSalaId, setSelectedSalaId] = useState(SALAS[0]?.id || 'sala1');
  const [managementRole, setManagementRole] = useState('diretora');
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const usuarios = {
    diretora: { senha: '123456', nome: 'Diretora', role: 'diretora' },
    admin: { senha: 'admin123', nome: 'Administrador', role: 'diretora' },
    aluno: { senha: 'aluno123', nome: 'Aluno', role: 'aluno' },
    professor: { senha: 'prof123', nome: 'Professor', role: 'professor' }
  };

  const handleEnterSala = (salaId) => {
    const sala = SALAS.find((item) => item.id === salaId);
    if (!sala) {
      Alert.alert('Sala inválida');
      return;
    }

    setUser({
      id: salaId,
      usuario: salaId,
      nome: sala.nome,
      role: 'aluno',
      salaId,
    });
  };

  const handleLogin = () => {
    if (!loginData.usuario || !loginData.senha) {
      Alert.alert('Erro', 'Preencha usuário e senha');
      return;
    }

    const usuarioChave = loginData.usuario.toLowerCase();
    const usuarioValido = usuarios[usuarioChave];
    if (!usuarioValido || usuarioValido.senha !== loginData.senha) {
      Alert.alert('Erro', 'Usuário ou senha incorretos');
      return;
    }

    if (managementRole === 'diretora' && usuarioValido.role !== 'diretora') {
      Alert.alert('Erro', 'Acesso restrito a diretora ou administrador');
      return;
    }

    if (managementRole === 'professor' && usuarioValido.role !== 'professor') {
      Alert.alert('Erro', 'Acesso restrito a professor');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setUser({
        id: usuarioChave,
        usuario: loginData.usuario,
        nome: usuarioValido.nome,
        role: usuarioValido.role,
        salaId: null,
      });
      setLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', onPress: () => {
          setUser(null);
          setMode('menu');
          setLoginData({ usuario: '', senha: '' });
        }}
      ]
    );
  };

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.logoText}>SOPHIE</Text>
      <Text style={styles.logoSubtext}>Sistema de avisos escolares</Text>

      <View style={styles.menuButtons}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMode('salas')}>
          <Text style={styles.menuButtonText}>Acessar Salas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuButton, styles.menuButtonOutline]} onPress={() => setMode('gestao')}>
          <Text style={[styles.menuButtonText, styles.menuButtonOutlineText]}>Gestão Escolar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuInfo}>
        <Text style={styles.infoTitle}>Uso</Text>
        <Text style={styles.infoText}>Selecione Salas para abrir a sala desejada diretamente.</Text>
        <Text style={styles.infoText}>Selecione Gestão apenas para professores e diretoria da escola.</Text>
      </View>
    </View>
  );

  const renderSalas = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => setMode('menu')} style={styles.backButton}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Escolha sua sala</Text>
      </View>

      <ScrollView contentContainerStyle={styles.roomsContainer} showsVerticalScrollIndicator={false}>
        {SALAS.map((sala) => (
          <TouchableOpacity key={sala.id} style={[styles.salaCard, { borderLeftColor: sala.cor }]} onPress={() => handleEnterSala(sala.id)}>
            <Text style={styles.salaCardTitle}>{sala.nome}</Text>
            <Text style={styles.salaCardSubtitle}>{sala.curso}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderGestao = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => setMode('menu')} style={styles.backButton}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Gestão Escolar</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Acesso da Gestão</Text>
        <View style={styles.roleButtons}>
          <TouchableOpacity
            style={[styles.roleButton, managementRole === 'diretora' && styles.roleButtonActive]}
            onPress={() => setManagementRole('diretora')}
          >
            <Text style={[styles.roleButtonText, managementRole === 'diretora' && styles.roleButtonTextActive]}>Diretora</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, managementRole === 'professor' && styles.roleButtonActive]}
            onPress={() => setManagementRole('professor')}
          >
            <Text style={[styles.roleButtonText, managementRole === 'professor' && styles.roleButtonTextActive]}>Professor</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.inputLabel}>Usuário</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome de usuário"
          value={loginData.usuario}
          onChangeText={(text) => setLoginData({ ...loginData, usuario: text })}
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={loginData.senha}
          onChangeText={(text) => setLoginData({ ...loginData, senha: text })}
          secureTextEntry
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
          <Text style={styles.loginButtonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
        </TouchableOpacity>

        <Text style={styles.gestaoHint}>Acesso restrito a professores e diretoria da escola.</Text>
      </View>
    </View>
  );

  if (isAppLoading) {
    return (
      <View style={[styles.container, styles.splashContainer]}>
        <Text style={styles.splashTitle}>SOPHIE</Text>
        <Text style={styles.splashText}>Carregando SOPHIE...</Text>
      </View>
    );
  }

  if (!user) {
    if (mode === 'salas') {
      return renderSalas();
    }
    if (mode === 'gestao') {
      return renderGestao();
    }
    return renderMenu();
  }

  return (
    <View style={styles.container}>
      {(user.role === 'diretora' || user.role === 'professor') ? (
        <ProfessionalDiretoraTela user={user} onLogout={handleLogout} />
      ) : (
        <AlunoSalaTela user={user} onLogout={handleLogout} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f6f3fb',
  },
  logoText: {
    fontSize: 52,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  logoSubtext: {
    fontSize: 18,
    color: COLORS.dark,
    marginBottom: 36,
    textAlign: 'center',
  },
  menuButtons: {
    width: '100%',
    marginBottom: 30,
  },
  menuButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  menuButtonOutline: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  menuButtonOutlineText: {
    color: COLORS.primary,
  },
  menuInfo: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 22,
  },
  pageHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 10,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginLeft: 10,
  },
  roomsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  salaCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    marginBottom: 16,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  salaCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 6,
  },
  salaCardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  form: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f7f7f7',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  gestaoHint: {
    marginTop: 16,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  roleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  splashContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  splashTitle: {
    fontSize: 50,
    fontWeight: '900',
    color: COLORS.white,
  },
  splashText: {
    fontSize: 20,
    color: COLORS.white,
    marginTop: 14,
  },
});
