$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:3625/")
$listener.Start()

Write-Host "Static server running at http://localhost:3625/"
Write-Host "Press Ctrl+C to stop..."

while ($listener.IsListening) {
    $context = $listener.GetContext()

    $requestPath = $context.Request.Url.LocalPath.TrimStart("/")
    if ([string]::IsNullOrEmpty($requestPath)) {
        $requestPath = "index.html"
    }

    $filePath = Join-Path (Join-Path (Get-Location) ".") $requestPath

    if (Test-Path $filePath -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $context.Response.StatusCode = 404
        $context.Response.OutputStream.Write($msg, 0, $msg.Length)
    }

    $context.Response.Close()
}