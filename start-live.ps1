<#
.SYNOPSIS
  Auto-healing launcher for University Academic Hub + Cloudflare Quick Tunnel.
  Automatically starts local port 3000, launches cloudflared, writes the live URL
  to live-url.txt, and automatically recovers a fresh tunnel after laptop sleep/wake.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\start-live.ps1
  powershell -ExecutionPolicy Bypass -File .\start-live.ps1 -KeepAwake
#>
param(
  [int]$Port = 3000,
  [switch]$KeepAwake
)

$ErrorActionPreference = "Continue"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

# Optional: Prevent Windows sleep while this demo script stays open
if ($KeepAwake) {
  Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class PowerSleepHelper {
  [DllImport("kernel32.dll")]
  public static extern uint SetThreadExecutionState(uint esFlags);
}
"@ -ErrorAction SilentlyContinue
  # ES_CONTINUOUS (0x80000000) | ES_SYSTEM_REQUIRED (0x00000001)
  [void][PowerSleepHelper]::SetThreadExecutionState([uint32]"0x80000001")
  Write-Host "[KeepAwake] System sleep disabled while this terminal remains open." -ForegroundColor Yellow
}

# Locate cloudflared executable
$Cloudflared = @(
  (Join-Path $ProjectDir "cloudflared.exe"),
  "C:\Users\nitish92\.gemini\antigravity\brain\0a06aef4-d092-49cd-97bb-cdd81633dd3f\scratch\cloudflared.exe",
  (Get-Command cloudflared -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue)
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

if (-not $Cloudflared) {
  Write-Error "cloudflared.exe not found. Place cloudflared.exe in the project folder or on PATH."
  exit 1
}

function Ensure-LocalServer {
  $listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if (-not $listening) {
    Write-Host "[Server] Starting Node.js server on port $Port..." -ForegroundColor Cyan
    Start-Process -FilePath "node" -ArgumentList "server/index.js" -WorkingDirectory $ProjectDir -WindowStyle Hidden
    Start-Sleep -Seconds 2
  } else {
    Write-Host "[Server] Already running on http://127.0.0.1:$Port" -ForegroundColor Green
  }
}

$UrlFile = Join-Path $ProjectDir "live-url.txt"
$LogFile = Join-Path $ProjectDir "cloudflared-live.log"

try {
  while ($true) {
    Ensure-LocalServer
    if (Test-Path $LogFile) { Remove-Item $LogFile -Force -ErrorAction SilentlyContinue }

    Write-Host "[Tunnel] Starting Cloudflare Quick Tunnel for http://127.0.0.1:$Port ..." -ForegroundColor Cyan
    $proc = Start-Process -FilePath $Cloudflared `
      -ArgumentList "tunnel", "--url", "http://127.0.0.1:$Port", "--logfile", $LogFile `
      -WorkingDirectory $ProjectDir -PassThru -WindowStyle Hidden

    $printedUrl = $false
    while (-not $proc.HasExited) {
      Start-Sleep -Seconds 2
      if (Test-Path $LogFile) {
        $tail = Get-Content $LogFile -Tail 40 -ErrorAction SilentlyContinue
        if (-not $printedUrl) {
          $urlMatch = ($tail | Select-String -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" | Select-Object -First 1)
          if ($urlMatch) {
            $liveUrl = $urlMatch.Matches[0].Value
            Set-Content -Path $UrlFile -Value $liveUrl -Encoding UTF8
            $printedUrl = $true
            Write-Host "==================================================" -ForegroundColor Green
            Write-Host " LIVE URL: $liveUrl" -ForegroundColor Green
            Write-Host " Saved to: $UrlFile" -ForegroundColor Gray
            Write-Host "==================================================" -ForegroundColor Green
          }
        }
        # Detect expired quick tunnel after laptop sleep/network drop
        if ($tail -match "Unauthorized: Tunnel not found") {
          Write-Host "[Watchdog] Quick tunnel expired (likely after laptop sleep). Recreating..." -ForegroundColor Yellow
          Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
          break
        }
      }
    }

    Write-Host "[Watchdog] Reconnecting in 5 seconds..." -ForegroundColor DarkYellow
    Start-Sleep -Seconds 5
  }
} finally {
  if ($KeepAwake) {
    # Reset ES_CONTINUOUS only (0x80000000) to restore normal Windows sleep policy
    [void][PowerSleepHelper]::SetThreadExecutionState([uint32]"0x80000000")
  }
}
