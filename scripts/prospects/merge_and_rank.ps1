# Merge all prospect JSON files and rank
$files = @(
    "F:\Documents\Repositories\WebsiteDropshipping\prospects_input.json",
    "F:\Documents\Repositories\WebsiteDropshipping\prospects_31_60.json",
    "F:\Documents\Repositories\WebsiteDropshipping\prospects_59_85.json",
    "F:\Documents\Repositories\WebsiteDropshipping\prospects_86_105.json"
)

$allProspects = @()
foreach ($f in $files) {
    Write-Host "Reading $f"
    $content = Get-Content $f -Raw -Encoding UTF8
    $batch = $content | ConvertFrom-Json
    Write-Host "  Found $($batch.Count) records"
    $allProspects += $batch
}

Write-Host "Total prospects loaded: $($allProspects.Count)"

# Sort by composite desc, then score_tf desc, then score_rs desc
$sorted = $allProspects | Sort-Object @{Expression={[int]$_.composite}; Descending=$true}, @{Expression={[int]$_.score_tf}; Descending=$true}, @{Expression={[int]$_.score_rs}; Descending=$true}

Write-Host "`n=== TOP 30 BEFORE ADJUSTMENTS ==="
for ($i = 0; $i -lt [Math]::Min(30, $sorted.Count); $i++) {
    $p = $sorted[$i]
    Write-Host "$($i+1). $($p.name) | $($p.business_type) | $($p.area) | comp=$($p.composite) | pd=$($p.score_pd)"
}

# Apply diversity adjustments
$typeAreaCount = @{}
for ($i = 0; $i -lt $sorted.Count; $i++) {
    $p = $sorted[$i]
    $key = "$($p.business_type)||$($p.area)"
    if (-not $typeAreaCount.ContainsKey($key)) {
        $typeAreaCount[$key] = @()
    }
    $typeAreaCount[$key] += $i
}

$adjustments = @{}
foreach ($key in $typeAreaCount.Keys) {
    $indices = $typeAreaCount[$key]
    if ($indices.Count -gt 3) {
        $inTop20 = ($indices | Where-Object { $_ -lt 20 }).Count
        if ($inTop20 -gt 3) {
            $toAdjust = $indices | Where-Object { $_ -lt 20 } | Select-Object -Skip 3
            foreach ($idx in $toAdjust) {
                $adjustments[$idx] = -2
                Write-Host "ADJUST (top20 cap): #$($idx+1) $($sorted[$idx].name) ($key) pd: $($sorted[$idx].score_pd)->$([Math]::Max(1,[int]$sorted[$idx].score_pd-2))"
            }
        }
        $inTop40 = ($indices | Where-Object { $_ -lt 40 }).Count
        if ($inTop40 -gt 5) {
            $toAdjust = $indices | Where-Object { $_ -lt 40 } | Select-Object -Skip 5
            foreach ($idx in $toAdjust) {
                if (-not $adjustments.ContainsKey($idx)) {
                    $adjustments[$idx] = -1
                    Write-Host "ADJUST (top40 cap): #$($idx+1) $($sorted[$idx].name) ($key) pd: $($sorted[$idx].score_pd)->$([Math]::Max(1,[int]$sorted[$idx].score_pd-1))"
                }
            }
        }
    }
}

# Apply adjustments
foreach ($idx in $adjustments.Keys) {
    $oldPd = [int]$sorted[$idx].score_pd
    $oldComp = [int]$sorted[$idx].composite
    $sorted[$idx].score_pd = [Math]::Max(1, $oldPd + $adjustments[$idx])
    $sorted[$idx].composite = [Math]::Max(1, $oldComp + $adjustments[$idx])
}

# Re-sort
$sorted = $sorted | Sort-Object @{Expression={[int]$_.composite}; Descending=$true}, @{Expression={[int]$_.score_tf}; Descending=$true}, @{Expression={[int]$_.score_rs}; Descending=$true}

Write-Host "`n=== TOP 40 AFTER ADJUSTMENTS ==="
for ($i = 0; $i -lt [Math]::Min(40, $sorted.Count); $i++) {
    $p = $sorted[$i]
    Write-Host "$($i+1). $($p.name) | $($p.business_type) | $($p.area) | comp=$($p.composite) | pd=$($p.score_pd)"
}

# Generate CSVs
function Format-CsvRow($p, $rank) {
    $fields = @(
        $rank,
        $p.name,
        $p.area,
        $p.business_type,
        $p.phone,
        $p.maps_url,
        $p.facebook_url,
        $p.website_url,
        $p.rating,
        $p.review_count,
        $p.social_activity,
        $p.owner_name,
        $p.owner_phone_visible,
        $p.score_tf,
        $p.score_pg,
        $p.score_rs,
        $p.score_or,
        $p.score_pd,
        $p.composite
    )
    $parts = @()
    foreach ($f in $fields) {
        $s = if ($null -eq $f) { '' } else { [string]$f }
        if ($s.Contains(',') -or $s.Contains('"') -or $s.Contains("`n") -or $s.Contains("`r")) {
            $parts += '"' + $s.Replace('"', '""') + '"'
        } else {
            $parts += $s
        }
    }
    $r = if ($null -eq $p.reasoning) { '' } else { [string]$p.reasoning }
    $parts += '"' + $r.Replace('"', '""') + '"'
    return $parts -join ','
}

$header = "rank,name,area,business_type,phone,maps_url,facebook_url,website_url,rating,review_count,social_activity,owner_name,owner_phone_visible,score_tf,score_pg,score_rs,score_or,score_pd,composite,reasoning"

# Top 40 CSV
$top40Lines = @($header)
for ($i = 0; $i -lt [Math]::Min(40, $sorted.Count); $i++) {
    $top40Lines += Format-CsvRow $sorted[$i] ($i + 1)
}
$top40Csv = $top40Lines -join "`r`n"

# All prospects CSV
$allLines = @($header)
for ($i = 0; $i -lt $sorted.Count; $i++) {
    $allLines += Format-CsvRow $sorted[$i] ($i + 1)
}
$allCsv = $allLines -join "`r`n"

# Save CSVs
$top40Csv | Out-File -Encoding UTF8 "F:\Documents\Repositories\WebsiteDropshipping\top40_ranked.csv"
$allCsv | Out-File -Encoding UTF8 "F:\Documents\Repositories\WebsiteDropshipping\all_ranked.csv"

Write-Host "`n=== FILES WRITTEN ==="
Write-Host "top40_ranked.csv: $($top40Csv.Length) chars"
Write-Host "all_ranked.csv: $($allCsv.Length) chars"

# Summary
$top40 = $sorted[0..39]
$cafes = ($top40 | Where-Object { $_.business_type -match 'caf[eé]' }).Count
$barbershops = ($top40 | Where-Object { $_.business_type -eq 'barbershop' }).Count
$trades = ($top40 | Where-Object { $_.business_type -in @('plumber','electrician') }).Count
$minComp = [int]$top40[-1].composite
$maxComp = [int]$top40[0].composite

$areaGroups = $top40 | Group-Object area | Sort-Object Count -Descending
$areaSummary = ($areaGroups | Select-Object -First 5 | ForEach-Object { "$($_.Name)($($_.Count))" }) -join ', '

Write-Host "`n=== SUMMARY ==="
Write-Host "Top 40 composite range: $minComp-$maxComp"
Write-Host "Distribution: $cafes cafes, $trades trades, $barbershops barbershops"
Write-Host "Top areas: $areaSummary"

Write-Host "`nDONE"