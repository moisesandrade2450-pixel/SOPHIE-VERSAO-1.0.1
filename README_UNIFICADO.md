# SOPHIE - Aplicação Unificada

## 🚀 Como Executar

### 1. Iniciar o Servidor Backend
```bash
npm run server
```

### 2. Iniciar a Aplicação Web
```bash
npm run web
```

A aplicação estará disponível em **http://localhost:8080**

### 3. Para Mobile (Opcional)
```bash
npm start          # Expo Go na porta 8082
npm run android    # Android na porta 8082
npm run ios        # iOS na porta 8082
```

**📱 Importante**: 
- **Web**: usa porta **8080**
- **Mobile**: usa porta **8082** (Expo Go)

## 📱 Como Funciona

Agora todos os usuários acessam a **mesma aplicação** na porta 8080:

1. **Tela de Seleção**: Ao acessar, o usuário escolhe seu tipo:
   - 👨‍🎓 **Aluno** - Acesso às salas de aula
   - 👩‍🏫 **Diretora** - Painel administrativo
   - ⚙️ **Administração** - Configurações do sistema

2. **Login Específico**: Cada tipo tem sua tela de login própria

3. **Interface Adequada**: Após login, mostra a interface correta para aquele tipo de usuário

## 🔧 Detecção Automática

A aplicação detecta automaticamente:
- **Dispositivo**: Mobile ou Desktop
- **Plataforma**: Web ou Nativo
- **Responsividade**: Interface adaptada para cada tela

## 📂 Estrutura Unificada

- **App.js**: Entry point principal com roteamento
- **LoginScreen.js**: Login para alunos e diretora
- **AdminRoute.js**: Login para administradores
- **server.js**: Backend na porta 8080

## 🌐 Acesso em Rede

Para acessar de outros dispositivos na mesma rede:
1. Descubra seu IP: `ipconfig` (Windows) ou `ifconfig` (Linux/Mac)
2. Acesse: `http://SEU_IP:8080`

## 📋 Fluxo de Usuário

```
Acessar localhost:8080
    ↓
Selecionar tipo de usuário
    ↓
Fazer login específico
    ↓
Ver interface adequada ao perfil
```

## 🔒 Perfis de Acesso

- **Aluno**: Visualiza salas, mensagens e avisos
- **Diretora**: Gerencia salas, alunos e conteúdo
- **Admin**: Configurações do sistema e manutenção

## 📱 Mobile vs Desktop

- **Mobile**: Interface otimizada para toque
- **Desktop**: Interface com mais espaço para informações
- **Responsivo**: Adaptação automática ao tamanho da tela
