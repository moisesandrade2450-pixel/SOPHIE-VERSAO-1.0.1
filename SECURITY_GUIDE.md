# 🔐 Guia de Segurança - SOPHIE

## 📋 Visão Geral

O SOPHIE agora possui um sistema de segurança avançado com acesso administrativo restrito para proteger as configurações do sistema.

## 👥 Equipe do Projeto SOPHIE

### Super Admin (1 pessoa)
- **Usuário:** moises
- **Senha:** devmaster2026
- **Nome:** Moisés (Desenvolvedor Principal)
- **Permissões:** Controle total do sistema

### Desenvolvedores (5 pessoas)
- **Usuários:** adriano, gustavo, cecilia, caiobruno, pedrolucas
- **Senha:** sophie2026
- **Permissões:** Desenvolvimento e configurações do sistema

## Acessos e Portas

| Serviço | Porta | Descrição | Acesso |
|---------|-------|-----------|--------|
| Painel Admin | 3003 | Configurações administrativas | Apenas admins |
| Diretora | 3000 | Envio de avisos | Diretoras autorizadas |
| Salas | 3001 | Recebimento de avisos | Salas de aula |
| Servidor API | 3002 | Backend | Comunicação interna |

## 🛡️ Recursos de Segurança

### Autenticação
- ✅ Senhas fortes (mínimo 8 caracteres)
- ✅ Bloqueio após 3 tentativas falhas
- ✅ Sessões com expiração automática (2 horas)
- ✅ Logout automático por inatividade

### Permissões
- 🔑 **Super Admin (Moisés)**: Controle total do sistema
- 👨‍💻 **Desenvolvedores**: Configurações, usuários, admins, logs
- 👩‍🏫 **Diretora**: Envio de avisos
- 🏫 **Sala**: Recebimento de avisos

### Proteção de Dados
- 📦 Dados criptografados em localStorage
- 🚫 Acesso restrito a configurações
- 📝 Log de atividades (opcional)
- 🔐 Sessões seguras com tokens

## 🚀 Como Usar

### Acessar Painel Administrativo
```bash
# Iniciar painel admin
npm run admin

# Acessar no navegador
http://localhost:3003
```

### Acessar Sistema Normal
```bash
# Diretora
npm run diretora  # → http://localhost:3000

# Sala
npm run sala      # → http://localhost:3001
```

### Para Acesso Remoto
1. Descubra o IP: `ipconfig` (Windows)
2. Substitua localhost pelo IP
3. Ex: `http://192.168.1.100:3003` (Admin)

## ⚙️ Configurações Protegidas

Apenas administradores podem acessar:

### 📊 Geral
- Informações do sistema
- Estatísticas de uso
- Configurações gerais

### 👥 Admins
- Criar/remover administradores
- Gerenciar permissões
- Ver logs de acesso

### 👤 Usuários
- Listar contas de usuários
- Gerenciar diretoras e salas
- Histórico de atividades

### 🔧 Configurações
- Permitir/criar contas
- Exigir senhas fortes
- Ativar logs
- Limpar dados do sistema

## 🚨 Medidas de Segurança

### Para Administradores
1. **Nunca compartilhe credenciais**
2. **Use senhas fortes e únicas**
3. **Faça logout após usar**
4. **Monitore atividades suspeitas**

### Para o Sistema
1. **Backup regular dos dados**
2. **Atualização de senhas periodicamente**
3. **Monitoramento de tentativas de acesso**
4. **Limpeza de sessões expiradas**

## 🔄 Fluxo de Acesso

1. **Login Admin** → Verificação de credenciais
2. **Sessão Criada** → Token de 2 horas
3. **Acesso Autorizado** → Painel administrativo
4. **Verificação Contínua** → Sessão renovada
5. **Logout Automático** → Sessão encerrada

## 📱 Compatibilidade

- ✅ Web (Chrome, Firefox, Safari)
- ✅ Android
- ✅ iOS
- ✅ Tablets
- ✅ Desktop

## 🛠️ Manutenção

### Diário
- Verificar logs de acesso
- Monitorar atividades

### Semanal
- Limpar sessões expiradas
- Verificar atualizações

### Mensal
- Alterar senhas admin
- Backup de configurações

## 🆘 Suporte

Em caso de problemas de segurança:

1. **Contate o Super Admin** (Moisés - moises)
2. **Verifique logs de acesso**
3. **Monitore atividades suspeitas**
4. **Considere reset de senhas**

---

**Status:** ✅ Sistema Seguro Ativo  
**Versão:** v1.0.0  
**Última Atualização:** 05/05/2026
