# Vídeo de apresentação

O vídeo mostra a demonstração do NexoLog em uso: navegação, filtros, escolha de categoria, produto, marca e variante, consulta de cadastros, relatórios por ano e rastreamento em movimento. A narração em português brasileiro e as legendas selecionáveis em Português BR e English acompanham as interações. O player do portfólio também permite desativar as legendas.

O roteiro está em `docs/roteiro-video.json`. As capturas usam somente a demonstração fictícia. A cena de rastreamento apresenta uma simulação, sem GPS real.

O MP4 é montado em Full HD (1920 × 1080), com pixels quadrados e enquadramento que preserva a proporção original das telas. A gravação da demonstração usa um viewport de 1440 × 810 para dar mais espaço visual aos textos e indicadores. Aguarde os indicadores e gráficos carregarem antes de começar cada cena. O Dashboard apresenta também o período de 12 meses para mostrar o histórico de entradas e saídas da base fictícia.

As cenas são capturadas diretamente da aplicação local, com dados fictícios. Cada capítulo fica em `build/video-recordings/00/` até `09/`, com quadros JPEG e `manifest.json` registrando o instante dos quadros e das ações. O montador preserva esses intervalos e gera a saída em 24 quadros por segundo, sincronizada com os áudios aprovados. A base usada na gravação fica separada do banco operacional e do banco distribuído.

## Reproduzir a montagem

Requisitos adicionais para gerar o vídeo: FFmpeg instalado e a biblioteca `edge-tts`. Eles são necessários apenas para a montagem da apresentação; o executável do NexoLog funciona sem essas ferramentas.

```powershell
.\.venv\Scripts\python.exe -m pip install edge-tts
.\.venv\Scripts\python.exe scripts\narrar_video_natural.py
.\.venv\Scripts\python.exe scripts\montar_video.py
```

A geração da narração usa uma conexão com o serviço de voz da Microsoft e envia somente o texto público do roteiro. A reprodução do MP4 utiliza o áudio já incluído no arquivo.

Os resultados ficam em `releases/video/`:

- `nexolog-apresentacao.mp4`: vídeo, áudio em português e duas faixas de legenda.
- `nexolog-pt.vtt` e `nexolog-en.vtt`: legendas usadas pelo player do site.
- `capitulos.json`: intervalos dos capítulos.

O montador calcula os tempos a partir dos áudios de cada frase e regenera as legendas, mantendo a sincronização após mudanças na narração. Ele prioriza as gravações de `build/video-recordings/`. Quando não existe uma gravação do capítulo, utiliza a captura de `build/video-frames/` ou a imagem de `docs/imagens/`.
