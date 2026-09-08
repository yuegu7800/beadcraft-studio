$projectDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$previewUrl = 'http://127.0.0.1:4173/'

function Test-BeadCraftServer {
  try {
    $response = Invoke-WebRequest -Uri $previewUrl -UseBasicParsing -TimeoutSec 1
    return $response.StatusCode -eq 200
  }
  catch {
    return $false
  }
}

if (-not (Test-BeadCraftServer)) {
  $npmCommand = (Get-Command npm.cmd -ErrorAction Stop).Source
  Start-Process `
    -FilePath $npmCommand `
    -ArgumentList @('run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173') `
    -WorkingDirectory $projectDirectory `
    -WindowStyle Hidden

  foreach ($attempt in 1..20) {
    Start-Sleep -Milliseconds 350
    if (Test-BeadCraftServer) { break }
  }
}

if (Test-BeadCraftServer) {
  Start-Process $previewUrl
}
else {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show(
    '网站启动失败。请确认 Node.js 依赖已经安装，并在项目目录运行 npm run build。',
    'BeadCraft Studio'
  ) | Out-Null
}
