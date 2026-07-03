# Run mobile app against production API (api.tanjurieltmc.com)

Write-Host "API URL: https://api.tanjurieltmc.com/api/v1"
Write-Host ""

flutter run `
  --dart-define=USE_MOCK_API=false `
  --dart-define=API_BASE_URL=https://api.tanjurieltmc.com/api/v1
