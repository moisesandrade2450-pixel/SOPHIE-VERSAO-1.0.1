import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Image, Dimensions, Animated, StatusBar } from 'react-native';
import { COLORS, SALAS, CURSOS } from './constants';
import { accountManager, validarUsuario, validarSenha, validarNome } from './accountManager';

const { width, height } = Dimensions.get('window');

export default function ProfessionalLoginScreen({ onLogin, onBack }) {
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
      duration: 800,
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
    if (loginType === 'aluno') {
      await handleAlunoLogin();
    } else if (loginType === 'diretora') {
      await handleDiretoraLogin();
    }
  };

  const handleAlunoLogin = async () => {
    if (!usuario.trim() || !senha.trim() || !salaSelecionada) {
      Alert.alert('Erro', 'Preencha sala, usuário e senha');
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
          id: conta.id,
          salaId: salaSelecionada
        };
        
        onLogin(userData);
      } else {
        Alert.alert('Erro', 'Usuário ou senha incorretos');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      Alert.alert('Erro', 'Falha ao realizar login');
    }
  };

  const handleDiretoraLogin = async () => {
    if (modo === 'login') {
      if (!usuario.trim() || !senha.trim()) {
        Alert.alert('Erro', 'Preencha usuário e senha');
        return;
      }

      try {
        await accountManager.loadContas();
        const conta = accountManager.autenticar(usuario, senha);
        if (conta) {
          onLogin({
            role: conta.role,
            nome: conta.nome,
            usuario: conta.usuario,
            id: conta.id
          });
        } else {
          Alert.alert('Erro', 'Usuário ou senha incorretos');
        }
      } catch (error) {
        console.error('Erro no login:', error);
        Alert.alert('Erro', 'Falha ao realizar login');
      }
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoInner}>
            <Text style={styles.logoText}>S</Text>
          </View>
        </View>
        <Text style={styles.title}>SOPHIE</Text>
        <Text style={styles.subtitle}>Sistema Educacional Profissional</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => setLoginType('aluno')}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonIcon}>👨‍🎓</Text>
            <Text style={styles.buttonText}>Aluno</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => setLoginType('diretora')}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonIcon}>👩‍🏫</Text>
            <Text style={styles.buttonText}>Diretora</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 SOPHIE - Educação com Excelência</Text>
      </View>
    </Animated.View>
  );

  const renderLoginAluno = () => (
    <View style={styles.loginContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.loginHeader}>
        <View style={styles.smallLogo}>
          <Text style={styles.smallLogoText}>S</Text>
        </View>
        <Text style={styles.loginTitle}>Acesso do Aluno</Text>
        <Text style={styles.loginSubtitle}>Selecione sua sala e entre</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Sala</Text>
          <View style={styles.salaContainer}>
            {SALAS.map((sala) => (
              <TouchableOpacity
                key={sala.id}
                style={[
                  styles.salaButton,
                  salaSelecionada === sala.id && styles.salaButtonSelected
                ]}
                onPress={() => setSalaSelecionada(sala.id)}
              >
                <Text style={[
                  styles.salaButtonText,
                  salaSelecionada === sala.id && styles.salaButtonTextSelected
                ]}>
                  {sala.icone} {sala.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Usuário</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu usuário"
            value={usuario}
            onChangeText={setUsuario}
            placeholderTextColor={COLORS.lighter}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Senha</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Digite sua senha"
              value={senha}
              onChangeText={setSenha}
              placeholderTextColor={COLORS.lighter}
              secureTextEntry={!mostrarSenha}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={styles.passwordToggle}
              onPress={() => setMostrarSenha(!mostrarSenha)}
            >
              <View style={styles.passwordToggleIcon}>
                <View style={[styles.passwordToggleLine, !mostrarSenha && styles.passwordToggleLineActive]} />
                <View style={[styles.passwordToggleCircle, !mostrarSenha && styles.passwordToggleCircleActive]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, usuario && senha && salaSelecionada && styles.submitButtonActive]}
          onPress={handleAlunoLogin}
          disabled={!usuario || !senha || !salaSelecionada || carregando}
        >
          <Text style={styles.submitButtonText}>
            {carregando ? '🔄 Entrando...' : '🚀 Acessar Sala'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setLoginType(null)}>
          <Text style={styles.backLink}>← Voltar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoginDiretora = () => (
    <View style={styles.loginContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.loginHeader}>
        <View style={styles.smallLogo}>
          <Text style={styles.smallLogoText}>S</Text>
        </View>
        <Text style={styles.loginTitle}>Acesso da Diretora</Text>
        <Text style={styles.loginSubtitle}>Painel Administrativo</Text>
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
            👥 Gerenciar
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {modo === 'login' && (
          <View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Usuário</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite seu usuário"
                value={usuario}
                onChangeText={setUsuario}
                placeholderTextColor={COLORS.lighter}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Senha</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Digite sua senha"
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
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, usuario && senha && styles.submitButtonActive]}
              onPress={handleDiretoraLogin}
              disabled={!usuario || !senha || carregando}
            >
              <Text style={styles.submitButtonText}>
                {carregando ? '🔄 Entrando...' : '🚀 Acessar'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {modo === 'criar' && (
          <View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome Completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite seu nome completo"
                value={nome}
                onChangeText={setNome}
                placeholderTextColor={COLORS.lighter}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Usuário</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 3 caracteres"
                value={usuario}
                onChangeText={setUsuario}
                placeholderTextColor={COLORS.lighter}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChangeText={setSenha}
                placeholderTextColor={COLORS.lighter}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="Repita a senha"
                value={confirmSenha}
                onChangeText={setConfirmSenha}
                placeholderTextColor={COLORS.lighter}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity onPress={handleCriarConta}>
              <Text style={styles.createAccountButton}>➕ Criar Conta</Text>
            </TouchableOpacity>
          </View>
        )}

        {modo === 'gerenciar' && (
          <View>
            <Text style={styles.accountsTitle}>Contas Cadastradas</Text>
            
            {contas.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Nenhuma conta encontrada</Text>
                <Text style={styles.emptyStateSubtext}>Crie contas para começar</Text>
              </View>
            ) : (
              contas.map((conta) => (
                <View key={conta.id} style={styles.accountCard}>
                  <View style={styles.accountAvatar}>
                    <Text style={styles.avatarText}>{conta.nome.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{conta.nome}</Text>
                    <Text style={styles.accountDetails}>@{conta.usuario} • {conta.role}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <TouchableOpacity onPress={() => setLoginType(null)}>
          <Text style={styles.backLink}>← Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    marginBottom: 50,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 350,
    gap: 20,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonIcon: {
    fontSize: 24,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: COLORS.lighter,
  },
  loginHeader: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  smallLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  smallLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  modeButtons: {
    flexDirection: 'row',
    marginHorizontal: -10,
    marginBottom: 30,
  },
  modeButton: {
    flex: 1,
    marginHorizontal: 10,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderRadius: 15,
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
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
  },
  modeButtonTextActive: {
    color: COLORS.white,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 12,
    padding: 18,
    fontSize: 16,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 16,
    top: 18,
    padding: 8,
  },
  showPasswordText: {
    fontSize: 20,
  },
  salaContainer: {
    marginBottom: 20,
  },
  salaButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  salaButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  salaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
  },
  salaButtonTextSelected: {
    color: COLORS.white,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 18,
    padding: 8,
  },
  passwordToggleIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordToggleLine: {
    width: 20,
    height: 2,
    backgroundColor: COLORS.secondary,
    borderRadius: 1,
    opacity: 0.5,
  },
  passwordToggleLineActive: {
    backgroundColor: COLORS.primary,
    opacity: 1,
  },
  passwordToggleCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    position: 'absolute',
    right: 0,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  passwordToggleCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  submitButton: {
    backgroundColor: COLORS.light,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    opacity: 0.6,
  },
  submitButtonActive: {
    backgroundColor: COLORS.primary,
    opacity: 1,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  backLink: {
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 20,
  },
  createAccountButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
    padding: 16,
    textDecorationLine: 'underline',
  },
  accountsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.lighter,
    textAlign: 'center',
  },
  accountCard: {
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
  accountAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  accountDetails: {
    fontSize: 14,
    color: COLORS.secondary,
  },
});
