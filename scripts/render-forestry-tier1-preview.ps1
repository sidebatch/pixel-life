param()

# QA-only contact sheets at the game's real mobile icon size. No live assets are changed.
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$candidateRoot = Join-Path $projectRoot 'assets/forestry/candidates/tier1'

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

$font = [System.Drawing.Font]::new('Malgun Gothic', 10, [System.Drawing.FontStyle]::Bold)
$captionBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(230,245,231))
$graphicsSettings = {
  param($g)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
}

try {
  $inventory = [System.Drawing.Bitmap]::new(393, 340)
  try {
    $g = [System.Drawing.Graphics]::FromImage($inventory)
    try {
      & $graphicsSettings $g
      $g.Clear([System.Drawing.Color]::FromArgb(13,42,41))
      $g.DrawString('TIER 1 WOOD - 3 COLUMNS / 78PX ICONS', $font, $captionBrush, 15, 13)
      $ids = @('paulownia','willow','spruce','pine','cedar')
      $labels = @('Paulownia','Willow','Spruce','Pine','Cedar')
      for ($i = 0; $i -lt $ids.Count; $i++) {
        $x = 15 + ($i % 3) * 121
        $y = 49 + [int][Math]::Floor($i / 3) * 136
        $card = [System.Drawing.Rectangle]::new($x, $y, 110, 112)
        $g.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(36,72,68)), $card)
        $g.DrawRectangle([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(99,139,128)), $card)
        Draw-ImageContained $g (Join-Path $candidateRoot "items/$($ids[$i]).png") ($x + 16) ($y + 4) 78 78
        $g.DrawString($labels[$i], $font, $captionBrush, ($x + 10), ($y + 87))
      }
    } finally { $g.Dispose() }
    $inventory.Save((Join-Path $candidateRoot 'preview-inventory-393px.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $inventory.Dispose() }

  $forest = [System.Drawing.Bitmap]::new(650, 208)
  try {
    $g = [System.Drawing.Graphics]::FromImage($forest)
    try {
      & $graphicsSettings $g
      $g.Clear([System.Drawing.Color]::FromArgb(83,143,88))
      $ids = @('paulownia','willow','spruce','pine','cedar')
      $labels = @('Paulownia','Willow','Spruce','Pine','Cedar')
      for ($i = 0; $i -lt $ids.Count; $i++) {
        $x = 5 + $i * 129
        $img = switch ($ids[$i]) {
          'willow' { Join-Path $projectRoot 'assets/forestry/trees/willow.png' }
          'spruce' { Join-Path $projectRoot 'assets/forestry/trees/spruce-v2.png' }
          'pine' { Join-Path $projectRoot 'assets/forestry/trees/pine.png' }
          'cedar' { Join-Path $candidateRoot 'trees/cedar-v2.png' }
          default { Join-Path $candidateRoot "trees/$($ids[$i]).png" }
        }
        Draw-ImageContained $g $img $x 8 120 144
        $g.DrawString($labels[$i], $font, $captionBrush, ($x + 13), 166)
      }
    } finally { $g.Dispose() }
    $forest.Save((Join-Path $candidateRoot 'preview-trees-5.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $forest.Dispose() }
} finally {
  $font.Dispose()
  $captionBrush.Dispose()
}
