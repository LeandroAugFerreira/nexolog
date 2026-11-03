param([switch]$SkipOperations)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$buildPython = Join-Path $projectRoot '.build-venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath data/nexolog-demo.db)) {
    & $buildPython -m scripts.gerar_base_demonstrativa --destino data/nexolog-demo.db --ate 2026-10-03 --portfolio --manifesto data/manifesto-demo.json
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao gerar a base fictícia.' }
}
& $buildPython scripts/criar_icone.py
if (-not $SkipOperations) {
    & $buildPython -m unittest discover -s tests -v
    if ($LASTEXITCODE -ne 0) { throw 'Falha nos testes operacionais.' }
}
& $buildPython -m desktop.launcher --self-test --data-dir build/test-source
if ($LASTEXITCODE -ne 0) { throw 'Falha no teste de integração desktop.' }
$env:NEXOLOG_BUILD_ONEFILE = '0'
& $buildPython -m PyInstaller --noconfirm --distpath releases --workpath build/pyinstaller desktop/NexoLog.spec
if ($LASTEXITCODE -ne 0) { throw 'Falha no executável em pasta.' }
$folderTest = Start-Process -FilePath (Join-Path $projectRoot 'releases/NexoLog/NexoLog.exe') -ArgumentList '--self-test','--data-dir',(Join-Path $projectRoot 'build/test-folder') -Wait -PassThru -WindowStyle Hidden
if ($folderTest.ExitCode -ne 0) { throw 'Falha no teste do executável em pasta.' }
$env:NEXOLOG_BUILD_ONEFILE = '1'
& $buildPython -m PyInstaller --noconfirm --distpath releases --workpath build/pyinstaller desktop/NexoLog.spec
if ($LASTEXITCODE -ne 0) { throw 'Falha no executável único.' }
$singleTest = Start-Process -FilePath (Join-Path $projectRoot 'releases/NexoLog.exe') -ArgumentList '--self-test','--data-dir',(Join-Path $projectRoot 'build/test-onefile') -Wait -PassThru -WindowStyle Hidden
if ($singleTest.ExitCode -ne 0) { throw 'Falha no teste do executável único.' }
Write-Host 'VALIDAÇÃO CONCLUÍDA: código, operações e executável único.'
