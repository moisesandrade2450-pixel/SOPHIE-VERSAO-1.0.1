# SOPHIE - Sistema de Avisos Escolares Unificado

## 🚀 **NOVIDADES - Aplicação Unificada**

✅ **Porta única**: Tudo rodando em **http://localhost:8080**  
✅ **Interface única**: Todos os usuários acessam o mesmo sistema  
✅ **Detecção automática**: Mobile/Desktop e Web/Native  
✅ **Sem conflitos**: Código antigo preservado  

---

## 📋 O que é SOPHIE?

SOPHIE é um sistema de comunicação para salas de aula que permite que a diretora envie avisos/chamadas para salas específicas. As salas recebem:
- 📱 Mensagem visual na tela
- 🔔 Notificação sonora
- 🎤 Anúncio em voz alta (síntese de fala)
- 🔴 Indicador LED (animado na tela)

## 🚀 Como Usar (Versão Unificada)

### 1. **Iniciar Servidor**
```bash
npm run server
```

### 2. **Iniciar Aplicação Web**
```bash
npm run web
```

### 3. **Acessar Sistema**
Abra **http://localhost:8080** no navegador

### 4. **Selecionar Tipo de Usuário**
- 👨‍🎓 **Aluno** → Seleciona sala de aula
- 👩‍🏫 **Diretora** → Login com usuário/senha  
- ⚙️ **Administração** → Configurações do sistema

### 5. **Mobile (Opcional)**
```bash
npm start          # Expo Go
npm run android    # Android
npm run ios        # iOS
```

---

## 🏗️ Arquitetura Unificada

### Estrutura de Arquivos
```
PROJETOSOPHIE/
├── App.js                 # Entry point unificado com roteamento
├── LoginScreen.js         # Login para alunos e diretora
├── AdminRoute.js          # Login para administradores
├── DiretoraTela.js       # Interface da diretora
├── SalaTela.js          # Interface das salas
├── AdminPanelScreen.js    # Painel administrativo
├── server.js            # Backend (porta 8080)
├── databaseManager.js     # Sistema de banco de dados
├── accountManager.js     # Gestão de contas
└── constants.js         # Configurações globais
```

### Fluxo de Usuário
```
Acessar localhost:8080
    ↓
Selecionar tipo de usuário
    ↓
Login específico para o tipo
    ↓
Interface adequada ao perfil
```

### Pré-requisitos
- Node.js instalado
- Expo CLI (`npm install -g expo-cli`)

### Instalação
```bash
npm install
```

### Scripts Disponíveis
```json
{
  "start": "expo start",           # Expo Go
  "web": "expo start --web --port 8080",  # Web na porta 8080
  "android": "expo start --android", # Android
  "ios": "expo start --ios",       # iOS
  "server": "node server.js"       # Backend na porta 8080
}
```

### Iniciar o projeto

#### 🚀 Modo Web (Recomendado)
```bash
npm install
npm run web
```

#### 📱 Para Mobile
```bash
npm run android  # ou npm run ios
```

### 🌐 Como testar com múltiplos dispositivos/computadores:

#### Mesmo Computador (abas diferentes)
1. Execute `npm run web:chrome`
2. Abra múltiplas abas no navegador
3. Uma aba como **Diretora**, outras como **Salas**
4. Os dados se sincronizam automaticamente via localStorage

#### Computadores Diferentes na mesma rede Wi-Fi
1. **No Computador 1 (Diretora):**
   ```bash
   npm run web:chrome
   ```
   Anote o IP local exibido (ex: 192.168.1.100)

2. **No Computador 2 (Sala):**
   - Abra o navegador e acesse: `http://IP_DO_COMPUTADOR_1:19006`
   - Exemplo: `http://192.168.1.100:19006`

3. Os dados se sincronizam via localStorage compartilhado

### 🔧 Como Funciona a Sincronização

- **Mesma Aba/Navegador:** Usa `BroadcastChannel` API
- **Outro Dispositivo/Computador:** Usa `localStorage` com polling (verifica a cada 1 segundo)
- **Offline:** Funciona completamente offline com dados em localStorage
2. **No Computador 2 (Sala):** Execute `npm run sala`
3. **Descubra o IP** do computador principal:
   - Windows: Abra CMD e digite `ipconfig`
   - Linux/Mac: Abra terminal e digite `ifconfig` ou `ip addr`
4. **Acesse do outro computador usando o IP:**
   - **Diretora:** `http://[IP-DO-COMPUTADOR]:3000`
   - **Sala:** `http://[IP-DO-COMPUTADOR]:3001`

**Nota:** O Chrome é o navegador padrão para web.

## 👥 Perfis de usuário

### 1️⃣ Diretora
- **Login:** Usuário e senha (diretora/123456 ou admin/admin123)
- Envia avisos para uma ou múltiplas salas simultaneamente
- Seleciona salas por curso (Administração, DS, Edificações, Massoterapia)
- Vê histórico de todos os avisos enviados

### 2️⃣ Sala de Aula
- **Seleção:** Escolhe qual sala representa (12 salas disponíveis)
- Recebe avisos direcionados à sua sala específica
- Cada sala tem seu próprio espaço de dados isolado
- Exibe mensagem visual + LED + som + voz

## 🧪 Como testar

### Opção 1: Modo Combinado (uma aba para tudo)
```bash
npm run web:chrome
```
Depois faça login como diretora ou sala na mesma aba.

### Opção 2: Modos Separados (recomendado)

#### Terminal 1 - Diretora:
```bash
npm run diretora
```

#### Terminal 2 - Sala:
```bash
npm run sala
```

### Teste passo a passo:
1. **Computador 1:** Execute `npm run diretora` → Digite nome → Painel pronto
2. **Computador 2:** Execute `npm run sala` → Toque na sala desejada → Entra automaticamente
3. **Na Diretora:** Selecione sala → Digite nome da pessoa → Envie aviso
4. **Na Sala:** Recebe aviso + LED pisca + som toca + voz fala

## ✨ Funcionalidades Implementadas

✅ **Login com 2 perfis** (Diretora / Sala)
✅ **Comunicação em tempo real** (Firebase ou modo demo offline)
✅ **LED simulado** (pisca em vermelho ao receber aviso)
✅ **Som de notificação** (expo-audio - compatível com SDK 54)
✅ **Síntese de fala** 🎤 (App fala a mensagem em português)
✅ **Botão Repetir** (Pode ouvir aviso novamente)
✅ **Histórico de avisos** (Diretora vê todos os avisos enviados)
✅ **Design roxo/lilás** (Conforme solicitado)
✅ **3 salas de teste** (Matemática, Português, Inglês)
✅ **Modo demo offline** (Funciona sem internet/Firebase)

## 🎨 Cores do projeto
- **Roxo Escuro**: #7B1FA2 (primário)
- **Roxo Médio**: #9C27B0 (secundário)
- **Lilás Claro**: #E1BEE7 (backgrounds)

## 📦 Estrutura do projeto

```
PROJETOSOPHIE/
├── App.js                 # App combinado (modo antigo)
├── DiretoraEntry.js       # Ponto de entrada para Diretora
├── SalaEntry.js           # Ponto de entrada para Sala
├── DiretoraApp.js         # App independente da Diretora
├── SalaApp.js             # App independente da Sala
├── LoginScreen.js         # Login combinado (modo antigo)
├── DiretoraLogin.js       # Login simplificado para Diretora
├── SalaLogin.js           # Login simplificado para Sala
├── DiretoraTela.js        # Interface da diretora
├── SalaTela.js            # Interface da sala
├── constants.js           # Configurações (cores, salas)
├── firebaseConfig.js      # Config do Firebase
├── package.json           # Dependências e scripts
└── assets/                # Arquivos de mídia
```

## ⚙️ Configuração do Firebase

### Modo Demo (Padrão)
O projeto funciona **automaticamente em modo demo** sem configuração! 
- ✅ Comunicação simulada entre apps
- ✅ Funciona offline
- ✅ Perfeito para testes

### Para Produção (Opcional)
1. Acesse https://console.firebase.google.com
2. Crie um novo projeto
3. Ative "Realtime Database"
4. Copie as credenciais para `firebaseConfig.js`
5. Substitua a configuração demo pelas credenciais reais

**Nota:** Sem Firebase configurado, o app usa modo demo e funciona normalmente.

(Fácil expandir para 12 salas depois)

## 🔊 Som de notificação

Para adicionar som:
1. Adicione um arquivo `notification.mp3` em `assets/`
2. Ou deixe vazio (funciona sem som)

## 🐛 Troubleshooting

**"Módulo não encontrado"**
- Rode: `npm install`

**"Firebase não funciona"**
- Verifique a conexão com internet
- Verifique as credenciais em `firebaseConfig.js`

**"Som não toca"**
- Verifique se `assets/notification.mp3` existe
- Ou deixe sem som (opcional)

## 📱 Próximos passos
1. Expandir para 12 salas
2. Adicionar LED físico (Arduino/GPIO)
3. Adicionar autenticação segura
4. Banco de dados com histórico
5. Relatórios de avisos

---

**Status**: Em desenvolvimento | **Versão**: 1.0.0 Beta
