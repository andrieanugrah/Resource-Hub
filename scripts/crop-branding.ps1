Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Administrator\.gemini\antigravity-ide\brain\7e8b38a7-a472-4daf-a289-b713cd9e9deb\.user_uploaded\media_1786695691846.png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

Write-Host "Source image dimensions: $($src.Width) x $($src.Height)"

function Crop-Image($rect, $destPath) {
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

# The image is 2048 x 1024 (or similar proportional aspect ratio)
# Let's compute relative coordinates based on dimensions:
$W = $src.Width
$H = $src.Height

# 1. PRIMARY LOGO (Top Left: "RH ResourceHub IT ASSET MANAGEMENT")
# In standard design sheet:
# Top row has: PRIMARY LOGO (0-25%), ICON ONLY (25-35%), WORDMARK (35-50%), DARK SIDEBAR (50-70%), LIGHT HEADER (70-100%)
# Vertical range for top row content: Y from ~6% to ~25%

# Let's extract:
# Primary Logo
$rectPrimary = New-Object System.Drawing.Rectangle([int]($W * 0.012), [int]($H * 0.08), [int]($W * 0.23), [int]($H * 0.16))
Crop-Image $rectPrimary "public/logo-primary.png"

# Icon Only (RH Monogram)
$rectIcon = New-Object System.Drawing.Rectangle([int]($W * 0.27), [int]($H * 0.08), [int]($W * 0.06), [int]($H * 0.16))
Crop-Image $rectIcon "public/logo-icon.png"

# Dark Sidebar Application (Top center-right)
$rectDark = New-Object System.Drawing.Rectangle([int]($W * 0.528), [int]($H * 0.065), [int]($W * 0.165), [int]($H * 0.185))
Crop-Image $rectDark "public/logo-dark-sidebar.png"

# Browser Tab Favicon
$rectFavicon = New-Object System.Drawing.Rectangle([int]($W * 0.015), [int]($H * 0.32), [int]($W * 0.18), [int]($H * 0.12))
Crop-Image $rectFavicon "public/browser-tab-preview.png"

# Shield Monogram Concept (Left middle)
$rectConcept = New-Object System.Drawing.Rectangle([int]($W * 0.03), [int]($H * 0.56), [int]($W * 0.07), [int]($H * 0.17))
Crop-Image $rectConcept "public/logo-shield-concept.png"

# Full Brand Sheet for reference
$src.Save("public/brand-sheet.png", [System.Drawing.Imaging.ImageFormat]::Png)

$src.Dispose()
Write-Host "Cropping completed successfully."
