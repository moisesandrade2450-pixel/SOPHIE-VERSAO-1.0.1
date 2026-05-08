// ⚠️ CONFIGURAÇÃO DE TESTE - FUNCIONA OFFLINE
// Para produção, configure um projeto real no Firebase Console
// (Firebase não é necessário para o modo demo com localStorage)

// ⚠️ MODO DEMO: Simula Firebase para testes locais
// Comunicação entre dispositivos via localStorage + polling
class MockFirebase {
  constructor() {
    this.data = {};
    this.listeners = {};
    this.broadcastChannel = null;

    // Usar BroadcastChannel para comunicação entre abas/janelas do MESMO navegador
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      try {
        this.broadcastChannel = new BroadcastChannel('sophie-firebase-mock');
        this.broadcastChannel.onmessage = (event) => {
          try {
            const { path, data } = event.data;
            if (path && data) {
              this.data[path] = { ...this.data[path], ...data };
              // Notificar listeners locais
              if (this.listeners[path]) {
                this.listeners[path]({ exists: () => true, val: () => this.data[path] });
              }
            }
          } catch (error) {
            console.warn('Erro ao processar mensagem BroadcastChannel:', error);
          }
        };
      } catch (error) {
        console.warn('Erro ao criar BroadcastChannel:', error);
        this.broadcastChannel = null;
      }
    }

    // Carregar dados do localStorage
    this.loadFromStorage();

    // Polling para sincronizar com localStorage (para múltiplos dispositivos)
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.syncFromStorage();
      }, 1000); // Verificar a cada 1 segundo
    }
  }

  loadFromStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('sophie-firebase-data');
        if (stored) {
          this.data = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Erro ao carregar dados do localStorage:', e);
      }
    }
  }

  syncFromStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('sophie-firebase-data');
        if (stored) {
          const newData = JSON.parse(stored);
          
          // Comparar e notificar listeners de mudanças
          Object.keys(newData).forEach((path) => {
            if (JSON.stringify(this.data[path]) !== JSON.stringify(newData[path])) {
              this.data[path] = newData[path];
              if (this.listeners[path]) {
                this.listeners[path]({ exists: () => true, val: () => this.data[path] });
              }
            }
          });
        }
      } catch (e) {
        console.warn('Erro ao sincronizar localStorage:', e);
      }
    }
  }

  saveToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('sophie-firebase-data', JSON.stringify(this.data));
      } catch (e) {
        console.warn('Erro ao salvar dados no localStorage:', e);
      }
    }
  }

  ref(path) {
    return {
      path,
      push: (data) => {
        const key = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        this.data[path] = this.data[path] || {};
        this.data[path][key] = { ...data, id: key };

        // Salvar no localStorage (sincroniza com outros dispositivos)
        this.saveToStorage();

        // Broadcast para outras abas/janelas
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({ path, data: this.data[path] });
        }

        // Notificar listeners locais
        if (this.listeners[path]) {
          this.listeners[path]({ exists: () => true, val: () => this.data[path] });
        }

        return { key };
      }
    };
  }

  onValue(ref, callback) {
    const path = ref.path || 'unknown';
    this.listeners[path] = callback;

    // Retornar dados atuais
    setTimeout(() => {
      callback({ exists: () => true, val: () => this.data[path] || {} });
    }, 100);
  }

  off(ref) {
    const path = ref.path || 'unknown';
    delete this.listeners[path];
  }
}

let mockDb = null;

// ⚠️ SEMPRE USAR MODO DEMO para testes locais com comunicação entre dispositivos
mockDb = new MockFirebase();

// Exportar database (sempre mock para testes locais)
export const database = mockDb;

// Função para limpar dados (útil para testes)
export function clearMockData() {
  if (mockDb) {
    mockDb.data = {};
    mockDb.saveToStorage();
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('sophie-firebase-data');
    }
  }
}
