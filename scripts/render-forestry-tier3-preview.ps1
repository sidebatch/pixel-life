param()

# QA-only contact sheets; live assets stay unchanged.
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$candidateRoot = Join-Path $projectRoot 'assets/forestry/candidates/tier3'
$font = [System.Drawing.Font]::new('Malgun Gothic', 10, [System.Drawing.FontStyle]::Bold)
$captionBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(230,245,231))
$cardBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(36,72,68))
$cardPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(99,139,128))

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

function Save-Inventory-Preview {
  param([string]$Title, [string[]]$Ids, [string[]]$Labels, [string]$FileName, [bool]$AllTiers)
  $rows = [int][Math]::Ceiling($Ids.Count / 3)
  $bitmap = [System.Drawing.Bitmap]::new(393, 49 + 136 * $rows + 19)
  try {
    $g = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      Configure-Graphics $g
      $g.Clear([System.Drawing.Color]::FromArgb(13,42,41))
      $g.DrawString($Title, $font, $captionBrush, 15, 13)
      for ($i = 0; $i -lt $Ids.Count; $i++) {
        $x = 15 + ($i % 3) * 121
        $y = 49 + [int][Math]::Floor($i / 3) * 136
        $card = [System.Drawing.Rectangle]::new($x, $y, 110, 112)
        $g.FillRectangle($cardBrush, $card)
        $g.DrawRectangle($cardPen, $card)
        $id = $Ids[$i]
        $tier = if ($AllTiers) { if ($i -lt 5) { 'tier1' } elseif ($i -lt 10) { 'tier2' } else { 'tier3' } } else { 'tier3' }
        $fileId = if ($id -eq 'maple') { 'maple-v2' } else { $id }
        $art = Join-Path $projectRoot "assets/forestry/candidates/$tier/items/$fileId.png"
        Draw-ImageContained $g $art ($x + 16) ($y + 4) 78 78
        $g.DrawString($Labels[$i], $font, $captionBrush, ($x + 10), ($y + 87))
      }
    } finally { $g.Dispose() }
    $bitmap.Save((Join-Path $candidateRoot $FileName), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $bitmap.Dispose() }
}

try {
  $ids = @('maple','chestnut','walnut','broadleaf','zelkova')
  $labels = @('Maple','Chestnut','Walnut','Broadleaf','Zelkova')
  Save-Inventory-Preview 'TIER 3 WOOD - 3 COLUMNS / 78PX ICONS' $ids $labels 'preview-inventory-393px.png' $false

  $forest = [System.Drawing.Bitmap]::new(650, 208)
  try {
    $g = [System.Drawing.Graphics]::FromImage($forest)
    try {
      Configure-Graphics $g
      $g.Clear([System.Drawing.Color]::FromArgb(83,143,88))
      for ($i = 0; $i -lt $ids.Count; $i++) {
        $x = 5 + $i * 129
        $sprite = if ($ids[$i] -eq 'maple') { Join-Path $projectRoot 'assets/forestry/trees/maple-v2.png' } elseif ($ids[$i] -eq 'broadleaf') { Join-Path $projectRoot 'assets/forestry/trees/broadleaf.png' } else { Join-Path $candidateRoot "trees/$($ids[$i]).png" }
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
      $newIds = @('chestnut','walnut','zelkova')
      for ($i = 0; $i -lt $newIds.Count; $i++) {
        $x = 12 + $i * 130
        Draw-ImageContained $g (Join-Path $candidateRoot "stumps/$($newIds[$i]).png") $x 4 96 96
        $g.DrawString($newIds[$i], $font, $captionBrush, ($x + 12), 111)
      }
    } finally { $g.Dispose() }
    $stumps.Save((Join-Path $candidateRoot 'preview-stumps-3.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $stumps.Dispose() }

  $allIds = @('paulownia','willow','spruce','pine','cedar','cypress','ginkgo','birch','larch','cherry','maple','chestnut','walnut','broadleaf','zelkova')
  $allLabels = @('Paulownia','Willow','Spruce','Pine','Cedar','Hinoki','Ginkgo','Birch','Larch','Cherry','Maple','Chestnut','Walnut','Broadleaf','Zelkova')
  Save-Inventory-Preview 'TIER 1 + 2 + 3 WOOD / 78PX ICONS' $allIds $allLabels 'preview-tier1-tier2-tier3-icons-393px.png' $true
} finally {
  $font.Dispose()
  $captionBrush.Dispose()
  $cardBrush.Dispose()
  $cardPen.Dispose()
}
