$root = "C:\Users\maiaa\Documents\Food Waste Code"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:4173/")
$listener.Start()

Write-Output "Serving http://localhost:4173"

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $reqPath = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($reqPath)) {
        $reqPath = "index.html"
    }

    $filePath = Join-Path $root $reqPath
    if ((Test-Path $filePath) -and (Get-Item $filePath).PSIsContainer) {
        $filePath = Join-Path $filePath "index.html"
    }

    if (Test-Path $filePath) {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        switch ($ext) {
            ".html" { $type = "text/html" }
            ".js" { $type = "application/javascript" }
            ".css" { $type = "text/css" }
            ".json" { $type = "application/json" }
            ".png" { $type = "image/png" }
            ".jpg" { $type = "image/jpeg" }
            ".jpeg" { $type = "image/jpeg" }
            ".gif" { $type = "image/gif" }
            ".svg" { $type = "image/svg+xml" }
            default { $type = "application/octet-stream" }
        }

        $ctx.Response.StatusCode = 200
        $ctx.Response.ContentType = $type
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $msg = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
        $ctx.Response.StatusCode = 404
        $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
    }

    $ctx.Response.Close()
}
