"""Prepara o cartão, a página e os downloads na cópia local do portfólio."""
from pathlib import Path
import hashlib
import re
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PORTFOLIO = ROOT.parent / 'NexoLog-portfolio'

CARD_STYLE = '''
    @media (min-width:951px) {
      #nexolog .nexolog-player video { height:270px; aspect-ratio:auto; object-fit:contain; }
      #nexolog .nexolog-controls { height:63px; }
      #nexolog .nexolog-status { display:none; }
    }
'''

STYLE = '''
    .nexolog-player { background:#030a16; border-bottom:1px solid #21435b; }
    .nexolog-player video { display:block; width:100%; height:auto; aspect-ratio:16/9; object-fit:contain; background:#04101e; }
    .nexolog-controls { display:flex; flex-wrap:wrap; align-items:center; gap:10px; padding:12px 16px; color:#adc2d7; font-size:12px; }
    .nexolog-controls select,.nexolog-controls button { font:inherit; color:#f0f6ff; background:#0a2033; border:1px solid #285269; padding:8px 10px; border-radius:7px; cursor:pointer; }
    .nexolog-controls button { color:#00c8f5; }
    .nexolog-controls select:focus-visible,.nexolog-controls button:focus-visible { outline:2px solid #00c8f5; outline-offset:3px; }
    .nexolog-status { margin-left:auto; font-size:11px; }
    .nexolog-downloads { display:flex; flex-wrap:wrap; gap:12px; margin-top:20px; }
    video::cue { background:rgba(0,8,18,.92); color:white; font-family:Segoe UI,sans-serif; }
'''

PLAYER = '''
<div class="nexolog-player" data-nexolog-player>
  <video controls playsinline preload="metadata" poster="img/nexolog-dashboard.png" width="1920" height="1080" aria-label="Apresentação do NexoLog">
    <source src="media/nexolog-apresentacao.mp4" type="video/mp4">
    <track kind="subtitles" src="media/nexolog-pt.vtt" srclang="pt-BR" label="Português BR" default>
    <track kind="subtitles" src="media/nexolog-en.vtt" srclang="en" label="English">
    Seu navegador não reproduz este vídeo. <a href="media/nexolog-apresentacao.mp4">Baixar apresentação</a>.
  </video>
  <div class="nexolog-controls">
    <button type="button" data-video-toggle aria-label="Reproduzir apresentação">▶ Reproduzir</button>
    <label>Idioma das legendas <select aria-label="Idioma das legendas" data-caption-language><option value="pt-BR">Português BR</option><option value="en">English</option><option value="off">Sem legendas</option></select></label>
    <span class="nexolog-status">Áudio em português • Legendas PT / EN</span>
  </div>
</div>
'''

SCRIPT = '''
<script>
document.querySelectorAll('[data-nexolog-player]').forEach(function(player) {
  const video = player.querySelector('video');
  const language = player.querySelector('[data-caption-language]');
  const toggle = player.querySelector('[data-video-toggle]');
  function updateCaptions() {
    Array.from(video.textTracks).forEach(function(track) {
      track.mode = track.language === language.value ? 'showing' : 'disabled';
    });
  }
  language.addEventListener('change', updateCaptions);
  video.addEventListener('loadedmetadata', updateCaptions);
  toggle.addEventListener('click', function() {
    if (video.paused) video.play().catch(function() { toggle.textContent = '▶ Reproduzir'; });
    else video.pause();
  });
  function updatePlayback() {
    toggle.textContent = video.paused ? '▶ Reproduzir' : 'Ⅱ Pausar';
    toggle.setAttribute('aria-label', video.paused ? 'Reproduzir apresentação' : 'Pausar apresentação');
  }
  video.addEventListener('play', updatePlayback);
  video.addEventListener('pause', updatePlayback);
  video.addEventListener('ended', updatePlayback);
  updateCaptions();
});
</script>
'''


def refresh_player_assets(html):
    # A nova versão deve aparecer mesmo em navegadores que guardaram o vídeo anterior.
    html = html.replace('width="1280" height="720" aria-label="Apresentação do NexoLog"',
                        'width="1920" height="1080" aria-label="Apresentação do NexoLog"')
    html = html.replace('aspect-ratio:16/9; background:#04101e;',
                        'aspect-ratio:16/9; object-fit:contain; background:#04101e;')
    if '#nexolog .nexolog-player video' not in html:
        html = html.replace('    video::cue', CARD_STYLE + '\n    video::cue', 1)
    assets = ('media/nexolog-apresentacao.mp4', 'media/nexolog-pt.vtt',
              'media/nexolog-en.vtt', 'downloads/NexoLog.exe',
              'downloads/NexoLog-codigo-fonte.zip',
              *(f'img/nexolog-{image}.png' for image in ('dashboard','estoque','pedidos','fornecedores','clientes','relatorios','usuarios','login')))
    for asset in assets:
        version = hashlib.sha256((PORTFOLIO / asset).read_bytes()).hexdigest()[:12]
        html = re.sub(re.escape(asset) + r'(?:\?v=[a-f0-9]+)?(?=["\'])',
                      lambda _: f'{asset}?v={version}', html)
    return html


def main():
    for folder in ('media','downloads','img'):
        (PORTFOLIO/folder).mkdir(parents=True,exist_ok=True)
    for image in ('dashboard','estoque','pedidos','fornecedores','clientes','relatorios','usuarios','login'):
        screenshot = ROOT/f'build/video-frames/{image}.png'
        shutil.copyfile(screenshot,ROOT/f'docs/imagens/{image}.png')
        shutil.copyfile(screenshot,PORTFOLIO/f'img/nexolog-{image}.png')
    for source, target in (('dashboard','dashboard-ajustado'),('relatorios','relatorios-ajustados'),('usuarios','usuarios-ajustados')):
        shutil.copyfile(ROOT/f'docs/imagens/{source}.png',ROOT/f'docs/imagens/{target}.png')
    for name in ('nexolog-apresentacao.mp4','nexolog-pt.vtt','nexolog-en.vtt'):
        shutil.copyfile(ROOT/f'releases/video/{name}',PORTFOLIO/f'media/{name}')
    shutil.copyfile(ROOT/'releases/NexoLog.exe',PORTFOLIO/'downloads/NexoLog.exe')
    index_path = PORTFOLIO/'index.html'
    index = index_path.read_text(encoding='utf-8')
    card = '''<article class="development-card" id="nexolog">
''' + PLAYER + '''
  <div class="development-content">
    <span class="project-type">Python • Full Stack • v1.0.0</span>
    <h3>NexoLog</h3>
    <p>Solução local com frontend React, backend FastAPI e persistência em SQLite. Controle de estoque, pedidos em Kanban, rastreamento simulado e auditoria integrada às operações.</p>
    <div class="project-tech"><span>React</span><span>FastAPI</span><span>Python</span><span>SQLite</span><span>SQLAlchemy</span></div>
    <a href="nexolog.html" class="project-link">VER PROJETO COMPLETO →</a>
  </div>
</article>'''
    if 'id="nexolog"' not in index:
        index,count = re.subn(r'<article class="future-card">.*?</article>',lambda _:card,index,count=1,flags=re.S)
        assert count == 1, 'Cartão reservado não encontrado.'
        index = index.replace('</style>',STYLE+'\n</style>',1)
        index = index.replace('</body>',SCRIPT+'\n</body>',1)
    else:
        index, count = re.subn(r'<article class="development-card" id="nexolog">.*?</article>',
                               lambda _: card, index, count=1, flags=re.S)
        assert count == 1, 'Cartão NexoLog não encontrado.'
    index_path.write_text(index,encoding='utf-8')
    detail_path = PORTFOLIO/'nexolog.html'
    detail = detail_path.read_text(encoding='utf-8').replace('Usar acesso demonstrativo','Usar acesso demo')
    if 'data-nexolog-player' not in detail:
        detail = detail.replace('</style>',STYLE+'\n</style>',1)
        detail = detail.replace('<section aria-label="Dashboard">','<section aria-label="Vídeo de apresentação"><h2>Conheça o NexoLog em vídeo</h2>'+PLAYER+'</section>\n    <section aria-label="Dashboard">',1)
        detail = detail.replace('</body>',SCRIPT+'\n</body>',1)
    detail_path.write_text(detail,encoding='utf-8')
    readme = ROOT/'README.md'
    text = readme.read_text(encoding='utf-8').replace('Usar acesso demonstrativo','Usar acesso demo')
    text = text.replace('Baixe `NexoLog.exe` na área **Releases** do repositório.',
        'Baixe `NexoLog.exe` no cartão do projeto no [portfólio](https://leandroaugferreira.github.io/nexolog.html).')
    readme.write_text(text,encoding='utf-8')
    source_zip = ROOT/'releases/NexoLog-codigo-fonte.zip'
    folders = ('backend','frontend','scripts','tests','desktop','data','docs')
    excluded = {'node_modules','__pycache__','dist','backups','backup','.pytest_cache'}
    root_files = ('README.md','.gitignore','.gitattributes','requirements-dev.txt')
    with zipfile.ZipFile(source_zip,'w',zipfile.ZIP_DEFLATED) as archive:
        for filename in root_files:
            archive.write(ROOT/filename,f'NexoLog/{filename}')
        for folder in folders:
            for path in (ROOT/folder).rglob('*'):
                if not path.is_file() or any(part in excluded for part in path.relative_to(ROOT).parts):
                    continue
                if path.name.startswith('.env') or path.suffix in {'.pyc','.log'}:
                    continue
                if path.suffix in {'.db','.sqlite','.sqlite3'} and path != ROOT/'data/nexolog-demo.db':
                    continue
                archive.write(path,'NexoLog/'+path.relative_to(ROOT).as_posix())
    shutil.copyfile(source_zip,PORTFOLIO/'downloads'/source_zip.name)
    for html_path in (index_path, detail_path):
        html_path.write_text(refresh_player_assets(html_path.read_text(encoding='utf-8')),encoding='utf-8')
    print('Cartão, vídeo, legendas e downloads preparados no portfólio local.')


if __name__ == '__main__':
    main()
