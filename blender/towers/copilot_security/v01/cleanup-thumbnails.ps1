$ErrorActionPreference = 'Stop'
$projectPath = (Resolve-Path -LiteralPath 'C:/Users/jonas/Documents/ChatGPT/Tower').Path
$expected = @('.thumbnails', '.thumbnails/fail', '.thumbnails/fail/blender', '.thumbnails/large') | Sort-Object
$removed = @()
foreach ($candidate in Get-ChildItem -LiteralPath $projectPath -Directory -Force) {
    if (-not (Test-Path -LiteralPath (Join-Path $candidate.FullName '.thumbnails') -PathType Container)) { continue }
    if ($candidate.Attributes -band [IO.FileAttributes]::ReparsePoint) { continue }
    $resolvedCandidate = (Resolve-Path -LiteralPath $candidate.FullName).Path
    if ([IO.Path]::GetDirectoryName($resolvedCandidate) -ne $projectPath) { throw 'Candidate is not a direct project child' }
    $items = @(Get-ChildItem -LiteralPath $resolvedCandidate -Recurse -Force)
    if (@($items | Where-Object { -not $_.PSIsContainer -or ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) }).Count) { continue }
    $relativeNames = @($items | ForEach-Object { $_.FullName.Substring($resolvedCandidate.Length + 1).Replace('\','/') } | Sort-Object)
    if ($relativeNames.Count -ne 4 -or (Compare-Object $expected $relativeNames)) { continue }
    Remove-Item -LiteralPath $resolvedCandidate -Recurse -Force
    $removed += $resolvedCandidate
}
$remaining = @(Get-ChildItem -LiteralPath $projectPath -Directory -Force | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName '.thumbnails') -PathType Container } | Select-Object -ExpandProperty FullName)
@{ removed = $removed; remainingThumbnailFolders = $remaining } | ConvertTo-Json -Depth 3
