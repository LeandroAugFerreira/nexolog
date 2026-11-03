$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$nexoRoot = Split-Path -Parent $PSScriptRoot
$nexoChapters = Get-Content -LiteralPath (Join-Path $nexoRoot 'docs/roteiro-video.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$nexoAudioDir = Join-Path $nexoRoot 'build/video-audio'
New-Item -ItemType Directory -Path $nexoAudioDir -Force | Out-Null
$nexoNarrator = New-Object System.Speech.Synthesis.SpeechSynthesizer
$nexoNarrator.SelectVoice('Microsoft Maria Desktop')
$nexoNarrator.Rate = 0
for ($nexoChapter = 0; $nexoChapter -lt $nexoChapters.Count; $nexoChapter++) {
    for ($nexoCue = 0; $nexoCue -lt $nexoChapters[$nexoChapter].cues.Count; $nexoCue++) {
        $nexoOutput = Join-Path $nexoAudioDir ('{0:00}-{1:00}.wav' -f $nexoChapter, $nexoCue)
        $nexoNarrator.SetOutputToWaveFile($nexoOutput)
        $nexoNarrator.Speak($nexoChapters[$nexoChapter].cues[$nexoCue].pt)
        $nexoNarrator.SetOutputToNull()
    }
}
$nexoNarrator.Dispose()
Write-Host 'Narracao em portugues concluida.'
