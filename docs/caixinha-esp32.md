# Caixinha de som independente (ESP32)

Guia para montar o **alerta sonoro por sala** sem depender do navegador do telão e **sem Bluetooth no computador** do projetor.

## O que a escola pediu (em linguagem simples)

| Pedido                       | Como o SOPHIE atende                                            |
| ---------------------------- | --------------------------------------------------------------- |
| Telão mostra o aviso         | Página `/salas/XX` no projetor (só imagem)                      |
| Caixinha toca ao lado        | ESP32 + alto-falante (este guia)                                |
| Sem Bluetooth no PC do telão | Caixinha usa **Wi‑Fi da escola**, não o PC                      |
| Só gestão manda aviso        | Professor/Diretora em `/gestao/painel` (login)                  |
| Aluno não “vira diretor”     | Sala pública só **lê** avisos; ESP32 também só **ouve** o banco |

## Arquitetura

```
                    ┌─────────────────────┐
  Professor/Diretora│  /gestao/painel     │
  (login + senha)   │  envia aviso        │
                    └──────────┬──────────┘
                               │ INSERT
                               ▼
                    ┌─────────────────────┐
                    │  Supabase (nuvem)   │
                    │  tabela `avisos`    │
                    └──────────┬──────────┘
                               │ Realtime / REST
              ┌────────────────┼────────────────┐
              ▼                                 ▼
   ┌────────────────────┐            ┌────────────────────┐
   │ Telão (navegador)  │            │ Caixinha (ESP32)   │
   │ /salas/3           │            │ Wi‑Fi + buzzer     │
   │ só tela            │            │ bip ao novo aviso  │
   └────────────────────┘            └────────────────────┘
```

O telão e a caixinha são **dois “ouvidos”** do mesmo aviso. Nenhum dos dois precisa de cabo entre si.

## Lista de materiais (estimativa)

| Item                                | Função                   | Faixa de preço (referência) |
| ----------------------------------- | ------------------------ | --------------------------- |
| ESP32 DevKit (30 pinos)             | “Cérebro” na sala        | R$ 25–45                    |
| Módulo PAM8403 + alto-falante 8Ω 3W | Som mais alto que buzzer | R$ 15–35                    |
| Buzzer passivo 5V (opcional)        | Bip simples, mais barato | R$ 3–8                      |
| Fonte 5V 2A (USB)                   | Alimentação              | R$ 15–25                    |
| Cabos jumper                        | Ligações                 | R$ 5–10                     |

**Montagem mínima (bip):** ESP32 → buzzer no pino GPIO 25 + GND.

**Montagem com “caixinha”:** ESP32 → PAM8403 (I2S ou PWM) → alto-falante dentro de caixa de som.

## Rede e segurança

- O ESP32 usa a **chave pública (anon)** do Supabase, igual ao terminal da sala no site.
- Essa chave só permite **ler** avisos (RLS) — **não** enviar comunicados.
- Configure **Wi‑Fi da escola** no firmware (SSID/senha no arquivo `config.h`, não commitar senha no Git).
- Fixe o ESP32 atrás do telão ou na caixa; alunos não “usam” o aparelho como site.

## Firmware de exemplo

Código em `hardware/esp32-sala/esp32_sala.ino`:

1. Conecta no Wi‑Fi.
2. A cada 2 segundos consulta o último aviso da sala configurada.
3. Se aparecer um `id` novo → toca sequência de bips.

Para usar:

1. Instale [Arduino IDE](https://www.arduino.cc/en/software) ou PlatformIO.
2. Placa: **ESP32 Dev Module**.
3. Copie `config.h.example` → `config.h` e preencha Wi‑Fi + `SALA_ID` (1 a 12).
4. Grave o ESP32.

### Evolução (trabalho / bônus)

- Trocar polling por **Supabase Realtime** (WebSocket) para latência menor.
- LED RGB piscando junto com o som (já previsto no roadmap do projeto).
- Caixa impressa em 3D com número da sala.

## Instalação na sala (passo a passo)

1. **Telão:** PC/notebook → HDMI → projetor; abrir `https://seu-dominio/salas/03` em tela cheia (pode **mutar** o PC se a caixinha cuidar do som).
2. **Caixinha:** ESP32 ligado na tomada, alto-falante na mesa ao lado; `SALA_ID=3` no firmware.
3. **Gestão:** Diretora/professor envia teste pelo painel → deve aparecer no telão **e** bipar na caixinha.
4. **Bluetooth do PC do telão:** desligado ou sem parear caixas — evita interferência de celular.

## Modo só software (sem ESP32)

Se ainda não tiver o hardware:

- Caixinha **com cabo P2/USB** no PC do telão = som pelo site (`audio.ts`), sem Bluetooth.
- Ou **celular velho** + cabo na caixinha, abrindo `/salas/XX` só para áudio.

## Texto para apresentação oral (30 s)

> “O SOPHIE separa imagem e som: o telão é um terminal web público que só exibe avisos autorizados. O som pode sair de uma caixinha com ESP32 ligada ao mesmo banco na nuvem, sem Bluetooth no computador do projetor. Quem envia mensagem é só a gestão, com login de professor ou diretora.”
