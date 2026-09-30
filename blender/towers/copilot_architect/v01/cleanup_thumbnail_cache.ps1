$ErrorActionPreference='Stop'
$projectRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../../../..')).Path.TrimEnd('\')
$expected=@('.thumbnails','.thumbnails/fail','.thumbnails/fail/blender','.thumbnails/large') | Sort-Object
$removed=@()
foreach($candidate in Get-ChildItem -LiteralPath $projectRoot -Directory -Force){
  if(($candidate.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){continue}
  $targetFull=[IO.Path]::GetFullPath($candidate.FullName).TrimEnd('\')
  if([IO.Path]::GetDirectoryName($targetFull) -ne $projectRoot){throw 'Cleanup target is not a direct project child'}
  if(-not (Test-Path -LiteralPath (Join-Path $targetFull '.thumbnails') -PathType Container)){continue}
  $contents=@(Get-ChildItem -LiteralPath $targetFull -Recurse -Force)
  if(@($contents | Where-Object {-not $_.PSIsContainer -or (($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)}).Count){continue}
  $relative=@($contents | ForEach-Object {$_.FullName.Substring($targetFull.Length+1).Replace('\','/')} | Sort-Object)
  if(@(Compare-Object $expected $relative).Count){continue}
  Remove-Item -LiteralPath $targetFull -Recurse -Force
  $removed+=$targetFull
}
$remaining=@(Get-ChildItem -LiteralPath $projectRoot -Directory -Force | Where-Object {Test-Path -LiteralPath (Join-Path $_.FullName '.thumbnails') -PathType Container} | ForEach-Object {$_.FullName})
@{checkedAt=(Get-Date).ToUniversalTime().ToString('o');removed=$removed;remainingThumbnailDirectories=$remaining} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'validation/thumbnail_cleanup.json') -Encoding utf8
Write-Output "Removed $($removed.Count) verified empty Blender cache folders; root rechecked."
