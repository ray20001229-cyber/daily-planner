$ErrorActionPreference = "Stop"
$port = 4173
$url = "http://localhost:$port"
$root = [IO.Path]::GetFullPath($PSScriptRoot)
$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".webmanifest" = "application/manifest+json; charset=utf-8"
  ".svg" = "image/svg+xml"
}

Write-Host "Rixu is starting at $url"
Write-Host "Keep this window open. Press Ctrl+C to stop."
$server = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $port)

try {
  $server.Start()
  try { Start-Process $url } catch { Write-Host "Open this address in your browser: $url" }
  while ($true) {
    $client = $server.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      while ($reader.ReadLine()) {}
      $requestTarget = if ($requestLine -match "^GET\s+(\S+)") { $Matches[1] } else { "/" }
      $requestPath = ([Uri]("http://localhost$requestTarget")).AbsolutePath.TrimStart("/")
      if ([string]::IsNullOrWhiteSpace($requestPath)) { $requestPath = "index.html" }
      $relativePath = [Uri]::UnescapeDataString($requestPath).Replace("/", [IO.Path]::DirectorySeparatorChar)
      $filePath = [IO.Path]::GetFullPath((Join-Path $root $relativePath))

      if ($filePath.StartsWith($root) -and (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        $body = [IO.File]::ReadAllBytes($filePath)
        $extension = [IO.Path]::GetExtension($filePath).ToLowerInvariant()
        $contentType = if ($mime.ContainsKey($extension)) { $mime[$extension] } else { "application/octet-stream" }
        $status = "200 OK"
      } else {
        $body = [Text.Encoding]::UTF8.GetBytes("404 - Not Found")
        $contentType = "text/plain; charset=utf-8"
        $status = "404 Not Found"
      }
      $headers = "HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      $headerBytes = [Text.Encoding]::ASCII.GetBytes($headers)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      $stream.Write($body, 0, $body.Length)
    } finally {
      $client.Close()
    }
  }
} finally {
  $server.Stop()
}
