import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, TextInput } from 'react-native';
import { COLORS, SALAS, CURSOS } from './constants';
import { adminAuth } from './adminAuth';
import { accountManager } from './accountManager';

export default function AdminPanelScreen({ adminUser, onLogout }) {
  const [sessaoValida, setSessaoValida] = useState(false);
  const [tabAtiva, setTabAtiva] = useState('geral');
  const [carregando, setCarregando] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [contas, setContas] = useState([]);
  const [tempoInativo, setTempoInativo] = useState(0);
  const [mostrarAvisoInatividade, setMostrarAvisoInatividade] = useState(false);
  const inactivityTimeout = React.useRef(null);
  const countdownInterval = React.useRef(null);
  const [configuracoes, setConfiguracoes] = useState({
    permitirCriarContas: true,
    exigirSenhaForte: true,
    tempoSessao: 120, // minutos
    logAtividades: true,
    notificarAdmins: true
  });
  const [novoAdmin, setNovoAdmin] = useState({
    usuario: '',
    senha: '',
    nome: '',
    role: 'admin'
  });

  useEffect(() => {
    verificarSessao();
    carregarDados();
    
    // Verificar sessão a cada 30 segundos
    const interval = setInterval(verificarSessao, 30000);
    
    // Configurar timer de inatividade (15 minutos)
    resetInactivityTimer();
    
    return () => {
      clearInterval(interval);
      clearInactivityTimer();
    };
  }, []);

  const resetInactivityTimer = () => {
    clearInactivityTimer();
    
    // Iniciar timer para 15 minutos
    inactivityTimeout.current = setTimeout(() => {
      setMostrarAvisoInatividade(true);
      setTempoInativo(60); // 60 segundos para logout
      
      // Countdown de 60 segundos
      countdownInterval.current = setInterval(() => {
        setTempoInativo(prev => {
          if (prev <= 1) {
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 15 * 60 * 1000); // 15 minutos
  };

  const clearInactivityTimer = () => {
    if (inactivityTimeout.current) {
      clearTimeout(inactivityTimeout.current);
    }
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
  };

  const handleUserActivity = () => {
    if (mostrarAvisoInatividade) {
      // Usuário clicou para continuar sessão
      setMostrarAvisoInatividade(false);
      setTempoInativo(0);
      clearInactivityTimer();
      resetInactivityTimer();
    } else {
      resetInactivityTimer();
    }
  };

  const verificarSessao = () => {
    const resultado = adminAuth.verificarSessao(adminUser.sessaoId);
    if (!resultado.valid) {
      Alert.alert('Sessão Expirada', 'Sua sessão expirou. Faça login novamente.', [
        { text: 'OK', onPress: onLogout }
      ]);
    } else {
      setSessaoValida(true);
    }
  };

  const carregarDados = () => {
    if (adminAuth.temPermissao(adminUser.sessaoId, 'ver_admins')) {
      setAdmins(adminAuth.listarAdmins());
    }
    setContas(accountManager.listarContas());
    
    // Carregar configurações
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const config = localStorage.getItem('sophie-config');
        if (config) {
          setConfiguracoes({ ...configuracoes, ...JSON.parse(config) });
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar configurações:', error);
    }
  };

  const handleLogout = () => {
    adminAuth.encerrarSessao(adminUser.sessaoId);
    onLogout();
  };

  const handleCriarAdmin = () => {
    if (!adminAuth.temPermissao(adminUser.sessaoId, 'criar_admins')) {
      Alert.alert('Sem Permissão', 'Apenas Super Admins podem criar administradores.');
      return;
    }

    const { usuario, senha, nome, role } = novoAdmin;
    
    if (!usuario.trim() || !senha.trim() || !nome.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      const novo = adminAuth.criarAdmin({
        usuario: usuario.trim(),
        senha: senha,
        nome: nome.trim(),
        role
      });
      
      Alert.alert('Sucesso', `Administrador ${novo.nome} criado com sucesso!`);
      setNovoAdmin({ usuario: '', senha: '', nome: '', role: 'admin' });
      carregarDados();
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleRemoverAdmin = (adminId, adminNome) => {
    if (!adminAuth.temPermissao(adminUser.sessaoId, 'remover_admins')) {
      Alert.alert('Sem Permissão', 'Apenas Super Admins podem remover administradores.');
      return;
    }

    Alert.alert(
      'Confirmar Remoção',
      `Tem certeza que deseja remover o administrador "${adminNome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            try {
              adminAuth.removerAdmin(adminId);
              Alert.alert('Sucesso', 'Administrador removido com sucesso!');
              carregarDados();
            } catch (error) {
              Alert.alert('Erro', error.message);
            }
          }
        }
      ]
    );
  };

  const handleAtualizarConfig = (chave, valor) => {
    const novasConfig = { ...configuracoes, [chave]: valor };
    setConfiguracoes(novasConfig);
    
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('sophie-config', JSON.stringify(novasConfig));
      }
    } catch (error) {
      console.warn('Erro ao salvar configurações:', error);
    }
  };

  const handleLimparDados = () => {
    if (!adminAuth.temPermissao(adminUser.sessaoId, 'limpar_dados')) {
      Alert.alert('Sem Permissão', 'Apenas Super Admins podem limpar dados.');
      return;
    }

    Alert.alert(
      '⚠️ ATENÇÃO - Limpar Dados',
      'Esta ação irá apagar TODOS os dados do sistema:\n\n• Contas de usuários\n• Históricos\n• Configurações\n\nEsta ação NÃO PODE ser desfeita!\n\nDeseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar Tudo',
          style: 'destructive',
          onPress: () => {
            try {
              accountManager.limparContas();
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem('sophie-firebase-data');
                localStorage.removeItem('sophie-config');
              }
              Alert.alert('Sucesso', 'Todos os dados foram apagados. O app será reiniciado.');
              setTimeout(() => window.location.reload(), 2000);
            } catch (error) {
              Alert.alert('Erro', 'Falha ao limpar dados.');
            }
          }
        }
      ]
    );
  };

  const renderTabGeral = () => (
    <View style={styles.tabContent}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📊 Informações do Sistema</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Versão:</Text>
          <Text style={styles.infoValue}>SOPHIE v1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Administrador Atual:</Text>
          <Text style={styles.infoValue}>{adminUser.nome}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nível de Acesso:</Text>
          <Text style={styles.infoValue}>
            {adminUser.role === 'super_admin' ? '🔑 Super Admin' : '👤 Administrador'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total de Contas:</Text>
          <Text style={styles.infoValue}>{contas.length} usuários</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total de Admins:</Text>
          <Text style={styles.infoValue}>{admins.length} administradores</Text>
        </View>
      </View>

      <View style={styles.configCard}>
        <Text style={styles.configTitle}>⚙️ Configurações do Sistema</Text>
        
        <View style={styles.configRow}>
          <View style={styles.configInfo}>
            <Text style={styles.configLabel}>Permitir Criar Contas</Text>
            <Text style={styles.configDesc}>Usuários podem criar novas contas</Text>
          </View>
          <Switch
            value={configuracoes.permitirCriarContas}
            onValueChange={(value) => handleAtualizarConfig('permitirCriarContas', value)}
            disabled={!adminAuth.temPermissao(adminUser.sessaoId, 'editar_configuracoes')}
          />
        </View>

        <View style={styles.configRow}>
          <View style={styles.configInfo}>
            <Text style={styles.configLabel}>Exigir Senha Forte</Text>
            <Text style={styles.configDesc}>Mínimo 8 caracteres com maiúsculas, minúsculas e números</Text>
          </View>
          <Switch
            value={configuracoes.exigirSenhaForte}
            onValueChange={(value) => handleAtualizarConfig('exigirSenhaForte', value)}
            disabled={!adminAuth.temPermissao(adminUser.sessaoId, 'editar_configuracoes')}
          />
        </View>

        <View style={styles.configRow}>
          <View style={styles.configInfo}>
            <Text style={styles.configLabel}>Log de Atividades</Text>
            <Text style={styles.configDesc}>Registrar todas as ações no sistema</Text>
          </View>
          <Switch
            value={configuracoes.logAtividades}
            onValueChange={(value) => handleAtualizarConfig('logAtividades', value)}
            disabled={!adminAuth.temPermissao(adminUser.sessaoId, 'editar_configuracoes')}
          />
        </View>
      </View>

      {adminUser.role === 'super_admin' && (
        <TouchableOpacity style={styles.dangerButton} onPress={handleLimparDados}>
          <Text style={styles.dangerButtonText}>🗑️ Limpar Todos os Dados</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTabAdmins = () => (
    <View style={styles.tabContent}>
      {adminAuth.temPermissao(adminUser.sessaoId, 'criar_admins') && (
        <View style={styles.createCard}>
          <Text style={styles.createTitle}>➕ Criar Novo Administrador</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Usuário:</Text>
            <TextInput
              style={styles.input}
              value={novoAdmin.usuario}
              onChangeText={(text) => setNovoAdmin({...novoAdmin, usuario: text})}
              placeholder="Digite o usuário"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Senha:</Text>
            <TextInput
              style={styles.input}
              value={novoAdmin.senha}
              onChangeText={(text) => setNovoAdmin({...novoAdmin, senha: text})}
              placeholder="Digite a senha"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nome:</Text>
            <TextInput
              style={styles.input}
              value={novoAdmin.nome}
              onChangeText={(text) => setNovoAdmin({...novoAdmin, nome: text})}
              placeholder="Digite o nome completo"
            />
          </View>

          <TouchableOpacity style={styles.createButton} onPress={handleCriarAdmin}>
            <Text style={styles.createButtonText}>Criar Administrador</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.adminsList}>
        <Text style={styles.listTitle}>👥 Administradores do Sistema</Text>
        {admins.map((admin) => (
          <View key={admin.id} style={styles.adminItem}>
            <View style={styles.adminInfo}>
              <Text style={styles.adminName}>{admin.nome}</Text>
              <Text style={styles.adminDetails}>
                @{admin.usuario} • {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </Text>
              <Text style={styles.adminDate}>
                Criado em: {new Date(admin.criadoEm).toLocaleDateString('pt-BR')}
              </Text>
              {admin.ultimoAcesso && (
                <Text style={styles.adminDate}>
                  Último acesso: {new Date(admin.ultimoAcesso).toLocaleDateString('pt-BR')}
                </Text>
              )}
            </View>
            {adminUser.role === 'super_admin' && admin.role !== 'super_admin' && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoverAdmin(admin.id, admin.nome)}
              >
                <Text style={styles.removeButtonText}>Remover</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderTabUsuarios = () => (
    <View style={styles.tabContent}>
      <Text style={styles.listTitle}>👤 Contas de Usuários</Text>
      {contas.map((conta) => (
        <View key={conta.id} style={styles.userItem}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{conta.nome}</Text>
            <Text style={styles.userDetails}>
              @{conta.usuario} • {conta.role === 'diretora' ? 'Diretora' : 'Sala'}
            </Text>
            <Text style={styles.userDate}>
              Criado em: {new Date(conta.criadoEm).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container} onTouchStart={handleUserActivity}>
      <View style={styles.header}>
        <Text style={styles.title}>🔐 Painel Administrativo</Text>
        <Text style={styles.subtitle}>Bem-vindo, {adminUser.nome}</Text>
      </View>

      {/* Modal de Aviso de Inatividade */}
      {mostrarAvisoInatividade && (
        <View style={styles.inactivityOverlay}>
          <View style={styles.inactivityModal}>
            <Text style={styles.inactivityTitle}>⚠️ Sessão Inativa</Text>
            <Text style={styles.inactivityMessage}>
              Sua sessão está inativa há 15 minutos.
            </Text>
            <Text style={styles.inactivityCountdown}>
              Logout automático em: {tempoInativo}s
            </Text>
            <TouchableOpacity
              style={styles.inactivityButton}
              onPress={handleUserActivity}
            >
              <Text style={styles.inactivityButtonText}>Continuar Sessão</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tabAtiva === 'geral' && styles.tabActive]}
          onPress={() => setTabAtiva('geral')}
        >
          <Text style={[styles.tabText, tabAtiva === 'geral' && styles.tabTextActive]}>
            📊 Geral
          </Text>
        </TouchableOpacity>
        
        {adminAuth.temPermissao(adminUser.sessaoId, 'ver_admins') && (
          <TouchableOpacity
            style={[styles.tab, tabAtiva === 'admins' && styles.tabActive]}
            onPress={() => setTabAtiva('admins')}
          >
            <Text style={[styles.tabText, tabAtiva === 'admins' && styles.tabTextActive]}>
              👥 Admins
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.tab, tabAtiva === 'usuarios' && styles.tabActive]}
          onPress={() => setTabAtiva('usuarios')}
        >
          <Text style={[styles.tabText, tabAtiva === 'usuarios' && styles.tabTextActive]}>
            👤 Usuários
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {tabAtiva === 'geral' && renderTabGeral()}
        {tabAtiva === 'admins' && renderTabAdmins()}
        {tabAtiva === 'usuarios' && renderTabUsuarios()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Sair do Painel</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabContent: {
    paddingBottom: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  configCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  configInfo: {
    flex: 1,
  },
  configLabel: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '600',
    marginBottom: 2,
  },
  configDesc: {
    fontSize: 12,
    color: '#666',
  },
  createCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: 'white',
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
  },
  adminsList: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adminItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  adminDetails: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
  adminDate: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  userDetails: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
  userDate: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  dangerButton: {
    backgroundColor: '#f44336',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.accent,
    backgroundColor: 'white',
  },
  logoutButton: {
    backgroundColor: COLORS.dark,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inactivityOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  inactivityModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  inactivityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 15,
    textAlign: 'center',
  },
  inactivityMessage: {
    fontSize: 16,
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 10,
  },
  inactivityCountdown: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
  },
  inactivityButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  inactivityButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
