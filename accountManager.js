import { COLORS } from './constants';
import databaseManager from './databaseManager';

// Sistema de gerenciamento de contas
export class AccountManager {
  constructor() {
    this.contas = [];
    this.loadContas();
  }

  async loadContas() {
    try {
      this.contas = await databaseManager.listarContas();
      console.log(' Contas carregadas do banco:', this.contas.length);
    } catch (error) {
      console.warn('Erro ao carregar contas:', error);
      this.contas = [];
    }
  }

  async saveContas() {
    try {
      // Salvar cada conta individualmente
      for (const conta of this.contas) {
        await databaseManager.salvarConta(conta);
      }
      console.log(' Contas salvas no banco:', this.contas.length);
    } catch (error) {
      console.warn('Erro ao salvar contas:', error);
    }
  }

  // Criar nova conta
  criarConta(dados) {
    const { usuario, senha, nome, role } = dados;

    // Validações
    if (!usuario || !senha || !nome || !role) {
      throw new Error('Todos os campos são obrigatórios');
    }

    if (usuario.length < 3) {
      throw new Error('Usuário deve ter pelo menos 3 caracteres');
    }

    if (senha.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    // Verificar se usuário já existe
    if (this.contas.find(c => c.usuario === usuario)) {
      throw new Error('Este usuário já existe');
    }

    // Criar conta
    const novaConta = {
      id: Date.now().toString(),
      usuario,
      senha,
      nome,
      role,
      criadoEm: new Date().toISOString(),
      ativo: true
    };

    this.contas.push(novaConta);
    this.saveContas();

    return novaConta;
  }

  // Autenticar usuário
  autenticar(usuario, senha) {
    const conta = this.contas.find(c => c.usuario === usuario && c.senha === senha && c.ativo);
    return conta || null;
  }

  // Listar contas por role
  listarContas(role = null) {
    if (role) {
      return this.contas.filter(c => c.role === role && c.ativo);
    }
    return this.contas.filter(c => c.ativo);
  }

  // Desativar conta
  desativarConta(id) {
    const conta = this.contas.find(c => c.id === id);
    if (conta) {
      conta.ativo = false;
      this.saveContas();
      return true;
    }
    return false;
  }

  // Alterar senha
  alterarSenha(id, novaSenha) {
    const conta = this.contas.find(c => c.id === id);
    if (conta && novaSenha.length >= 6) {
      conta.senha = novaSenha;
      this.saveContas();
      return true;
    }
    return false;
  }

  // Limpar todas as contas (para testes)
  limparContas() {
    this.contas = [];
    this.saveContas();
  }
}

// Instância global
export const accountManager = new AccountManager();

// Funções de utilitários
export const validarUsuario = (usuario) => {
  if (!usuario || usuario.length < 3) {
    return 'Usuário deve ter pelo menos 3 caracteres';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(usuario)) {
    return 'Usuário deve conter apenas letras, números e underscore';
  }
  return null;
};

export const validarSenha = (senha) => {
  if (!senha || senha.length < 6) {
    return 'Senha deve ter pelo menos 6 caracteres';
  }
  return null;
};

export const validarNome = (nome) => {
  if (!nome || nome.trim().length < 2) {
    return 'Nome deve ter pelo menos 2 caracteres';
  }
  return null;
};
