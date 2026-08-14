Add-Type -AssemblyName System.Drawing

function Generate-AppIcon($size, $outputPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # 1. Background dark rounded tile
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 11, 17, 32))
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    
    # Rounded path
    $radius = $size * 0.22
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $radius*2, $radius*2, 180, 90)
    $path.AddArc($size - $radius*2, 0, $radius*2, $radius*2, 270, 90)
    $path.AddArc($size - $radius*2, $size - $radius*2, $radius*2, $radius*2, 0, 90)
    $path.AddArc(0, $size - $radius*2, $radius*2, $radius*2, 90, 90)
    $path.CloseFigure()
    
    $g.FillPath($bgBrush, $path)
    
    # Scaling factor for RH paths
    $s = $size / 100.0 * 0.75
    $ox = $size * 0.125
    $oy = $size * 0.125
    
    function Pt($x, $y) {
        return New-Object System.Drawing.PointF(($ox + $x * $s), ($oy + $y * $s))
    }
    
    # R Left Spine (White)
    $brushR = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $ptsRSpine = [System.Drawing.PointF[]]@((Pt 8 30), (Pt 26 19), (Pt 26 82), (Pt 8 93))
    $g.FillPolygon($brushR, $ptsRSpine)
    
    # R Top Loop
    $brushRLoop = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 226, 232, 240))
    $ptsRLoop = [System.Drawing.PointF[]]@((Pt 26 19), (Pt 46 7), (Pt 46 45), (Pt 26 57))
    $g.FillPolygon($brushRLoop, $ptsRLoop)
    
    # R Counter Hole (Dark)
    $ptsRHole = [System.Drawing.PointF[]]@((Pt 26 31), (Pt 36 25), (Pt 36 39), (Pt 26 45))
    $g.FillPolygon($bgBrush, $ptsRHole)
    
    # R Leg
    $ptsRLeg = [System.Drawing.PointF[]]@((Pt 26 57), (Pt 46 45), (Pt 46 95), (Pt 34 102), (Pt 26 82))
    $g.FillPolygon($brushR, $ptsRLeg)
    
    # H Left Column (Orange)
    $brushH1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 251, 146, 60))
    $ptsH1 = [System.Drawing.PointF[]]@((Pt 54 20), (Pt 68 12), (Pt 68 98), (Pt 54 106))
    $g.FillPolygon($brushH1, $ptsH1)
    
    # H Crossbar (Vibrant Orange)
    $brushH2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 249, 115, 22))
    $ptsH2 = [System.Drawing.PointF[]]@((Pt 68 47), (Pt 80 40), (Pt 80 62), (Pt 68 69))
    $g.FillPolygon($brushH2, $ptsH2)
    
    # H Right Column (Deep Orange)
    $brushH3 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 234, 88, 12))
    $ptsH3 = [System.Drawing.PointF[]]@((Pt 80 12), (Pt 94 4), (Pt 94 82), (Pt 80 90))
    $g.FillPolygon($brushH3, $ptsH3)
    
    $g.Dispose()
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $outputPath ($size x $size)"
}

Generate-AppIcon 192 "public/icon.png"
Generate-AppIcon 64 "public/favicon.png"
Generate-AppIcon 64 "app/icon.png"
Generate-AppIcon 180 "app/apple-icon.png"
