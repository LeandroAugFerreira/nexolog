param([switch]$Folder)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$buildPython = Join-Path $projectRoot '.build-venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $buildPython)) {
    py -3.13 -m venv .build-venv
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar o ambiente de compilação.' }
}
& $buildPython -m pip install -r backend/requirements.txt pyinstaller==6.22.3
if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar as dependências.' }
Push-Location frontend
try {
    npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar o frontend.' }
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar o frontend.' }
} finally { Pop-Location }
if (-not (Test-Path -LiteralPath 'data/nexolog-demo.db')) {
    & $buildPython -m scripts.gerar_base_demonstrativa --destino data/nexolog-demo.db --ate 2026-10-03 --portfolio --manifesto data/manifesto-demo.json
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao preparar a demonstração.' }
}
& $buildPython scripts/criar_icone.py
if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar o ícone.' }
$env:NEXOLOG_BUILD_ONEFILE = if ($Folder) { '0' } else { '1' }
& $buildPython -m PyInstaller --noconfirm --distpath releases --workpath build/pyinstaller desktop/NexoLog.spec
if ($LASTEXITCODE -ne 0) { throw 'Falha ao gerar o executável.' }
Write-Host 'NexoLog compilado. Consulte a pasta releases.'
