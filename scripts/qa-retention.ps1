param([switch]$Snapshot,[switch]$Apply)
$ErrorActionPreference='Stop'
if($Snapshot -and $Apply){throw 'Snapshot and Apply are mutually exclusive.'}
$repoRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$outputRoot=[IO.Path]::GetFullPath((Join-Path $repoRoot 'output'))
$outputPrefix=$outputRoot+[IO.Path]::DirectorySeparatorChar
$manifestPath=Join-Path $repoRoot 'docs/QA_RETENTION_V1.json'
$plan=Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if($plan.version -ne 1 -or $plan.scope -ne 'output only'){throw 'Unsupported cleanup plan.'}
if((Get-Item -LiteralPath $outputRoot -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Output cannot be a link.'}
if(@(Get-ChildItem -LiteralPath $outputRoot -Recurse -Force -Attributes ReparsePoint).Count){throw 'Linked output entries are not supported.'}
$tracked=& git -C $repoRoot ls-files -- output
if($LASTEXITCODE -ne 0 -or $tracked){throw 'Cannot clean tracked QA files.'}
function Resolve-QaTarget([string]$relative){
 if($relative -notmatch '^[A-Za-z0-9_.\-/]+$' -or ($relative.Split('/') -contains '..')){throw "Invalid QA path: $relative"}
 $absolute=[IO.Path]::GetFullPath((Join-Path $outputRoot $relative))
 if(-not $absolute.StartsWith($outputPrefix,[StringComparison]::OrdinalIgnoreCase)){throw "Outside output: $relative"}
 return $absolute
}
function Get-QaFiles([string]$absolute){
 if(-not(Test-Path -LiteralPath $absolute)){return @()}
 $item=Get-Item -LiteralPath $absolute -Force
 if($item.PSIsContainer){return @(Get-ChildItem -LiteralPath $absolute -Recurse -Force -File)}
 return @($item)
}
function Get-QaFingerprint([string]$absolute,[switch]$Content){
 $rows=@(Get-QaFiles $absolute | Sort-Object FullName | ForEach-Object {
  $suffix=$_.FullName.Substring($outputRoot.Length+1).Replace('\','/')
  $value=if($Content){(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash}else{$_.LastWriteTimeUtc.Ticks}
  "$suffix|$($_.Length)|$value"
 })
 $digest=[Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes(($rows -join "`n")))
 return [Convert]::ToHexString($digest).ToLowerInvariant()
}
$keepPaths=@($plan.pinnedFiles)
foreach($group in $plan.groups){foreach($field in @('latest','previous','pinned')){if($group.$field){$keepPaths+=@($group.$field)}}}
$keepPaths=@($keepPaths|Sort-Object -Unique)
$keepResolved=@($keepPaths|ForEach-Object {Resolve-QaTarget $_})
foreach($path in $keepResolved){if(-not(Test-Path -LiteralPath $path)){throw "Missing protected result: $path"}}
$protectedBefore=@($keepResolved|ForEach-Object {Get-QaFingerprint $_ -Content}) -join '|'
$targets=@()
foreach($entry in $plan.retire){
 $absolute=Resolve-QaTarget $entry.path
 foreach($keep in $keepResolved){
  if($keep -eq $absolute -or $keep.StartsWith($absolute+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw "Target contains protected result: $($entry.path)"}
 }
 if(-not(Test-Path -LiteralPath $absolute)){continue}
 $item=Get-Item -LiteralPath $absolute -Force
 if($item.PSIsContainer -ne $entry.directory){throw "Target type changed: $($entry.path)"}
 $files=@(Get-QaFiles $absolute)
 $bytes=[long](($files|Measure-Object Length -Sum).Sum)
 $fingerprint=Get-QaFingerprint $absolute
 if($Snapshot){$entry|Add-Member -NotePropertyName fingerprint -NotePropertyValue $fingerprint -Force}
 elseif(-not $entry.fingerprint -or $entry.files -ne $files.Count -or $entry.bytes -ne $bytes -or $entry.fingerprint -ne $fingerprint){throw "Target changed; review a new plan first: $($entry.path)"}
 if($entry.files -ne $files.Count -or $entry.bytes -ne $bytes){throw "Snapshot inventory changed: $($entry.path)"}
 $targets+=@{path=$entry.path;absolute=$absolute;directory=$entry.directory;files=$files.Count;bytes=$bytes;fingerprint=$fingerprint}
}
if($Snapshot){$plan|ConvertTo-Json -Depth 15;exit}
$beforeBytes=[long]((Get-QaFiles $outputRoot|Measure-Object Length -Sum).Sum)
$summary=[ordered]@{date=$plan.date;mode=if($Apply){'recycle'}else{'dry-run'};targets=$targets.Count;files=[long](($targets|Measure-Object files -Sum).Sum);beforeBytes=$beforeBytes;retireBytes=[long](($targets|Measure-Object bytes -Sum).Sum);protectedGroups=$plan.groups.Count;protectedResults=$keepPaths.Count;recycled=@()}
if($Apply -and $targets.Count -eq 0){[PSCustomObject]$summary|Select-Object * -ExcludeProperty recycled|ConvertTo-Json -Depth 5;exit}
if($Apply){
 Add-Type -AssemblyName Microsoft.VisualBasic
 foreach($target in $targets){
  # Recheck immediately before recycling in case another QA run wrote new files.
  if((Get-QaFingerprint $target.absolute) -ne $target.fingerprint){throw "Target changed during cleanup: $($target.path)"}
  if($target.directory){
   [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($target.absolute,[Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,[Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin,[Microsoft.VisualBasic.FileIO.UICancelOption]::ThrowException)
  }else{
   [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($target.absolute,[Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,[Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin,[Microsoft.VisualBasic.FileIO.UICancelOption]::ThrowException)
  }
  if(Test-Path -LiteralPath $target.absolute){throw "Recycle did not remove target: $($target.path)"}
  $summary.recycled+=@{path=$target.path;files=$target.files;bytes=$target.bytes}
  if($summary.recycled.Count%20 -eq 0){Write-Host "Recycled $($summary.recycled.Count)/$($targets.Count) reviewed QA targets"}
 }
 $protectedAfter=@($keepResolved|ForEach-Object {Get-QaFingerprint $_ -Content}) -join '|'
 if($protectedBefore -ne $protectedAfter){throw 'Protected QA results changed.'}
 $summary.protectedContentUnchanged=$true
 $summary.afterBytes=[long]((Get-QaFiles $outputRoot|Measure-Object Length -Sum).Sum)
 $summary.removedBytes=$beforeBytes-$summary.afterBytes
 $reportDir=Join-Path $outputRoot 'qa-retention'
 [IO.Directory]::CreateDirectory($reportDir)|Out-Null
 [IO.File]::WriteAllText((Join-Path $reportDir ('recycle-'+$plan.date+'.json')),($summary|ConvertTo-Json -Depth 10))
}
[PSCustomObject]$summary|Select-Object * -ExcludeProperty recycled|ConvertTo-Json -Depth 5
