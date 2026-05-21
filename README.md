# SOPHIE — Sistema de Avisos para Salas

Sistema escolar web de avisos em tempo real, com terminais por sala e painel de gestão protegido por conta.

## ✨ Funcionalidades

- 🏫 **12 salas** organizadas em 4 cursos com **cores próprias**:
  - 🔵 Administração (azul)
  - 🟣 Desenvolvimento de Sistemas (roxo)
  - 🔴 Edificações (vermelho)
  - 🟢 Massoterapia (verde)
- 📺 **Terminal de sala** otimizado para projeção (tela cheia, alto contraste)
- 🔔 **Som + voz sintetizada** ao receber novos avisos (Web Audio + SpeechSynthesis)
- 🔐 **Gestão escolar** com login/cadastro por perfil (professor / diretora)
- ⚡ **Tempo real** via Lovable Cloud (Supabase Realtime)
- 🎯 Avisos direcionados: sala única, curso inteiro ou todas as salas

## 🚀 Rodando no VS Code

### Pré-requisitos

- [Node.js 20+](https://nodejs.org/) ou [Bun](https://bun.sh/) (recomendado)
- VS Code com as extensões: **ESLint**, **Tailwind CSS IntelliSense**, **TypeScript**

### Passo a passo

```bash
# 1. Instalar dependências
bun install
# (ou) npm install

# 2. Rodar em modo desenvolvimento
bun dev
# (ou) npm run dev

# 3. Abrir no navegador
# http://localhost:8080
```

O `.env` já vem preenchido com as credenciais do Lovable Cloud — nada a configurar.

### Dois computadores na mesma rede (telão + gestão)

O `npm run dev` já sobe com `--host` (aceita outros PCs na rede).

1. **No PC que roda o projeto** (deixe o terminal aberto com `npm run dev`).
2. No terminal, copie o endereço **Network** (ex.: `http://192.168.40.129:8080/`) — **não use `localhost` no outro PC**.
3. Os dois PCs precisam estar no **mesmo Wi‑Fi** (ou mesma rede cabeada).
4. Se não abrir no outro PC, permita a porta no Firewall do Windows (8080 ou 8081).

| Computador      | Abrir no navegador                   |
| --------------- | ------------------------------------ |
| Gestão / início | `http://IP_DO_PC:8080/` ou `/gestao` |
| Telão da sala 3 | `http://IP_DO_PC:8080/salas/3`       |
| Lista de salas  | `http://IP_DO_PC:8080/salas`         |

Substitua `IP_DO_PC` pelo IPv4 da máquina que está com `npm run dev` (ex. `192.168.40.129`).

**Erro comum:** no 2º computador usar `localhost` — isso aponta para o próprio PC, não para o servidor.

## 📁 Estrutura

```
src/
├── routes/
│   ├── index.tsx              # Tela inicial
│   ├── salas.tsx              # Grade de 12 salas
│   ├── salas_.$salaId.tsx     # Terminal de uma sala (tela do telão)
│   ├── gestao.tsx             # Login / cadastro (professor / diretora)
│   └── gestao_.painel.tsx     # Painel para enviar avisos
├── lib/
│   ├── salas.ts               # Dados das 12 salas + cores por curso
│   ├── audio.ts               # Chime + síntese de voz (navegador)
│   └── gestao-auth.ts         # Login, cadastro e perfis
├── components/
│   └── SophieNav.tsx
├── integrations/supabase/
└── styles.css

hardware/esp32-sala/           # Firmware opcional da caixinha (ESP32)
docs/caixinha-esp32.md         # Guia completo: telão + caixinha sem BT no PC

supabase/migrations/
```

## 🗄️ Banco de dados

Duas tabelas principais (criadas automaticamente):

- **`avisos`** — `sala_id`, `titulo`, `mensagem`, `enviado_por`, `created_at`
- **`user_roles`** — vincula cada usuário a um perfil (`professor` ou `diretora`)

Regras de segurança (RLS) ativas:

- Qualquer um pode **ler** avisos (necessário para os terminais)
- Apenas usuários autenticados com perfil `professor` ou `diretora` podem **inserir** avisos

## 👥 Como criar conta de gestão

1. Acesse `/gestao`
2. Escolha o perfil (**Professor** ou **Diretora**)
3. Clique em **Criar conta**, informe email e senha
4. Login automático — sem necessidade de confirmar email
5. Redireciona para `/gestao/painel` para enviar avisos

### ⚠️ Erro ao enviar aviso (“sem permissão” / não reconhece diretora)

O banco usa uma regra que estava bloqueando o envio. **Rode uma vez** o SQL em `supabase/FIX-ENVIAR-AVISOS.sql`:

1. Abra [Supabase Dashboard](https://supabase.com/dashboard) → projeto do SOPHIE → **SQL Editor**
2. Cole o conteúdo de `supabase/FIX-ENVIAR-AVISOS.sql` e clique **Run**
3. Saia do painel (`Sair`) e entre de novo em `/gestao`

## 📡 Como funcionam os avisos em tempo real

```
Gestão envia aviso → INSERT em `avisos` → Supabase Realtime
   → Terminal da sala recebe → Toca chime → Fala via TTS → Exibe na tela
```

A primeira vez que abrir o terminal, o navegador exige clique em **"Ativar som e voz"** (política de autoplay).

## 🔒 Quem pode fazer o quê (segurança)

| Página                       | Login?                      | O que faz                             |
| ---------------------------- | --------------------------- | ------------------------------------- |
| `/gestao` e `/gestao/painel` | Sim (professor ou diretora) | **Criar conta** e **enviar** avisos   |
| `/salas` e `/salas/XX`       | Não (público)               | **Só ver e ouvir** avisos já enviados |

Um aluno que abrir o terminal da sala **não envia** comunicados — o mesmo vale para a caixinha ESP32, que só **lê** o banco (chave pública, sem permissão de escrita).

## 🔊 Telão + caixinha (sem Bluetooth no PC)

Cenário pedido pela escola:

- **Telão:** navegador em `/salas/XX` (imagem do aviso).
- **Caixinha:** aparelho à parte (ESP32 + alto-falante), Wi‑Fi da escola, **sem** parear Bluetooth no computador do projetor.

```
Gestão (login) → Supabase → Telão (site) + Caixinha (ESP32)
```

- **Modo rápido (sem hardware):** caixinha com **cabo P2/USB** no PC; som pelo site (`audio.ts`).
- **Modo independente (trabalho / feira):** firmware em `hardware/esp32-sala/` — guia em **[docs/caixinha-esp32.md](docs/caixinha-esp32.md)**.

## 🛠️ Stack técnica

- **Frontend**: React 19 + TanStack Start + TanStack Router
- **Build**: Vite 7
- **Estilo**: Tailwind CSS v4 (tokens em `src/styles.css`)
- **Backend**: Lovable Cloud (Supabase: Auth + Postgres + Realtime)
- **Linguagem**: TypeScript (strict)

## 📜 Scripts

```bash
bun dev        # desenvolvimento (porta 8080)
bun run build  # build de produção
bun run lint   # verifica código com ESLint
```

## 🔜 Próximos passos sugeridos

- [x] Documentação da caixinha ESP32 (`docs/caixinha-esp32.md`)
- [x] Sketch de exemplo (`hardware/esp32-sala/esp32_sala.ino`)
- [ ] LED físico na caixinha (GPIO)
- [ ] Histórico de avisos por sala
- [ ] Relatórios de envios
- [ ] Agendamento de avisos

---

**Status**: Beta · **Versão**: 1.0.0
