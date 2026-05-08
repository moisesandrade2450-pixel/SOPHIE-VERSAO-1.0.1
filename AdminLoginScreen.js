import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { COLORS } from './constants';
import { adminAuth, validarUsuarioAdmin, validarSenhaAdmin } from './adminAuth';

const { width, height } = Dimensions.get('window');

export default function AdminLoginScreen({ onAdminLogin }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [tempoBloqueio, setTempoBloqueio] = useState(0);

  useEffect(() => {
    if (bloqueado && tempoBloqueio > 0) {
      const timer = setTimeout(() => {
        setTempoBloqueio(tempoBloqueio - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (bloqueado && tempoBloqueio === 0) {
      setBloqueado(false);
      setTentativas(0);
    }
  }, [bloqueado, tempoBloqueio]);

  useEffect(() => {
    // Limpar sessões expiradas ao carregar
    adminAuth.limparSessoesExpiradas();
  }, []);

  const handleLogin = async () => {
    if (bloqueado) {
      Alert.alert('Acesso Bloqueado', `Tente novamente em ${tempoBloqueio} segundos`);
      return;
    }

    // Validações
    if (!usuario.trim() || !senha.trim()) {
      Alert.alert('Erro', 'Preencha usuário e senha');
      return;
    }

    const erroUsuario = validarUsuarioAdmin(usuario);
    if (erroUsuario) {
      Alert.alert('Erro', erroUsuario);
      return;
    }

    const erroSenha = validarSenhaAdmin(senha);
    if (erroSenha) {
      Alert.alert('Erro', erroSenha);
      return;
    }

    setCarregando(true);

    try {
      const resultado = adminAuth.autenticar(usuario.trim(), senha);
      
      if (resultado.success) {
        Alert.alert(
          'Bem-vindo!', 
          `Acesso autorizado\n\n${resultado.sessao.nome}\n${resultado.sessao.role === 'super_admin' ? 'Super Administrador' : 'Administrador'}`,
          [
            {
              text: 'OK',
              onPress: () => {
                onAdminLogin({
                  sessaoId: resultado.sessao.id,
                  ...resultado.sessao
                });
              }
            }
          ]
        );
      } else {
        setTentativas(tentativas + 1);
        
        if (tentativas >= 2) { // 3 tentativas
          setBloqueado(true);
          setTempoBloqueio(60); // 1 minuto bloqueado
          Alert.alert('Acesso Bloqueado', 'Muitas tentativas incorretas. Tente novamente em 1 minuto.');
        } else {
          Alert.alert('Erro', resultado.error);
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na autenticação. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const formatarTempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.lockIcon}>
          <Text style={styles.lockText}>🔒</Text>
        </View>
        <Text style={styles.title}>Acesso Administrativo</Text>
        <Text style={styles.subtitle}>SOPHIE - Painel de Controle</Text>
        <Text style={styles.description}>Acesso restrito ao pessoal autorizado</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Usuário:</Text>
          <TextInput
            style={[styles.input, bloqueado && styles.inputDisabled]}
            placeholder="Digite seu usuário"
            value={usuario}
            onChangeText={setUsuario}
            placeholderTextColor={COLORS.light}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!bloqueado}
            maxLength={20}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Senha:</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput, bloqueado && styles.inputDisabled]}
              placeholder="Digite sua senha"
              value={senha}
              onChangeText={setSenha}
              placeholderTextColor={COLORS.light}
              secureTextEntry={!mostrarSenha}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!bloqueado}
              maxLength={30}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setMostrarSenha(!mostrarSenha)}
              disabled={bloqueado}
            >
              <Text style={styles.eyeText}>{mostrarSenha ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {bloqueado && (
          <View style={styles.blockedMessage}>
            <Text style={styles.blockedText}>
              🚫 Acesso bloqueado por segurança
            </Text>
            <Text style={styles.blockedTimer}>
              Tente novamente em: {formatarTempo(tempoBloqueio)}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.loginButton, 
            (carregando || bloqueado || !usuario.trim() || !senha.trim()) && styles.loginButtonDisabled
          ]}
          onPress={handleLogin}
          disabled={carregando || bloqueado || !usuario.trim() || !senha.trim()}
        >
          <Text style={styles.loginButtonText}>
            {carregando ? 'Autenticando...' : 'Acessar Painel Admin'}
          </Text>
        </TouchableOpacity>

        <View style={styles.securityInfo}>
          <Text style={styles.securityText}>
            🔐 Conexão segura criptografada
          </Text>
          <Text style={styles.attemptsText}>
            Tentativas: {tentativas}/3
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Área restrita • Acesso monitorado
        </Text>
        <Text style={styles.versionText}>
          v1.0.0 • Sistema Seguro
        </Text>
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
    alignItems: 'center',
    marginBottom: 40,
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  lockText: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: COLORS.dark,
    textAlign: 'center',
    opacity: 0.8,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: COLORS.dark,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 12,
    padding: 5,
  },
  eyeText: {
    fontSize: 20,
  },
  blockedMessage: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  blockedText: {
    color: '#c62828',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  blockedTimer: {
    color: '#f44336',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityInfo: {
    alignItems: 'center',
  },
  securityText: {
    fontSize: 12,
    color: '#4caf50',
    marginBottom: 5,
  },
  attemptsText: {
    fontSize: 12,
    color: COLORS.dark,
    opacity: 0.7,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.dark,
    opacity: 0.6,
    marginBottom: 5,
  },
  versionText: {
    fontSize: 10,
    color: COLORS.dark,
    opacity: 0.4,
  },
});
