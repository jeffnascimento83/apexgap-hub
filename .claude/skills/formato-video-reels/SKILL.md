---
name: formato-video-reels
description: Formato padrão dos vídeos de Instagram Profissional do usuário ("Como eu faço [resultado]", tela dividida com painel animado + apresentador + legendas palavra por palavra). Use SEMPRE que o usuário for editar, roteirizar, planejar cenas, legendar ou renderizar um vídeo/Reels/Story, ou pedir ideias de vídeo para o Instagram.
---

# Formato de vídeo — "Como eu faço [resultado]"

Formato de referência extraído de um Reels de 77s (tela dividida, painel animado + apresentador).
Referência só de **estrutura e estilo**: nunca copiar texto, marca ou identidade visual do vídeo original.

## Antes de começar (sempre perguntar se faltar)
- Tema/resultado do vídeo e público.
- @ do perfil, cores e fonte da marca (se ainda não estiverem preenchidos abaixo).
- Duração-alvo (padrão: 60–80s).

### Marca do usuário (preencher uma vez e manter atualizado)
- @: _(preencher)_
- Cores: fundo _(preencher)_ · acento _(preencher)_ · destaque da legenda _(preencher)_
- Fonte título: _(preencher)_ · fonte mono/UI: _(preencher)_ · fonte legenda: _(preencher)_
- Nicho: _(preencher)_

## Especificação técnica
- 9:16, 720×1280 (ou 1080×1920), 30fps, 60–80s.
- **Layout:** metade de cima (~56%) = painel animado; metade de baixo (~44%) = apresentador com legenda.
- **Cabeçalho fixo no topo do painel:** `@perfil · COMO EU FAÇO [X] · 03/11 · NOME DO PASSO` (numeração = barra de progresso/capítulo).
- **Marca d'água:** ícone do Instagram + @ no canto, o tempo todo (muda de lado para não cobrir a legenda).
- **Legenda:** palavra por palavra, branca, caixa-alta, fonte condensada bold, contorno escuro, 1–2 palavras-chave por frase em caixa de destaque (cor de acento). Posição: topo da área do apresentador.
- **Painel animado:** estética de terminal/UI escura, acento de cor única, fonte mono + um título em serifa. Cada trecho da fala vira uma cena. Nunca deixar o painel parado mais de ~6s.
- **Fechamento:** escurece, logo + @ + botão "seguir" enquanto fala o CTA.

## Estrutura do roteiro
| Tempo | Bloco | Regra |
|---|---|---|
| 0–5s | **Gancho** | Dor ou provocação, não tema. Ex.: "Todo mundo me pergunta como eu [resultado]… e tem gente vendendo isso por R$ X". |
| 5–10s | **Promessa** | "O que muda o jogo são alguns detalhes". |
| 10–55s | **Processo** | 5–7 passos, 1–2 frases cada, uma cena no painel por passo, numerados no cabeçalho. |
| 55–65s | **Insight/Gate** | A decisão, regra ou checagem que ninguém conta. É o diferencial do vídeo. |
| 65–72s | **Pergunta de engajamento** | "Você sabia dessa? Você faz diferente? Me conta". |
| 72–77s | **CTA** | "Segue o perfil". Pedir comentário antes de pedir seguir. |

Ritmo: ~20 palavras a cada 8s; troca de cena a cada 3–6s.

## Checklist de qualidade (conferir antes de entregar)
1. O gancho é uma dor/provocação nos primeiros 3s?
2. Todo passo tem cena no painel e número no cabeçalho?
3. Existe um insight/gate com opinião própria (não só passos)?
4. A legenda destaca palavras-chave e não cobre rosto nem marca d'água?
5. O CTA final é pergunta primeiro, seguir depois?
6. Texto, marca e visual são do usuário (nada copiado da referência)?

## Fluxo de produção
1. Usuário grava o vídeo falando.
2. Transcrever com **tempo por palavra** (Whisper ou equivalente). Se a transcrição automática não estiver disponível, pedir o texto ou ler as legendas queimadas.
3. Analisar alguns frames da gravação (enquadramento, gestos, fundo, onde ficam marca e legenda).
4. Montar **plano de cenas** sincronizado à fala (tempo → cena).
5. **Gate: mostrar o plano e esperar aprovação do usuário antes de renderizar** (evita gastar render em ideia ruim).
6. Gerar o código das animações (Remotion/React ou HyperFrames/HTML + GSAP) e renderizar o painel + legendas.
7. Combinar painel + gravação (ffmpeg) e exportar 9:16.

## Limites conhecidos
Na análise da referência não foram avaliados música, efeitos sonoros nem tom de voz. Perguntar ao usuário se ele quer um padrão de áudio.
