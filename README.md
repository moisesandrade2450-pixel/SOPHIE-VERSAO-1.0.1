# SOPHIE - Sistema de Avisos para Salas de Aula

## 🎯 Visão do Projeto
SOPHIE é um sistema escolar de avisos em tempo real, pensado para:
- abrir uma sala diretamente sem formulário de login
- permitir que a gestão acesse apenas com conta escolar
- enviar avisos direcionados para salas específicas
- entregar som e voz para os alunos da sala

## 🧭 Fluxo Atual
### Tela inicial
- mostra o nome do site: **SOPHIE**
- oferece duas opções: **Acessar Salas** e **Gestão Escolar**
- a área de salas abre diretamente sem login
- a área de gestão requer conta de **professor** ou **diretora**

### Salas
- o usuário escolhe a sala desejada
- a sala abre e permanece aberta
- não há login na parte de salas

### Gestão
- primeiro escolhe o perfil: **Professor** ou **Diretora**
- depois faz login com conta escolar
- após autenticar, pode enviar avisos para salas específicas

## 🏫 Salas já configuradas
As 12 salas do projeto estão em `constants.js`:
- Sala 1, Sala 2, Sala 3 → Administração
- Sala 4, Sala 5, Sala 6 → Desenvolvimento de Sistemas
- Sala 7, Sala 8, Sala 9 → Edificações
- Sala 10, Sala 11, Sala 12 → Massoterapia

## 🔧 Arquivos principais usados
- `App.js` — ponto de entrada do app
- `SimpleApp.js` — menu inicial, seleção de salas e fluxo de gestão
- `AlunoSalaTela.js` — tela da sala que mostra avisos
- `ProfessionalDiretoraTela.js` — painel da gestão para enviar avisos
- `constants.js` — definição de salas e cores
- `audioService.js` — som e síntese de voz
- `realtimeService.js` — comunicação em tempo real
- `server-realtime.js` — servidor WebSocket/API

## 🚀 Como rodar
```bash
npm install
npm run web
```

## 📌 Observações
- Não há login para acessar as salas.
- A gestão só entra via login escolar.
- A diretora/professor envia aviso para sala selecionada.
- O aviso deve chegar à sala com som e fala.

## 🎨 Paleta de cores
- Roxo escuro: `#9C27B0`
- Lilás: `#BA68C8`
- Branco: `#FFFFFF`

## 📂 Estrutura relevante do projeto
```
PROJETOSOPHIE/
├── App.js
├── SimpleApp.js
├── AlunoSalaTela.js
├── ProfessionalDiretoraTela.js
├── constants.js
├── audioService.js
├── realtimeService.js
├── server-realtime.js
└── README.md
```

## 💡 Resumo das alterações feitas
- menu inicial reorganizado para **Salas** e **Gestão**
- sala abre direto sem etapa de login
- gestão exige seleção de perfil e credenciais
- tela de ajuda/credenciais de teste removida do início
- README atualizado para a ideia real do projeto

## ✅ Status atual
O projeto agora está alinhado com a ideia: menu inicial limpo, seleção de sala direta e área de gestão protegida.

## 📱 Próximos passos
1. Expandir para 12 salas
2. Adicionar LED físico (Arduino/GPIO)
3. Adicionar autenticação segura
4. Banco de dados com histórico
5. Relatórios de avisos

---

**Status**: Em desenvolvimento | **Versão**: 1.0.0 Beta
