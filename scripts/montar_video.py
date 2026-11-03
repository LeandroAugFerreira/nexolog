"""Sincroniza a gravação da demonstração com a narração e as legendas bilíngues."""
import json
from pathlib import Path
import shutil
import subprocess
import textwrap
import wave

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'build/video-media'
OUT = ROOT / 'releases/video'
FFMPEG = shutil.which('ffmpeg') or r'C:\ffmpeg\bin\ffmpeg.exe'


def run(args):
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', *args], cwd=ROOT, check=True)


def timestamp(seconds, separator='.'):
    milliseconds = round(seconds * 1000)
    hours, remainder = divmod(milliseconds, 3600000)
    minutes, remainder = divmod(remainder, 60000)
    secs, millis = divmod(remainder, 1000)
    return f'{hours:02}:{minutes:02}:{secs:02}{separator}{millis:03}'


def visual_input(index, image, duration):
    folder = ROOT / f'build/video-recordings/{index:02}'
    manifest = folder / 'manifest.json'
    if manifest.exists():
        recording = json.loads(manifest.read_text(encoding='utf-8'))
        frames = [frame for frame in recording['frames'] if frame['at'] < duration]
        # A captura pode coincidir com um redesenho e conter somente o fundo vazio.
        # As telas completas desta gravação têm pelo menos 60 KB; esses quadros têm 8 KB.
        complete_frames = [frame for frame in frames if (folder / frame['file']).stat().st_size >= 20_000]
        if len(complete_frames) < .85 * len(frames):
            raise ValueError(f'Excesso de quadros vazios no capítulo {index}.')
        frames = complete_frames
        if len(frames) < 2:
            raise ValueError(f'Gravação incompleta do capítulo {index}.')
        if abs(recording['duration'] - duration) > .1:
            raise ValueError(f'Duração incompatível no capítulo {index}.')
        lines = ['ffconcat version 1.0']
        for position, frame in enumerate(frames):
            path = folder / frame['file']
            if not path.is_file():
                raise FileNotFoundError(path)
            next_time = frames[position + 1]['at'] if position + 1 < len(frames) else duration
            # Os intervalos registrados preservam o tempo real de cada interação.
            interval = next_time - (frame['at'] if position else 0)
            if interval <= 0:
                raise ValueError(f'Quadros fora de ordem no capítulo {index}.')
            lines.extend([f"file '{path.as_posix()}'", f'duration {interval:.6f}'])
        lines.append(f"file '{(folder / frames[-1]['file']).as_posix()}'")
        concat = WORK / f'recording-{index:02}.txt'
        concat.write_text('\n'.join(lines), encoding='utf-8')
        return ['-f', 'concat', '-safe', '0', '-i', str(concat)]
    screenshot = ROOT / f'build/video-frames/{image}.png'
    if not screenshot.exists():
        screenshot = ROOT / f'docs/imagens/{image}.png'
    return ['-loop', '1', '-framerate', '24', '-i', str(screenshot)]


def main():
    WORK.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    chapters = json.loads((ROOT / 'docs/roteiro-video.json').read_text(encoding='utf-8'))
    captions = []
    timeline = []
    elapsed = 0.0
    for index, chapter in enumerate(chapters):
        with wave.open(str(ROOT / f'build/video-audio/{index:02}-00.wav'), 'rb') as first:
            params = first.getparams()
            rate, sample_size, channels = first.getframerate(), first.getsampwidth(), first.getnchannels()
        pcm = bytearray(bytes(round(rate * .35) * sample_size * channels))
        duration = .35
        for cue_index, cue in enumerate(chapter['cues']):
            with wave.open(str(ROOT / f'build/video-audio/{index:02}-{cue_index:02}.wav'), 'rb') as audio:
                assert (audio.getframerate(), audio.getsampwidth(), audio.getnchannels()) == (rate, sample_size, channels)
                cue_duration = audio.getnframes() / rate
                pcm.extend(audio.readframes(audio.getnframes()))
            captions.append({'start':elapsed + duration,'end':elapsed + duration + cue_duration, **cue})
            duration += cue_duration + .35
            pcm.extend(bytes(round(rate * .35) * sample_size * channels))
        duration += .55
        pcm.extend(bytes(round(rate * .55) * sample_size * channels))
        wav_path = WORK / f'chapter-{index:02}.wav'
        with wave.open(str(wav_path), 'wb') as audio:
            audio.setparams(params)
            audio.writeframes(pcm)
        # Quantização em quadros mantém a concatenação e as legendas sincronizadas.
        duration = round(duration * 24) / 24
        title_path = WORK / f'title-{index:02}.txt'
        title_path.write_text(chapter['title'], encoding='utf-8')
        filters = (
            'fps=24,scale=1824:1026:force_original_aspect_ratio=decrease,'
            'pad=1824:1026:(ow-iw)/2:(oh-ih)/2:color=0x04101e,'
            'pad=1920:1080:48:48:color=0x04101e,setsar=1,'
            f"drawtext=fontfile='C\\:/Windows/Fonts/segoeuib.ttf':textfile='build/video-media/title-{index:02}.txt':"
            'fontcolor=white:fontsize=28:x=48:y=7,'
            'drawbox=x=48:y=40:w=1824:h=2:color=0x00c8f5:t=fill,'
            f'fade=t=in:d=0.3,fade=t=out:st={duration-.35:.3f}:d=0.35'
        )
        run([*visual_input(index, chapter['image'], duration),'-i',str(wav_path),'-t',str(duration),
             '-vf',filters,'-af','loudnorm=I=-18:TP=-2:LRA=7,aresample=48000',
             '-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k',
             str(WORK / f'chapter-{index:02}.mp4')])
        timeline.append({'title':chapter['title'],'start':elapsed,'end':elapsed+duration})
        elapsed += duration
        print(f'{index+1}/{len(chapters)}: {chapter["title"]}', flush=True)
    for language in ('pt','en'):
        vtt = ['WEBVTT','']
        srt = []
        for number, cue in enumerate(captions, 1):
            lines = '\n'.join(textwrap.wrap(cue[language], width=55, break_long_words=False))
            vtt.extend([str(number),f'{timestamp(cue["start"])} --> {timestamp(cue["end"])}',lines,''])
            srt.extend([str(number),f'{timestamp(cue["start"],",")} --> {timestamp(cue["end"],",")}',lines,''])
        (OUT / f'nexolog-{language}.vtt').write_text('\n'.join(vtt), encoding='utf-8')
        (WORK / f'nexolog-{language}.srt').write_text('\n'.join(srt), encoding='utf-8')
    concat = WORK / 'concat.txt'
    concat.write_text('\n'.join(f"file 'chapter-{i:02}.mp4'" for i in range(len(chapters))), encoding='utf-8')
    metadata = [';FFMETADATA1','title=NexoLog — Sua operação conectada','artist=Leandro Augusto Ferreira']
    for chapter in timeline:
        metadata.extend(['[CHAPTER]','TIMEBASE=1/1000',f'START={round(chapter["start"]*1000)}',
                         f'END={round(chapter["end"]*1000)}',f'title={chapter["title"]}'])
    (WORK / 'chapters.txt').write_text('\n'.join(metadata), encoding='utf-8')
    run(['-f','concat','-safe','0','-i',str(concat),'-i',str(WORK/'nexolog-pt.srt'),
         '-i',str(WORK/'nexolog-en.srt'),'-i',str(WORK/'chapters.txt'),
         '-map','0:v:0','-map','0:a:0','-map','1:0','-map','2:0','-map_metadata','3','-map_chapters','3',
         '-c:v','copy','-c:a','copy','-c:s','mov_text','-metadata:s:a:0','language=por',
         '-metadata:s:s:0','language=por','-metadata:s:s:0','title=Português BR',
         '-metadata:s:s:1','language=eng','-metadata:s:s:1','title=English','-movflags','+faststart',
         str(OUT/'nexolog-apresentacao.mp4')])
    (OUT/'capitulos.json').write_text(json.dumps(timeline,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Video concluido: {elapsed:.1f} segundos.', flush=True)


if __name__ == '__main__':
    main()
