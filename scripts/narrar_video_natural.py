"""Gera a narração brasileira com voz online e mantém os áudios anteriores."""
import asyncio
import json
from pathlib import Path
import shutil
import subprocess

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
VOICE = 'pt-BR-FranciscaNeural'


async def main():
    chapters = json.loads((ROOT/'docs/roteiro-video.json').read_text(encoding='utf-8'))
    audio_dir = ROOT/'build/video-audio'
    audio_dir.mkdir(parents=True, exist_ok=True)
    previous = ROOT/'build/video-audio-anterior'
    previous.mkdir(parents=True, exist_ok=True)
    ffmpeg = shutil.which('ffmpeg') or r'C:\ffmpeg\bin\ffmpeg.exe'
    for chapter_index, chapter in enumerate(chapters):
        for cue_index, cue in enumerate(chapter['cues']):
            name = f'{chapter_index:02}-{cue_index:02}'
            target = audio_dir/f'{name}.wav'
            if target.exists() and not (previous/target.name).exists():
                shutil.copyfile(target,previous/target.name)
            # Separar as palavras da marca evita uma pronúncia comprimida.
            spoken = cue['pt'].replace('NexoLog','Nexo Log').replace('Kanban','cãnbã')
            spoken = spoken.replace('React, FastAPI e SQLite','React, Fast API e um banco de dados local')
            narration = edge_tts.Communicate(spoken,VOICE,rate='-3%',volume='+0%',pitch='+0Hz')
            mp3 = audio_dir/f'{name}-natural.mp3'
            await narration.save(str(mp3))
            subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(mp3),
                            '-ar','24000','-ac','1','-c:a','pcm_s16le',str(target)],check=True)
        print(f'Voz natural: {chapter_index+1}/{len(chapters)}',flush=True)
    (audio_dir/'narracao.json').write_text(json.dumps({'voice':VOICE,'rate':'-3%','language':'pt-BR'},indent=2),encoding='utf-8')


if __name__ == '__main__':
    asyncio.run(main())
