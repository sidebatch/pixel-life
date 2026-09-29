param()

# QA-only contact sheets at actual mobile icon size; live assets stay unchanged.
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$candidateRoot = Join-Path $projectRoot 'assets/forestry/candidates/tier2'
$font = [System.Drawing.Font]::new('Malgun Gothic', 10, [System.Drawing.FontStyle]::Bold)
$captionBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(230,245,231))

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

function Configure-Graphics { param($Graphics)
  $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
}

try {
  $ids = @('cypress','ginkgo','birch','larch','cherry')
  $labels = @('Hinoki','Ginkgo','Birch','Larch','Cherry')
  $inventory = [System.Drawing.Bitmap]::new(393, 340)
  try {
    $g = [System.Drawing.Graphics]::FromImage($inventory)
    try {
      Configure-Graphics $g
      $g.Clear([System.Drawing.Color]::FromArgb(13,42,41))
      $g.DrawString('TIER 2 WOOD - 3 COLUMNS / 78PX ICONS', $font, $captionBrush, 15, 13)
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
      Configure-Graphics $g
      $g.Clear([System.Drawing.Color]::FromArgb(83,143,88))
      for ($i = 0; $i -lt $ids.Count; $i++) {
        $x = 5 + $i * 129
        $sprite = switch ($ids[$i]) {
          'cypress' { Join-Path $projectRoot 'assets/forestry/trees/cypress.png' }
          'birch' { Join-Path $projectRoot 'assets/forestry/trees/birch.png' }
          default { Join-Path $candidateRoot "trees/$($ids[$i]).png" }
        }
        Draw-ImageContained $g $sprite $x 8 120 144
        $g.DrawString($labels[$i], $font, $captionBrush, ($x + 13), 166)
      }
    } finally { $g.Dispose() }
    $forest.Save((Join-Path $candidateRoot 'preview-trees-5.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $forest.Dispose() }

  $stumps = [System.Drawing.Bitmap]::new(400, 145)
  try {
    $g = [System.Drawing.Graphics]::FromImage($stumps)
    try {
      Configure-Graphics $g
      $g.Clear([System.Drawing.Color]::FromArgb(83,143,88))
      $newIds = @('ginkgo','larch','cherry')
      for ($i = 0; $i -lt $newIds.Count; $i++) {
        $x = 12 + $i * 130
        Draw-ImageContained $g (Join-Path $candidateRoot "stumps/$($newIds[$i]).png") $x 4 96 96
        $g.DrawString($newIds[$i], $font, $captionBrush, ($x + 12), 111)
      }
    } finally { $g.Dispose() }
    $stumps.Save((Join-Path $candidateRoot 'preview-stumps-3.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $stumps.Dispose() }

  $combined = [System.Drawing.Bitmap]::new(393, 612)
  try {
    $g = [System.Drawing.Graphics]::FromImage($combined)
    try {
      Configure-Graphics $g
      $g.Clear([System.Drawing.Color]::FromArgb(13,42,41))
      $g.DrawString('TIER 1 + 2 WOOD / 78PX ICONS', $font, $captionBrush, 15, 13)
      $allIds = @('paulownia','willow','spruce','pine','cedar','cypress','ginkgo','birch','larch','cherry')
      $allLabels = @('Paulownia','Willow','Spruce','Pine','Cedar','Hinoki','Ginkgo','Birch','Larch','Cherry')
      for ($i = 0; $i -lt $allIds.Count; $i++) {
        $x = 15 + ($i % 3) * 121
        $y = 49 + [int][Math]::Floor($i / 3) * 136
        $card = [System.Drawing.Rectangle]::new($x, $y, 110, 112)
        $g.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(36,72,68)), $card)
        $g.DrawRectangle([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(99,139,128)), $card)
        $art = if ($i -lt 5) { Join-Path $projectRoot "assets/forestry/candidates/tier1/items/$($allIds[$i]).png" } else { Join-Path $candidateRoot "items/$($allIds[$i]).png" }
        Draw-ImageContained $g $art ($x + 16) ($y + 4) 78 78
        $g.DrawString($allLabels[$i], $font, $captionBrush, ($x + 10), ($y + 87))
      }
    } finally { $g.Dispose() }
    $combined.Save((Join-Path $candidateRoot 'preview-tier1-tier2-icons-393px.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $combined.Dispose() }
} finally {
  $font.Dispose()
  $captionBrush.Dispose()
}
