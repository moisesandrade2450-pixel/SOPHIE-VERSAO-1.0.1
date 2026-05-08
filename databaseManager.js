// Sistema de Banco de Dados Local para SOPHIE
// Substitui localStorage por um sistema mais robusto

class DatabaseManager {
  constructor() {
    this.dbName = 'sophie_database';
    this.version = 1;
    this.db = null;
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        try {
          const request = indexedDB.open(this.dbName, this.version);
          
          request.onerror = (event) => {
            console.error('Erro ao abrir banco de dados:', event.target.error);
            // Fallback para localStorage em caso de erro
            console.warn('⚠️ Usando localStorage fallback devido a erro no IndexedDB');
            this.useLocalStorageFallback();
            resolve(null);
          };
          
          request.onsuccess = (event) => {
            this.db = event.target.result;
            console.log('✅ Banco de dados inicializado com sucesso');
            resolve(this.db);
          };
          
          request.onupgradeneeded = (event) => {
            try {
              const db = event.target.result;
              
              // Criar object stores
              if (!db.objectStoreNames.contains('contas')) {
                const contasStore = db.createObjectStore('contas', { keyPath: 'id', autoIncrement: true });
                contasStore.createIndex('usuario', 'usuario', { unique: true });
                contasStore.createIndex('role', 'role', { unique: false });
                console.log('📝 Store de contas criado');
              }
              
              if (!db.objectStoreNames.contains('mensagens')) {
                const mensagensStore = db.createObjectStore('mensagens', { keyPath: 'id', autoIncrement: true });
                mensagensStore.createIndex('salaId', 'salaId', { unique: false });
                mensagensStore.createIndex('recebidoEm', 'recebidoEm', { unique: false });
                console.log('📝 Store de mensagens criado');
              }
              
              if (!db.objectStoreNames.contains('configuracoes')) {
                const configStore = db.createObjectStore('configuracoes', { keyPath: 'chave', autoIncrement: false });
                console.log('📝 Store de configurações criado');
              }
            } catch (error) {
              console.error('Erro ao criar object stores:', error);
              // Fallback para localStorage
              this.useLocalStorageFallback();
              resolve(null);
            }
          };
        } catch (error) {
          console.error('Erro ao inicializar IndexedDB:', error);
          // Fallback para localStorage
          console.warn('⚠️ Usando localStorage fallback devido a erro no IndexedDB');
          this.useLocalStorageFallback();
          resolve(null);
        }
      } else {
        // Fallback para localStorage se IndexedDB não estiver disponível
        console.warn('⚠️ IndexedDB não disponível, usando localStorage fallback');
        this.useLocalStorageFallback();
        resolve(null);
      }
    });
  }

  useLocalStorageFallback() {
    // Implementar fallback com localStorage para compatibilidade
    this.storage = {
      get: (key) => {
        try {
          const data = localStorage.getItem(key);
          return data ? JSON.parse(data) : null;
        } catch (error) {
          console.error('Erro ao ler do localStorage:', error);
          return null;
        }
      },
      set: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error('Erro ao salvar no localStorage:', error);
        }
      },
      remove: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Erro ao remover do localStorage:', error);
        }
      },
      clear: () => {
        try {
          localStorage.clear();
        } catch (error) {
          console.error('Erro ao limpar localStorage:', error);
        }
      }
    };
  }

  // Operações de Contas
  async salvarConta(conta) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['contas'], 'readwrite');
        const store = transaction.objectStore('contas');
        const request = store.put(conta);
        
        request.onsuccess = () => {
          console.log('✅ Conta salva com sucesso:', conta.usuario);
          resolve(conta);
        };
        
        request.onerror = (event) => {
          console.error('❌ Erro ao salvar conta:', event.target.error);
          reject(event.target.error);
        };
      });
    } else {
      // Fallback localStorage
      const contas = this.storage.get('contas') || [];
      const index = contas.findIndex(c => c.id === conta.id);
      if (index >= 0) {
        contas[index] = conta;
      } else {
        contas.push(conta);
      }
      this.storage.set('contas', contas);
      return Promise.resolve(conta);
    }
  }

  async listarContas(role = null) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['contas'], 'readonly');
        const store = transaction.objectStore('contas');
        const request = store.getAll();
        
        request.onsuccess = () => {
          let contas = request.result;
          if (role) {
            contas = contas.filter(c => c.role === role);
          }
          console.log(`📋 Listando ${contas.length} contas${role ? ' do tipo ' + role : ''}`);
          resolve(contas);
        };
        
        request.onerror = (event) => {
          console.error('❌ Erro ao listar contas:', event.target.error);
          reject(event.target.error);
        };
      });
    } else {
      // Fallback localStorage
      let contas = this.storage.get('contas') || [];
      if (role) {
        contas = contas.filter(c => c.role === role);
      }
      return Promise.resolve(contas);
    }
  }

  async buscarConta(usuario) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['contas'], 'readonly');
        const store = transaction.objectStore('contas');
        const index = store.index('usuario');
        const request = index.get(usuario);
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = (event) => {
          console.error('❌ Erro ao buscar conta:', event.target.error);
          reject(event.target.error);
        };
      });
    } else {
      // Fallback localStorage
      const contas = this.storage.get('contas') || [];
      const conta = contas.find(c => c.usuario === usuario);
      return Promise.resolve(conta || null);
    }
  }

  async excluirConta(id) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['contas'], 'readwrite');
        const store = transaction.objectStore('contas');
        const request = store.delete(id);
        
        request.onsuccess = () => {
          console.log('✅ Conta excluída com sucesso');
          resolve(true);
        };
        
        request.onerror = (event) => {
          console.error('❌ Erro ao excluir conta:', event.target.error);
          reject(event.target.error);
        };
      });
    } else {
      // Fallback localStorage
      const contas = this.storage.get('contas') || [];
      const novasContas = contas.filter(c => c.id !== id);
      this.storage.set('contas', novasContas);
      return Promise.resolve(true);
    }
  }

  // Operações de Mensagens
  async salvarMensagem(mensagem) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['mensagens'], 'readwrite');
        const store = transaction.objectStore('mensagens');
        const request = store.add(mensagem);
        
        request.onsuccess = () => {
          console.log('✅ Mensagem salva com sucesso');
          resolve(mensagem);
        };
        
        request.onerror = (event) => {
          console.error('❌ Erro ao salvar mensagem:', event.target.error);
          reject(event.target.error);
        };
      });
    } else {
      // Fallback localStorage
      const mensagens = this.storage.get('mensagens') || [];
      mensagens.push(mensagem);
      this.storage.set('mensagens', mensagens);
      return Promise.resolve(mensagem);
    }
  }

  async listarMensagens(salaId = null, limite = 50) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['mensagens'], 'readonly');
        const store = transaction.objectStore('mensagens');
        let request;
        
        if (salaId) {
          const index = store.index('salaId');
          request = index.getAll(salaId);
        } else {
          request = store.getAll();
        }
        
        request.onsuccess = () => {
          let mensagens = request.result;
          // Ordenar por data (mais recente primeiro)
          mensagens.sort((a, b) => new Date(b.recebidoEm) - new Date(a.recebidoEm));
          // Limitar quantidade
          if (limite && mensagens.length > limite) {
            mensagens = mensagens.slice(0, limite);
          }
          console.log(`📋 Listando ${mensagens.length} mensagens`);
          resolve(mensagens);
        };
        
        request.onerror = (event) => {
          console.error('❌ Erro ao listar mensagens:', event.target.error);
          reject(event.target.error);
        };
      });
    } else {
      // Fallback localStorage
      let mensagens = this.storage.get('mensagens') || [];
      if (salaId) {
        mensagens = mensagens.filter(m => m.salaId === salaId);
      }
      mensagens.sort((a, b) => new Date(b.recebidoEm) - new Date(a.recebidoEm));
      if (limite && mensagens.length > limite) {
        mensagens = mensagens.slice(0, limite);
      }
      return Promise.resolve(mensagens);
    }
  }

  // Operações de Configurações
  async salvarConfiguracao(chave, valor) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['configuracoes'], 'readwrite');
        const store = transaction.objectStore('configuracoes');
        const request = store.put({ chave, valor });
        
        request.onsuccess = () => {
          console.log('✅ Configuração salva:', chave);
          resolve(valor);
        };
        
        request.onerror = (event) => {
          console.error('❌ Erro ao salvar configuração:', event.target.error);
          reject(event.target.error);
        };
      });
    } else {
      // Fallback localStorage
      this.storage.set(`config_${chave}`, valor);
      return Promise.resolve(valor);
    }
  }

  async buscarConfiguracao(chave) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['configuracoes'], 'readonly');
        const store = transaction.objectStore('configuracoes');
        const request = store.get(chave);
        
        request.onsuccess = () => {
          resolve(request.result ? request.result.valor : null);
        };
        
        request.onerror = (event) => {
          console.error('❌ Erro ao buscar configuração:', event.target.error);
          reject(event.target.error);
        };
      });
    } else {
      // Fallback localStorage
      const valor = this.storage.get(`config_${chave}`);
      return Promise.resolve(valor || null);
    }
  }

  // Limpeza e Manutenção
  async limparDadosAntigos(dias = 30) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);
    
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['mensagens'], 'readwrite');
        const store = transaction.objectStore('mensagens');
        const index = store.index('recebidoEm');
        const request = index.openCursor(IDBKeyRange.upperBound(dataLimite));
        
        let excluidos = 0;
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            excluidos++;
            cursor.continue();
          } else {
            console.log(`🧹 Limpados ${excluidos} registros antigos`);
            resolve(excluidos);
          }
        };
        
        request.onerror = (event) => {
          console.error('❌ Erro ao limpar dados:', event.target.error);
          reject(event.target.error);
        };
      });
    } else {
      // Fallback localStorage
      const mensagens = this.storage.get('mensagens') || [];
      const mensagensFiltradas = mensagens.filter(m => new Date(m.recebidoEm) >= dataLimite);
      this.storage.set('mensagens', mensagensFiltradas);
      const excluidos = mensagens.length - mensagensFiltradas.length;
      console.log(`🧹 Limpados ${excluidos} registros antigos (fallback)`);
      return Promise.resolve(excluidos);
    }
  }

  async estatisticas() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['contas', 'mensagens'], 'readonly');
        const contasStore = transaction.objectStore('contas');
        const mensagensStore = transaction.objectStore('mensagens');
        
        Promise.all([
          contasStore.getAll(),
          mensagensStore.getAll()
        ]).then(([contas, mensagens]) => {
          const stats = {
            totalContas: contas.length,
            contasPorRole: contas.reduce((acc, conta) => {
              acc[conta.role] = (acc[conta.role] || 0) + 1;
              return acc;
            }, {}),
            totalMensagens: mensagens.length,
            mensagensHoje: mensagens.filter(m => {
              const hoje = new Date();
              const dataMsg = new Date(m.recebidoEm);
              return dataMsg.toDateString() === hoje.toDateString();
            }).length,
            ultimaMensagem: mensagens.length > 0 ? 
              mensagens.reduce((maisRecente, msg) => 
                new Date(msg.recebidoEm) > new Date(maisRecente.recebidoEm) ? msg : maisRecente
              ).recebidoEm : null
          };
          console.log('📊 Estatísticas geradas:', stats);
          resolve(stats);
        }).catch(reject);
      });
    } else {
      // Fallback localStorage
      const contas = this.storage.get('contas') || [];
      const mensagens = this.storage.get('mensagens') || [];
      const stats = {
        totalContas: contas.length,
        contasPorRole: contas.reduce((acc, conta) => {
          acc[conta.role] = (acc[conta.role] || 0) + 1;
          return acc;
        }, {}),
        totalMensagens: mensagens.length,
        mensagensHoje: mensagens.filter(m => {
          const hoje = new Date();
          const dataMsg = new Date(m.recebidoEm);
          return dataMsg.toDateString() === hoje.toDateString();
        }).length,
        ultimaMensagem: mensagens.length > 0 ? 
          mensagens.reduce((maisRecente, msg) => 
            new Date(msg.recebidoEm) > new Date(maisRecente.recebidoEm) ? msg : maisRecente
          ).recebidoEm : null
      };
      return Promise.resolve(stats);
    }
  }
}

// Instância global do banco de dados
const databaseManager = new DatabaseManager();

export default databaseManager;
