$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$size = 1024
$outputPath = Join-Path $PSScriptRoot '..\public\basebuild-app-icon-1024.png'
$outputPath = [System.IO.Path]::GetFullPath($outputPath)

$bmp = New-Object System.Drawing.Bitmap $size, $size
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

try {
  $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
  $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 8, 10, 20),
    [System.Drawing.Color]::FromArgb(255, 24, 28, 56),
    45
  )
  $graphics.FillRectangle($backgroundBrush, $rect)

  $glowBrushOuter = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28, 84, 116, 255))
  $glowBrushInner = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(55, 124, 92, 255))
  $graphics.FillEllipse($glowBrushOuter, 165, 120, 690, 690)
  $graphics.FillEllipse($glowBrushInner, 245, 205, 530, 530)

  $panelRect = New-Object System.Drawing.Rectangle 132, 132, 760, 760
  $panelPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $radius = 172
  $diameter = $radius * 2
  $panelPath.AddArc($panelRect.X, $panelRect.Y, $diameter, $diameter, 180, 90)
  $panelPath.AddArc($panelRect.Right - $diameter, $panelRect.Y, $diameter, $diameter, 270, 90)
  $panelPath.AddArc($panelRect.Right - $diameter, $panelRect.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $panelPath.AddArc($panelRect.X, $panelRect.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $panelPath.CloseFigure()

  $panelBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $panelRect,
    [System.Drawing.Color]::FromArgb(245, 13, 16, 32),
    [System.Drawing.Color]::FromArgb(245, 20, 24, 48),
    90
  )
  $graphics.FillPath($panelBrush, $panelPath)

  $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(140, 147, 118, 255), 8)
  $graphics.DrawPath($borderPen, $panelPath)

  $shadowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 28, 36, 80), 22)
  $graphics.DrawPath($shadowPen, $panelPath)

  $ringPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(110, 255, 255, 255), 12)
  $graphics.DrawEllipse($ringPen, 228, 216, 568, 568)

  $chartPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), 26)
  $chartPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $chartPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $chartPoints = @(
    [System.Drawing.Point]::new(292, 634),
    [System.Drawing.Point]::new(418, 520),
    [System.Drawing.Point]::new(520, 566),
    [System.Drawing.Point]::new(646, 416),
    [System.Drawing.Point]::new(730, 330)
  )
  $graphics.DrawLines($chartPen, $chartPoints)
  $graphics.DrawLine($chartPen, 676, 330, 730, 330)
  $graphics.DrawLine($chartPen, 730, 330, 730, 384)

  $tpBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 34, 197, 94))
  $slBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 239, 68, 68))
  $coreBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
  $graphics.FillEllipse($slBrush, 388, 490, 54, 54)
  $graphics.FillEllipse($coreBrush, 404, 506, 22, 22)
  $graphics.FillEllipse($tpBrush, 620, 390, 54, 54)
  $graphics.FillEllipse($coreBrush, 636, 406, 22, 22)

  $fontFamily = 'Segoe UI'
  $epFont = New-Object System.Drawing.Font($fontFamily, 240, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $subtitleFont = New-Object System.Drawing.Font($fontFamily, 54, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $stringFormat = New-Object System.Drawing.StringFormat
  $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

  $epShadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90, 0, 0, 0))
  $epBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
  $subtitleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 190, 168, 255))

  $graphics.DrawString('EP', $epFont, $epShadowBrush, 515, 635, $stringFormat)
  $graphics.DrawString('EP', $epFont, $epBrush, 512, 628, $stringFormat)
  $graphics.DrawString('EXIT', $subtitleFont, $subtitleBrush, 512, 760, $stringFormat)

  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/png' } | Select-Object -First 1
  $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters 1
  $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Compression, 9L)
  $bmp.Save($outputPath, $codec, $encoderParams)
}
finally {
  foreach ($obj in @(
    $graphics, $bmp, $backgroundBrush, $glowBrushOuter, $glowBrushInner, $panelPath, $panelBrush,
    $borderPen, $shadowPen, $ringPen, $chartPen, $tpBrush, $slBrush, $coreBrush,
    $epFont, $subtitleFont, $stringFormat, $epShadowBrush, $epBrush, $subtitleBrush,
    $encoderParams
  )) {
    if ($null -ne $obj) {
      $obj.Dispose()
    }
  }
}

$file = Get-Item $outputPath
[PSCustomObject]@{
  Path = $file.FullName
  Width = $size
  Height = $size
  SizeKB = [Math]::Round($file.Length / 1KB, 2)
}
