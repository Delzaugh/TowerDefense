$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$expectedDirectories = @('.thumbnails', '.thumbnails/fail', '.thumbnails/fail/blender', '.thumbnails/large') | Sort-Object
$removed = @()
$preserved = @()
foreach ($folder in Get-ChildItem -LiteralPath $projectRoot -Directory -Force) {
    if ($folder.Name -ne 'OneDrive' -and $folder.Name -notmatch '[^\x00-\x7F]') { continue }
    $absoluteTarget = (Resolve-Path -LiteralPath $folder.FullName).Path
    $targetItem = Get-Item -LiteralPath $absoluteTarget -Force
    if (-not $targetItem.Parent.FullName.Equals($projectRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Cleanup target is not a direct project child' }
    if ($targetItem.Attributes -band [IO.FileAttributes]::ReparsePoint) { $preserved += $folder.Name; continue }
    $contents = @(Get-ChildItem -LiteralPath $absoluteTarget -Force -Recurse)
    if (@($contents | Where-Object { -not $_.PSIsContainer -or ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) }).Count -gt 0) { $preserved += $folder.Name; continue }
    $relativeDirectories = @($contents | ForEach-Object { [IO.Path]::GetRelativePath($absoluteTarget, $_.FullName).Replace('\', '/') } | Sort-Object)
    if ($relativeDirectories.Count -ne 4 -or @(Compare-Object $expectedDirectories $relativeDirectories).Count -gt 0) { $preserved += $folder.Name; continue }
    # Exact checked absolute target, native PowerShell deletion, no shell handoff.
    Remove-Item -LiteralPath $absoluteTarget -Recurse -Force
    $removed += $folder.Name
}
$remaining = @(Get-ChildItem -LiteralPath $projectRoot -Directory -Force | Where-Object { $_.Name -eq 'OneDrive' -or $_.Name -match '[^\x00-\x7F]' } | Select-Object -ExpandProperty Name)
$report = @{checkedAt=[DateTime]::UtcNow.ToString('o');projectRoot=$projectRoot;removed=$removed;preserved=$preserved;remainingCandidates=$remaining}
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $projectRoot 'artifacts/github-campus/thumbnail-cleanup.json') -Encoding utf8
Write-Output "Verified and removed $($removed.Count) empty Blender cache folders; $($preserved.Count) other candidates preserved."
