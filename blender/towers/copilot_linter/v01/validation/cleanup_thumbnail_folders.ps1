$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath('C:\Users\jonas\Documents\ChatGPT\Tower').TrimEnd('\')
$expected = @('.thumbnails', '.thumbnails/fail', '.thumbnails/fail/blender', '.thumbnails/large') | Sort-Object
$removed = @()
foreach ($candidate in Get-ChildItem -LiteralPath $projectRoot -Force -Directory) {
    if ($candidate.Name -ne 'OneDrive' -and $candidate.Name -notmatch '[^\x20-\x7e]') { continue }
    $target = [System.IO.Path]::GetFullPath($candidate.FullName).TrimEnd('\')
    if ([System.IO.Path]::GetDirectoryName($target) -ne $projectRoot) { throw 'Not a direct project child.' }
    if (($candidate.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) { continue }
    $pending = [System.Collections.Generic.Queue[string]]::new()
    $pending.Enqueue($target)
    $relativeDirectories = @()
    $safe = $true
    while ($pending.Count -gt 0 -and $safe) {
        foreach ($entry in Get-ChildItem -LiteralPath $pending.Dequeue() -Force) {
            if (-not $entry.PSIsContainer -or ($entry.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
                $safe = $false
                break
            }
            $relativeDirectories += $entry.FullName.Substring($target.Length + 1).Replace('\', '/')
            $pending.Enqueue($entry.FullName)
        }
    }
    if ($safe -and $relativeDirectories.Count -eq 4 -and -not (Compare-Object ($relativeDirectories | Sort-Object) $expected)) {
        Write-Output ('Verified empty Blender thumbnail tree: ' + $target)
        Remove-Item -LiteralPath $target -Recurse -Force
        $removed += $target
    }
}
$remaining = @(Get-ChildItem -LiteralPath $projectRoot -Force -Directory | Where-Object { $_.Name -eq 'OneDrive' -or $_.Name -match '[^\x20-\x7e]' } | Select-Object -ExpandProperty FullName)
@{ removed = $removed; remainingCandidates = $remaining; checkedAt = (Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'thumbnail_cleanup.json')
Write-Output ('Root rechecked; remaining candidates: ' + $remaining.Count)
