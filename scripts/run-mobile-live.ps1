# Run mobile app against local API + Supabase
# Uses your PC LAN IP so physical phones can reach the API (10.0.2.2 is emulator-only).

$ip = (
  Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike '127.*' -and
    $_.IPAddress -notlike '169.254*' -and
    $_.PrefixOrigin -ne 'WellKnown'
  } |
  Select-Object -First 1
).IPAddress

if (-not $ip) {
  Write-Error 'Could not detect LAN IP. Run: ipconfig'
  exit 1
}

$apiUrl = "http://${ip}:4000/api/v1"
Write-Host "API URL: $apiUrl"
Write-Host "Phone and PC must be on the same Wi-Fi. API must be running (npm run dev --workspace=@tanjuriel/api)"
Write-Host ""

flutter run `
  --dart-define=USE_MOCK_API=false `
  --dart-define=API_BASE_URL=$apiUrl
