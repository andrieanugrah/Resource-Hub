Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Administrator\.gemini\antigravity-ide\brain\7e8b38a7-a472-4daf-a289-b713cd9e9deb\.user_uploaded\media_1786695691846.png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$W = $src.Width
$H = $src.Height

function Crop-Image($x, $y, $w, $h, $destPath) {
    $rect = New-Object System.Drawing.Rectangle([int]$x, [int]$y, [int]$w, [int]$h)
    $bmp = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $rect.Width, $rect.Height)
    $g.DrawImage($src, $destRect, $rect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Saved: $destPath"
}

# 1. Dark Logo for Sidebar (Centered cleanly)
# X: 548, Y: 43, W: 122, H: 36
Crop-Image 548 43 122 36 "public/logo-dark.png"

# 2. Light Logo for Header
# X: 739, Y: 43, W: 122, H: 36
Crop-Image 739 43 122 36 "public/logo-light.png"

# 3. App Icon 64x64 (Dark rounded tile)
# Let's inspect pixel exact coordinates: X: 221 to 260, Y: 172 to 212
Crop-Image 222 171 40 42 "public/icon.png"
Crop-Image 222 171 40 42 "public/favicon.png"
Crop-Image 222 171 40 42 "app/icon.png"
Crop-Image 222 171 40 42 "app/apple-icon.png"

# 4. Primary Logo with subtitle
# X: 16, Y: 47, W: 220, H: 65
Crop-Image 16 47 220 65 "public/logo.png"

# 5. Icon only (Monogram)
# X: 279, Y: 47, W: 58, H: 65
Crop-Image 279 47 58 65 "public/logo-icon.png"

$src.Dispose()
Write-Host "Refined cropping finished."
