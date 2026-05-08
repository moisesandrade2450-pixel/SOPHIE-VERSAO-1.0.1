import { COLORS } from './constants';

// Sistema de autenticação administrativa segura
class AdminAuth {
  constructor() {
    this.admins = [];
    this.sessoes = [];
    this.loadAdmins();
  }

  loadAdmins() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const admins = localStorage.getItem('sophie-admins');
        if (admins) {
          this.admins = JSON.parse(admins);
        } else {
          // Inicializar com administradores padrão (desenvolvedores do projeto)
          this.admins = [
            { 
              id: 'admin_1', 
              usuario: 'moises', 
              senha: 'devmaster2026', 
              nome: 'Moisés (Desenvolvedor Principal)', 
              role: 'super_admin',
              criadoEm: new Date().toISOString(),
              ultimoAcesso: null
            },
            { 
              id: 'admin_2', 
              usuario: 'adriano', 
              senha: 'sophie2026', 
              nome: 'Adriano (Desenvolvedor)', 
              role: 'admin',
              criadoEm: new Date().toISOString(),
              ultimoAcesso: null
            },
            { 
              id: 'admin_3', 
              usuario: 'gustavo', 
              senha: 'sophie2026', 
              nome: 'Gustavo (Desenvolvedor)', 
              role: 'admin',
              criadoEm: new Date().toISOString(),
              ultimoAcesso: null
            },
            { 
              id: 'admin_4', 
              usuario: 'cecilia', 
              senha: 'sophie2026', 
              nome: 'Cecília (Desenvolvedora)', 
              role: 'admin',
              criadoEm: new Date().toISOString(),
              ultimoAcesso: null
            },
            { 
              id: 'admin_5', 
              usuario: 'caiobruno', 
              senha: 'sophie2026', 
              nome: 'Caio Bruno (Desenvolvedor)', 
              role: 'admin',
              criadoEm: new Date().toISOString(),
              ultimoAcesso: null
            },
            { 
              id: 'admin_6', 
              usuario: 'pedrolucas', 
              senha: 'sophie2026', 
              nome: 'Pedro Lucas (Desenvolvedor)', 
              role: 'admin',
              criadoEm: new Date().toISOString(),
              ultimoAcesso: null
            },
                      ];
          this.saveAdmins();
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar administradores:', error);
      this.admins = [];
    }
  }

  saveAdmins() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('sophie-admins', JSON.stringify(this.admins));
      }
    } catch (error) {
      console.warn('Erro ao salvar administradores:', error);
    }
  }

  // Autenticar administrador
  autenticar(usuario, senha) {
    const admin = this.admins.find(a => 
      a.usuario === usuario && 
      a.senha === senha
    );
    
    if (admin) {
      // Atualizar último acesso
      admin.ultimoAcesso = new Date().toISOString();
      this.saveAdmins();
      
      // Criar sessão
      const sessao = {
        id: this.generateSessionId(),
        adminId: admin.id,
        usuario: admin.usuario,
        nome: admin.nome,
        role: admin.role,
        criadoEm: new Date().toISOString(),
        expiraEm: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 horas
      };
      
      this.sessoes.push(sessao);
      this.saveSessoes();
      
      return {
        success: true,
        sessao: sessao,
        admin: {
          id: admin.id,
          usuario: admin.usuario,
          nome: admin.nome,
          role: admin.role
        }
      };
    }
    
    return { success: false, error: 'Credenciais inválidas' };
  }

  // Verificar sessão ativa
  verificarSessao(sessaoId) {
    const sessao = this.sessoes.find(s => s.id === sessaoId);
    
    if (!sessao) {
      return { valid: false, error: 'Sessão não encontrada' };
    }
    
    // Verificar expiração
    if (new Date() > new Date(sessao.expiraEm)) {
      this.encerrarSessao(sessaoId);
      return { valid: false, error: 'Sessão expirada' };
    }
    
    // Estender sessão por mais 2 horas
    sessao.expiraEm = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    this.saveSessoes();
    
    return { 
      valid: true, 
      sessao: {
        id: sessao.id,
        usuario: sessao.usuario,
        nome: sessao.nome,
        role: sessao.role
      }
    };
  }

  // Encerrar sessão
  encerrarSessao(sessaoId) {
    this.sessoes = this.sessoes.filter(s => s.id !== sessaoId);
    this.saveSessoes();
  }

  // Verificar permissão
  temPermissao(sessaoId, permissao) {
    const sessao = this.sessoes.find(s => s.id === sessaoId);
    if (!sessao) return false;
    
    // Super admin tem todas as permissões
    if (sessao.role === 'super_admin') return true;
    
    // Admin tem permissões de desenvolvedor
    if (sessao.role === 'admin') {
      const permissoesAdmin = [
        'ver_configuracoes', 
        'editar_configuracoes_basicas', 
        'ver_logs',
        'ver_admins',
        'criar_admins',
        'remover_admins',
        'ver_usuarios',
        'editar_usuarios'
      ];
      return permissoesAdmin.includes(permissao);
    }
    
        
    return false;
  }

  // Listar administradores (apenas para super_admin)
  listarAdmins() {
    return this.admins.map(admin => ({
      id: admin.id,
      usuario: admin.usuario,
      nome: admin.nome,
      role: admin.role,
      criadoEm: admin.criadoEm,
      ultimoAcesso: admin.ultimoAcesso
    }));
  }

  // Criar novo administrador (apenas para super_admin)
  criarAdmin(dados) {
    const { usuario, senha, nome, role = 'admin' } = dados;
    
    if (!usuario || !senha || !nome) {
      throw new Error('Todos os campos são obrigatórios');
    }
    
    if (this.admins.find(a => a.usuario === usuario)) {
      throw new Error('Este usuário já existe');
    }
    
    const novoAdmin = {
      id: this.generateAdminId(),
      usuario: usuario.trim(),
      senha: senha,
      nome: nome.trim(),
      role: role,
      criadoEm: new Date().toISOString(),
      ultimoAcesso: null
    };
    
    this.admins.push(novoAdmin);
    this.saveAdmins();
    
    return novoAdmin;
  }

  // Remover administrador (apenas para super_admin)
  removerAdmin(adminId) {
    const adminIndex = this.admins.findIndex(a => a.id === adminId);
    if (adminIndex === -1) {
      throw new Error('Administrador não encontrado');
    }
    
    // Não permitir remover super_admin
    const admin = this.admins[adminIndex];
    if (admin.role === 'super_admin') {
      throw new Error('Não é possível remover um Super Admin');
    }
    
    this.admins.splice(adminIndex, 1);
    
    // Encerrar todas as sessões deste admin
    this.sessoes = this.sessoes.filter(s => s.adminId !== adminId);
    
    this.saveAdmins();
    this.saveSessoes();
    
    return true;
  }

  // Métodos auxiliares
  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateAdminId() {
    return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  saveSessoes() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('sophie-sessoes', JSON.stringify(this.sessoes));
      }
    } catch (error) {
      console.warn('Erro ao salvar sessões:', error);
    }
  }

  loadSessoes() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const sessoes = localStorage.getItem('sophie-sessoes');
        if (sessoes) {
          this.sessoes = JSON.parse(sessoes);
          // Limpar sessões expiradas
          this.sessoes = this.sessoes.filter(s => 
            new Date() <= new Date(s.expiraEm)
          );
          this.saveSessoes();
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar sessões:', error);
      this.sessoes = [];
    }
  }

  // Limpar sessões expiradas
  limparSessoesExpiradas() {
    this.sessoes = this.sessoes.filter(s => 
      new Date() <= new Date(s.expiraEm)
    );
    this.saveSessoes();
  }
}

// Instância global
export const adminAuth = new AdminAuth();

// Inicializar carregando sessões
adminAuth.loadSessoes();

// Funções de utilidade
export const validarSenhaAdmin = (senha) => {
  if (!senha || senha.length < 8) {
    return 'Senha deve ter pelo menos 8 caracteres';
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(senha)) {
    return 'Senha deve conter letras maiúsculas, minúsculas e números';
  }
  return null;
};

export const validarUsuarioAdmin = (usuario) => {
  if (!usuario || usuario.length < 4) {
    return 'Usuário deve ter pelo menos 4 caracteres';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(usuario)) {
    return 'Usuário deve conter apenas letras, números e underscore';
  }
  return null;
};
