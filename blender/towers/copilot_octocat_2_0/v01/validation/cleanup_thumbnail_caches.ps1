$ErrorActionPreference='Stop'
$taskRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../../../../../')).Path.TrimEnd([IO.Path]::DirectorySeparatorChar)
$expected=@('.thumbnails','.thumbnails/fail','.thumbnails/fail/blender','.thumbnails/large') | Sort-Object
$removed=@()
$left=@()
function Test-EmptyThumbnailTree($candidate) {
    $resolved=(Resolve-Path -LiteralPath $candidate.FullName).Path
    if((Split-Path -Parent $resolved) -cne $taskRoot) { return $false }
    if($candidate.Attributes -band [IO.FileAttributes]::ReparsePoint) { return $false }
    $items=@(Get-ChildItem -LiteralPath $resolved -Recurse -Force)
    if($items.Where({-not $_.PSIsContainer -or ($_.Attributes -band [IO.FileAttributes]::ReparsePoint)}).Count) { return $false }
    $dirs=@($items | ForEach-Object { [IO.Path]::GetRelativePath($resolved,$_.FullName).Replace('\','/') } | Sort-Object)
    if($dirs.Count -ne $expected.Count) { return $false }
    if(@(Compare-Object $dirs $expected).Count) { return $false }
    return $true
}
foreach($candidate in Get-ChildItem -LiteralPath $taskRoot -Directory -Force) {
    if($candidate.Name -ne 'OneDrive' -and $candidate.Name -notmatch '[^\x00-\x7F]') { continue }
    if(Test-EmptyThumbnailTree $candidate) {
        # Recheck absolute location and every item immediately before removal.
        if(-not (Test-EmptyThumbnailTree $candidate)) { throw 'Cache changed during cleanup' }
        Remove-Item -LiteralPath $candidate.FullName -Recurse -Force
        $removed+=$candidate.Name
    } else { $left+=$candidate.Name }
}
$remaining=@(Get-ChildItem -LiteralPath $taskRoot -Directory -Force | Where-Object { Test-EmptyThumbnailTree $_ } | Select-Object -ExpandProperty Name)
$record=@{checkedAt=[DateTime]::UtcNow.ToString('o');root=$taskRoot;removed=$removed;leftOtherContentsUntouched=$left;remainingEmptyThumbnailCaches=$remaining}
$record | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'thumbnail_cleanup.json')
$record | ConvertTo-Json -Depth 5
if($remaining.Count) { throw 'Exact empty thumbnail caches remain' }
