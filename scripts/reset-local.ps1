Write-Host "Stopping running frontend/backend/Hardhat processes must be done manually before reset." -ForegroundColor Yellow

$root = Split-Path -Parent $PSScriptRoot

Remove-Item "$root\backend\prisma\dev.db" -ErrorAction SilentlyContinue
Remove-Item "$root\backend\prisma\dev.db-journal" -ErrorAction SilentlyContinue
Remove-Item "$root\backend\prisma\migrations" -Recurse -Force -ErrorAction SilentlyContinue

Remove-Item "$root\shared\contracts\localhost.json" -ErrorAction SilentlyContinue
Remove-Item "$root\shared\contracts\SaveTokenABI.json" -ErrorAction SilentlyContinue
Remove-Item "$root\shared\contracts\SavingsVaultABI.json" -ErrorAction SilentlyContinue

Remove-Item "$root\blockchain\cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$root\blockchain\artifacts" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$root\blockchain\typechain-types" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Local backend DB, contract deployment files, and Hardhat artifacts were removed." -ForegroundColor Green
Write-Host "Also clear browser localStorage for http://localhost:5173: localStorage.clear(); location.reload();" -ForegroundColor Cyan
