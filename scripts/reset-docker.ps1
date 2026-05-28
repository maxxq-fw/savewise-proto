Write-Host "Stopping Docker containers and removing volumes..."
docker compose down -v --remove-orphans

Write-Host "Removing generated contract files..."
Remove-Item shared\contracts\localhost.json -ErrorAction SilentlyContinue
Remove-Item shared\contracts\SaveTokenABI.json -ErrorAction SilentlyContinue
Remove-Item shared\contracts\SavingsVaultABI.json -ErrorAction SilentlyContinue

Write-Host "Removing Hardhat generated files..."
Remove-Item blockchain\artifacts -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item blockchain\cache -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item blockchain\typechain-types -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Docker reset completed. Also clear browser localStorage for http://localhost:5173."
