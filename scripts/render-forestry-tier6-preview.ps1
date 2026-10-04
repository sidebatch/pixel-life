param()

Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$candidateRoot = Join-Path $projectRoot 'assets/forestry/candidates/tier6'
$ids = @('olive','purpleheart','jatoba','spotted_gum','ironbark')
$labels = @('Olive','Purpleheart','Jatoba','Spotted Gum','Ironbark')
$font = [System.Drawing.Font]::new('Malgun Gothic', 10, [System.Drawing.FontStyle]::Bold)
$captionBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(238,247,232))
$panelBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(42,77,64))
$panelPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(112,151,126))

function Draw-ImageContained {
  param($Graphics, [string]$Path, [int]$X, [int]$Y, [int]$Width, [int]$Height)
  $sprite = [System.Drawing.Image]::FromFile($Path)
  try {
    $scale = [Math]::Min($Width / $sprite.Width, $Height / $sprite.Height)
    $w = [int][Math]::Round($sprite.Width * $scale)
    $h = [int][Math]::Round($sprite.Height * $scale)
    $Graphics.DrawImage($sprite, [System.Drawing.Rectangle]::new($X + [int](($Width - $w) / 2), $Y + [int](($Height - $h) / 2), $w, $h))
  } finally { $sprite.Dispose() }
}

$bitmap = [System.Drawing.Bitmap]::new(770, 590)
try {
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
    $g.Clear([System.Drawing.Color]::FromArgb(75,132,78))
    $g.DrawString('TIER 6 FORESTRY ASSET REVIEW', $font, $captionBrush, 16, 12)
    $kinds = @('trees','stumps','items')
    $rowLabels = @('TREE 120x144','STUMP 96x96','WOOD 96x96')
    for ($row = 0; $row -lt 3; $row++) {
      $top = 45 + $row * 178
      $g.DrawString($rowLabels[$row], $font, $captionBrush, 16, $top)
      for ($i = 0; $i -lt 5; $i++) {
        $x = 16 + $i * 150
        $card = [System.Drawing.Rectangle]::new($x, $top + 24, 136, 142)
        $g.FillRectangle($panelBrush, $card)
        $g.DrawRectangle($panelPen, $card)
        $art = Join-Path $candidateRoot "$($kinds[$row])/$($ids[$i]).png"
        Draw-ImageContained $g $art ($x + 8) ($top + 27) 120 108
        $g.DrawString($labels[$i], $font, $captionBrush, ($x + 7), ($top + 140))
      }
    }
  } finally { $g.Dispose() }
  $bitmap.Save((Join-Path $candidateRoot 'preview-tier6.png'), [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $bitmap.Dispose()
  $font.Dispose()
  $captionBrush.Dispose()
  $panelBrush.Dispose()
  $panelPen.Dispose()
}
