import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, FlatList } from 'react-native';
import { COLORS, SALAS, CURSOS } from './constants';
import { accountManager, validarUsuario, validarSenha, validarNome } from './accountManager';

export default function LoginScreen({ onLogin, userType }) {
  const [modo, setModo] = useState(userType === 'diretora' ? 'diretora' : userType === 'aluno' ? 'sala' : null); // 'diretora', 'sala', 'criar'
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [nome, setNome] = useState('');
  const [role, setRole] = useState('diretora');
  const [salaSelecionada, setSalaSelecionada] = useState(null);
  const [contas, setContas] = useState([]);

  // Carregar contas ao iniciar
  useEffect(() => {
    carregarContas();
  }, []);

  const carregarContas = async () => {
    try {
      const contasList = await accountManager.listarContas();
      setContas(contasList);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      setContas([]);
    }
  };

  const handleLoginDiretora = async () => {
    if (!usuario.trim() || !senha.trim()) {
      Alert.alert('Erro', 'Preencha usuário e senha');
      return;
    }

    try {
      await accountManager.loadContas(); // Garantir que contas estejam carregadas
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
  };

  const handleCriarConta = async () => {
    console.log('🔍 DEBUG: Iniciando criação de conta');
    console.log('📝 Dados do formulário:', { usuario, senha, nome, role });
    
    try {
      // Validações
      const erroUsuario = validarUsuario(usuario);
      console.log('✅ Validação usuário:', erroUsuario || 'OK');
      if (erroUsuario) {
        console.log('❌ Erro usuário:', erroUsuario);
        Alert.alert('Erro', erroUsuario);
        return;
      }

      const erroSenha = validarSenha(senha);
      console.log('✅ Validação senha:', erroSenha || 'OK');
      if (erroSenha) {
        console.log('❌ Erro senha:', erroSenha);
        Alert.alert('Erro', erroSenha);
        return;
      }

      const erroNome = validarNome(nome);
      console.log('✅ Validação nome:', erroNome || 'OK');
      if (erroNome) {
        console.log('❌ Erro nome:', erroNome);
        Alert.alert('Erro', erroNome);
        return;
      }

      if (senha !== confirmSenha) {
        console.log('❌ Senhas não conferem');
        Alert.alert('Erro', 'As senhas não conferem');
        return;
      }

      console.log('🚀 Tentando criar conta...');
      // Criar conta
      const novaConta = accountManager.criarConta({
        usuario: usuario.trim(),
        senha,
        nome: nome.trim(),
        role
      });

      console.log('✅ Conta criada:', novaConta);
      await carregarContas();

      Alert.alert('Sucesso', `Conta criada com sucesso!\n\nUsuário: ${novaConta.usuario}\nNome: ${novaConta.nome}`);

      // Limpar formulário
      setUsuario('');
      setSenha('');
      setConfirmSenha('');
      setNome('');

      // Voltar para login
      setModo('diretora');

    } catch (error) {
      console.log('❌ Erro na criação:', error);
      Alert.alert('Erro', error.message);
    }
  };

  const handleSelecionarSala = (sala) => {
    setSalaSelecionada(sala);
    onLogin({
      role: 'sala',
      salaId: sala.id,
      nomeUsuario: sala.nome
    });
  };

  const salasPorCurso = SALAS.reduce((acc, sala) => {
    if (!acc[sala.curso]) acc[sala.curso] = [];
    acc[sala.curso].push(sala);
    return acc;
  }, {});

  // Se não há modo definido e não há userType, mostrar seleção
  if (!modo && !userType) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>SOPHIE</Text>
          <Text style={styles.subtitle}>Sistema de Avisos Escolares</Text>
        </View>

        <View style={styles.modoSelection}>
          <TouchableOpacity
            style={[styles.modoButton, styles.diretoraBg]}
            onPress={() => setModo('diretora')}
          >
            <Text style={styles.modoButtonText}>👩‍💼 Diretora</Text>
            <Text style={styles.modoButtonSubText}>Login com usuário e senha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modoButton, styles.salaBg]}
            onPress={() => setModo('sala')}
          >
            <Text style={styles.modoButtonText}>🏫 Sala de Aula</Text>
            <Text style={styles.modoButtonSubText}>Selecione sua sala</Text>
          </TouchableOpacity>

                  </View>
      </View>
    );
  }

  if (modo === 'diretora') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>SOPHIE</Text>
          <Text style={styles.subtitle}>Login da Diretora</Text>
        </View>

        <View style={styles.loginForm}>
          <TextInput
            style={styles.input}
            placeholder="Usuário"
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            placeholderTextColor={COLORS.lighter}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            placeholderTextColor={COLORS.lighter}
          />

          <TouchableOpacity
            style={[styles.loginButton, usuario && senha && styles.loginButtonActive]}
            onPress={handleLoginDiretora}
            disabled={!usuario || !senha}
          >
            <Text style={styles.loginButtonText}>🔐 Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.criarContaButton}
            onPress={() => { setModo('criar'); setUsuario(''); setSenha(''); setConfirmSenha(''); }}
          >
            <Text style={styles.criarContaText}>Não tem conta? Crie uma!</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setModo(null); setUsuario(''); setSenha(''); }}>
            <Text style={styles.backButton}>← Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (modo === 'criar') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>SOPHIE</Text>
          <Text style={styles.subtitle}>Criar Nova Conta</Text>
        </View>

        <ScrollView style={styles.loginForm} showsVerticalScrollIndicator={false}>
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
            autoCapitalize="none"
            placeholderTextColor={COLORS.lighter}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha (mínimo 6 caracteres)"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            placeholderTextColor={COLORS.lighter}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmar Senha"
            value={confirmSenha}
            onChangeText={setConfirmSenha}
            secureTextEntry
            placeholderTextColor={COLORS.lighter}
          />

          <View style={styles.roleSelection}>
            <Text style={styles.roleLabel}>Tipo de conta:</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'diretora' && styles.roleButtonSelected]}
                onPress={() => setRole('diretora')}
              >
                <Text style={[styles.roleButtonText, role === 'diretora' && styles.roleButtonTextSelected]}>
                  👩‍💼 Diretora
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'professor' && styles.roleButtonSelected]}
                onPress={() => setRole('professor')}
              >
                <Text style={[styles.roleButtonText, role === 'professor' && styles.roleButtonTextSelected]}>
                  👨‍🏫 Professor
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, nome && usuario && senha && confirmSenha && styles.loginButtonActive]}
            onPress={handleCriarConta}
            disabled={!nome || !usuario || !senha || !confirmSenha}
          >
            <Text style={styles.loginButtonText}>✅ Criar Conta</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setModo(null); setUsuario(''); setSenha(''); setConfirmSenha(''); setNome(''); }}>
            <Text style={styles.backButton}>← Voltar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (modo === 'sala') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>SOPHIE</Text>
          <Text style={styles.subtitle}>Selecionar Sala</Text>
        </View>

        <ScrollView style={styles.salasContainer} showsVerticalScrollIndicator={false}>
          {CURSOS.map((curso) => (
            <View key={curso} style={styles.cursoSection}>
              <Text style={styles.cursoTitle}>{curso}</Text>
              <View style={styles.salasGrid}>
                {salasPorCurso[curso].map((sala) => (
                  <TouchableOpacity
                    key={sala.id}
                    style={[styles.salaButton, salaSelecionada?.id === sala.id && styles.salaButtonSelected]}
                    onPress={() => handleSelecionarSala(sala)}
                  >
                    <Text style={styles.salaButtonText}>{sala.nome}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.backButtonContainer}
            onPress={() => { setModo(null); setSalaSelecionada(null); }}
          >
            <Text style={styles.backButton}>← Voltar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

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
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '500',
  },
  modoSelection: {
    gap: 20,
  },
  modoButton: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  diretoraBg: {
    backgroundColor: COLORS.primary,
  },
  salaBg: {
    backgroundColor: COLORS.secondary,
  },
  modoButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  modoButtonSubText: {
    fontSize: 14,
    color: COLORS.lighter,
  },
  loginForm: {
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
  criarContaButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  criarContaText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  backButton: {
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 12,
  },
  salasContainer: {
    flex: 1,
  },
  cursoSection: {
    marginBottom: 24,
  },
  cursoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  salasGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  salaButton: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 80,
  },
  salaButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  salaButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
  },
  backButtonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  gerenciarBg: {
    backgroundColor: COLORS.accent,
  },
  roleSelection: {
    marginVertical: 8,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  roleButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
  },
  roleButtonTextSelected: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  contasContainer: {
    flex: 1,
  },
  contasTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  noContasText: {
    fontSize: 16,
    color: COLORS.lighter,
    textAlign: 'center',
    marginTop: 40,
  },
  contaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contaInfo: {
    flex: 1,
  },
  contaNome: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  contaUsuario: {
    fontSize: 14,
    color: COLORS.accent,
    marginTop: 2,
  },
  contaRole: {
    fontSize: 12,
    color: COLORS.lighter,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: COLORS.danger,
  },
  deleteButtonText: {
    fontSize: 16,
  },
});
