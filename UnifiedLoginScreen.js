import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Image, Dimensions, Animated } from 'react-native';
import { COLORS, SALAS, CURSOS } from './constants';
import { accountManager, validarUsuario, validarSenha, validarNome } from './accountManager';

const { width, height } = Dimensions.get('window');

export default function UnifiedLoginScreen({ onLogin, onBack }) {
  const [loginType, setLoginType] = useState(null); // 'aluno', 'diretora'
  const [modo, setModo] = useState('login'); // 'login', 'criar', 'gerenciar'
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [nome, setNome] = useState('');
  const [role, setRole] = useState('diretora');
  const [salaSelecionada, setSalaSelecionada] = useState(null);
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (loginType === 'aluno' || loginType === 'diretora') {
      carregarContas();
    }
  }, [loginType]);

  const carregarContas = async () => {
    try {
      const contasList = await accountManager.listarContas();
      setContas(contasList);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      setContas([]);
    }
  };

  const handleLogin = async () => {
    if (loginType === 'admin') {
      await handleAdminLogin();
    } else {
      await handleUserLogin();
    }
  };

  const handleAdminLogin = async () => {
    if (!usuario.trim() || !senha.trim()) {
      Alert.alert('Erro', 'Preencha usuário e senha');
      return;
    }

    setCarregando(true);
    try {
      const resultado = adminAuth.autenticar(usuario.trim(), senha);
      if (resultado.success) {
        onLogin(resultado.sessao);
      } else {
        Alert.alert('Erro', 'Credenciais inválidas');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na autenticação');
    } finally {
      setCarregando(false);
    }
  };

  const handleUserLogin = async () => {
    if (!usuario.trim() || !senha.trim()) {
      Alert.alert('Erro', 'Preencha usuário e senha');
      return;
    }

    try {
      await accountManager.loadContas();
      const conta = accountManager.autenticar(usuario, senha);
      if (conta) {
        let userData = {
          role: conta.role,
          nome: conta.nome,
          usuario: conta.usuario,
          id: conta.id
        };
        
        if (conta.role !== 'admin' && conta.role !== 'diretora' && !conta.salaId) {
          userData.salaId = 'sala1';
        }
        
        onLogin(userData);
      } else {
        Alert.alert('Erro', 'Usuário ou senha incorretos');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      Alert.alert('Erro', 'Falha ao realizar login');
    }
  };

  const handleCriarConta = async () => {
    try {
      const erroUsuario = validarUsuario(usuario);
      if (erroUsuario) {
        Alert.alert('Erro', erroUsuario);
        return;
      }

      const erroSenha = validarSenha(senha);
      if (erroSenha) {
        Alert.alert('Erro', erroSenha);
        return;
      }

      const erroNome = validarNome(nome);
      if (erroNome) {
        Alert.alert('Erro', erroNome);
        return;
      }

      if (senha !== confirmSenha) {
        Alert.alert('Erro', 'As senhas não conferem');
        return;
      }

      const novaConta = accountManager.criarConta({
        usuario: usuario.trim(),
        senha,
        nome: nome.trim(),
        role
      });

      await carregarContas();
      Alert.alert('Sucesso', `Conta criada com sucesso!\n\nUsuário: ${novaConta.usuario}\nNome: ${novaConta.nome}`);

      setUsuario('');
      setSenha('');
      setConfirmSenha('');
      setNome('');
      setModo('login');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar conta');
    }
  };

  const renderTelaInicial = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('./assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>SOPHIE</Text>
        <Text style={styles.subtitle}>Sistema de Orientação Pedagógica</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => setLoginType('aluno')}
        >
          <Text style={styles.loginButtonText}>👨‍🎓 Aluno</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => setLoginType('diretora')}
        >
          <Text style={styles.loginButtonText}>👩‍🏫 Diretora</Text>
        </TouchableOpacity>

      </View>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Voltar</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderLoginAluno = () => (
    <ScrollView style={styles.loginContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.loginHeader}>
        <Image 
          source={require('./assets/icon.png')} 
          style={styles.loginLogo}
          resizeMode="contain"
        />
        <Text style={styles.loginTitle}>Login do Aluno</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Usuário"
          value={usuario}
          onChangeText={setUsuario}
          placeholderTextColor={COLORS.lighter}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={senha}
          onChangeText={setSenha}
          placeholderTextColor={COLORS.lighter}
          secureTextEntry={!mostrarSenha}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity 
          style={styles.showPasswordButton}
          onPress={() => setMostrarSenha(!mostrarSenha)}
        >
          <Text style={styles.showPasswordText}>{mostrarSenha ? '👁️' : '👁️‍🗨️'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginSubmitButton, usuario && senha && styles.loginSubmitButtonActive]}
          onPress={handleLogin}
          disabled={!usuario || !senha}
        >
          <Text style={styles.loginSubmitButtonText}>🔐 Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setLoginType(null)}>
          <Text style={styles.backLink}>← Voltar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderLoginDiretora = () => (
    <ScrollView style={styles.loginContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.loginHeader}>
        <Image 
          source={require('./assets/icon.png')} 
          style={styles.loginLogo}
          resizeMode="contain"
        />
        <Text style={styles.loginTitle}>Login da Diretora</Text>
      </View>

      <View style={styles.modeButtons}>
        <TouchableOpacity 
          style={[styles.modeButton, modo === 'login' && styles.modeButtonActive]}
          onPress={() => setModo('login')}
        >
          <Text style={[styles.modeButtonText, modo === 'login' && styles.modeButtonTextActive]}>
            🔐 Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modeButton, modo === 'criar' && styles.modeButtonActive]}
          onPress={() => setModo('criar')}
        >
          <Text style={[styles.modeButtonText, modo === 'criar' && styles.modeButtonTextActive]}>
            ➕ Criar Conta
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modeButton, modo === 'gerenciar' && styles.modeButtonActive]}
          onPress={() => setModo('gerenciar')}
        >
          <Text style={[styles.modeButtonText, modo === 'gerenciar' && styles.modeButtonTextActive]}>
            👥 Gerenciar Contas
          </Text>
        </TouchableOpacity>
      </View>

      {modo === 'login' && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Usuário"
            value={usuario}
            onChangeText={setUsuario}
            placeholderTextColor={COLORS.lighter}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={senha}
            onChangeText={setSenha}
            placeholderTextColor={COLORS.lighter}
            secureTextEntry={!mostrarSenha}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity 
            style={styles.showPasswordButton}
            onPress={() => setMostrarSenha(!mostrarSenha)}
          >
            <Text style={styles.showPasswordText}>{mostrarSenha ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginSubmitButton, usuario && senha && styles.loginSubmitButtonActive]}
            onPress={handleLogin}
            disabled={!usuario || !senha}
          >
            <Text style={styles.loginSubmitButtonText}>🔐 Entrar</Text>
          </TouchableOpacity>
        </View>
      )}

      {modo === 'criar' && (
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            value={nome}
            onChangeText={setNome}
            placeholderTextColor={COLORS.lighter}
          />

          <TextInput
            style={styles.input}
            placeholder="Usuário (mínimo 3 caracteres)"
            value={usuario}
            onChangeText={setUsuario}
            placeholderTextColor={COLORS.lighter}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha (mínimo 6 caracteres)"
            value={senha}
            onChangeText={setSenha}
            placeholderTextColor={COLORS.lighter}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmar Senha"
            value={confirmSenha}
            onChangeText={setConfirmSenha}
            placeholderTextColor={COLORS.lighter}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity onPress={handleCriarConta}>
            <Text style={styles.createAccountButton}>➕ Criar Conta</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {modo === 'gerenciar' && (
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <Text style={styles.accountsTitle}>Contas Existentes</Text>
          
          {contas.length === 0 ? (
            <Text style={styles.noAccountsText}>Nenhuma conta encontrada</Text>
          ) : (
            contas.map((conta) => (
              <View key={conta.id} style={styles.accountItem}>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{conta.nome}</Text>
                  <Text style={styles.accountDetails}>@{conta.usuario} • {conta.role}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <TouchableOpacity onPress={() => setLoginType(null)}>
        <Text style={styles.backLink}>← Voltar</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  
  if (!loginType) {
    return renderTelaInicial();
  }

  if (loginType === 'aluno') {
    return renderLoginAluno();
  }

  if (loginType === 'diretora') {
    return renderLoginDiretora();
  }

  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lighter,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  adminButton: {
    backgroundColor: COLORS.dark,
    shadowColor: COLORS.dark,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 40,
    padding: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: COLORS.lighter,
    paddingHorizontal: 20,
  },
  loginHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  loginLogo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  modeButtons: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 30,
  },
  modeButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
  },
  modeButtonTextActive: {
    color: COLORS.white,
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 16,
    top: 48,
    padding: 8,
  },
  showPasswordText: {
    fontSize: 20,
  },
  loginSubmitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.light,
    opacity: 0.5,
  },
  loginSubmitButtonActive: {
    backgroundColor: COLORS.primary,
    opacity: 1,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  loginSubmitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  createAccountButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
    padding: 12,
  },
  backLink: {
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 20,
  },
  accountsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  noAccountsText: {
    fontSize: 16,
    color: COLORS.lighter,
    textAlign: 'center',
    marginTop: 40,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  accountDetails: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 2,
  },
});
