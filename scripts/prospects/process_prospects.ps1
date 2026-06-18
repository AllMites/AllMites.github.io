# Process prospect scoring
# Reads from prospects_input.json, outputs ranked CSVs

$json = Get-Content "F:\Documents\Repositories\WebsiteDropshipping\prospects_input.json" -Raw -Encoding UTF8
$prospects = $json | ConvertFrom-Json

Write-Host "Loaded $($prospects.Count) prospects"

# Sort by composite desc, then score_tf desc, then score_rs desc
$sorted = $prospects | Sort-Object @{Expression={$_.composite}; Descending=$true}, @{Expression={$_.score_tf}; Descending=$true}, @{Expression={$_.score_rs}; Descending=$true}

# Apply diversity adjustments
# Cap same business_type+area at 3 in top 20, 5 in top 40
$typeAreaCount = @{}
$adjustments = @{}

for ($i = 0; $i -lt $sorted.Count; $i++) {
    $p = $sorted[$i]
    $key = "$($p.business_type)||$($p.area)"

    if (-not $typeAreaCount.ContainsKey($key)) {
        $typeAreaCount[$key] = @{count=0; indices=@()}
    }
    $typeAreaCount[$key].count++
    $typeAreaCount[$key].indices += $i
}

# Apply caps
foreach ($key in $typeAreaCount.Keys) {
    $info = $typeAreaCount[$key]
    if ($info.count -gt 3) {
        # Check top 20
        $inTop20 = ($info.indices | Where-Object { $_ -lt 20 }).Count
        if ($inTop20 -gt 3) {
            # Need to adjust - push down ones beyond 3rd
            $toAdjust = ($info.indices | Where-Object { $_ -lt 20 } | Select-Object -Skip 3)
            foreach ($idx in $toAdjust) {
                $adjustments[$idx] = -2
            }
        }
        # Check top 40
        $inTop40 = ($info.indices | Where-Object { $_ -lt 40 }).Count
        if ($inTop40 -gt 5) {
            $toAdjust = ($info.indices | Where-Object { $_ -lt 40 } | Select-Object -Skip 5)
            foreach ($idx in $toAdjust) {
                if (-not $adjustments.ContainsKey($idx)) {
                    $adjustments[$idx] = -1
                }
            }
        }
    }
}

# Apply adjustments and re-sort
foreach ($idx in $adjustments.Keys) {
    $sorted[$idx].score_pd = [Math]::Max(1, $sorted[$idx].score_pd + $adjustments[$idx])
    $sorted[$idx].composite = [Math]::Max(1, $sorted[$idx].composite + $adjustments[$idx])
}

# Re-sort after adjustments
$sorted = $sorted | Sort-Object @{Expression={$_.composite}; Descending=$true}, @{Expression={$_.score_tf}; Descending=$true}, @{Expression={$_.score_rs}; Descending=$true}

# Helper function to escape CSV fields
function Escape-CsvField($field) {
    if ($null -eq $field -or $field -eq '') { return '""' }
    $s = [string]$field
    if ($s.Contains(',') -or $s.Contains('"') -or $s.Contains("`n") -or $s.Contains("`r")) {
        $s = $s.Replace('""', '""""')  # Actually, for CSV we use double-double-quote
        return '"' + $s.Replace('"', '""') + '"'
    }
    return $s
}

# Actually simpler: always wrap reasoning in quotes, handle escaping properly
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
    # reasoning always wrapped
    $r = if ($null -eq $p.reasoning) { '' } else { [string]$p.reasoning }
    $parts += '"' + $r.Replace('"', '""') + '"'

    return $parts -join ','
}

# CSV Header
$header = "rank,name,area,business_type,phone,maps_url,facebook_url,website_url,rating,review_count,social_activity,owner_name,owner_phone_visible,score_tf,score_pg,score_rs,score_or,score_pd,composite,reasoning"

# Top 40 CSV
$top40Lines = @($header)
$rankCounter = 0
$top40Prospects = $sorted | Select-Object -First 40
foreach ($p in $top40Prospects) {
    $rankCounter++
    $top40Lines += Format-CsvRow $p $rankCounter
}
$top40Csv = $top40Lines -join "`r`n"

# Full 105 CSV
$allLines = @($header)
$rankCounter = 0
foreach ($p in $sorted) {
    $rankCounter++
    $allLines += Format-CsvRow $p $rankCounter
}
$allCsv = $allLines -join "`r`n"

# Counts for summary
$top40 = $sorted | Select-Object -First 40
$cafes = ($top40 | Where-Object { $_.business_type -eq 'cafe' -or $_.business_type -eq 'café' }).Count
$barbershops = ($top40 | Where-Object { $_.business_type -eq 'barbershop' }).Count
$trades = ($top40 | Where-Object { $_.business_type -eq 'plumber' -or $_.business_type -eq 'electrician' }).Count
$minComp = ($top40 | Select-Object -Last 1).composite
$maxComp = ($top40 | Select-Object -First 1).composite

# Area distribution
$areas = $top40 | Group-Object area | Sort-Object Count -Descending | Select-Object -First 5
$areaSummary = ($areas | ForEach-Object { "$($_.Name)($($_.Count))" }) -join ', '

$summary = "Top 40 range: composite $minComp–$maxComp. Distribution: $cafes cafés, $trades trades (plumbers+electricians), $barbershops barbershops. Top areas: $areaSummary. Diversity caps applied where same business_type+area exceeded 3 in top 20 or 5 in top 40."

# Output
Write-Host "=== SUMMARY ==="
Write-Host $summary
Write-Host ""
Write-Host "=== TOP 40 CSV LENGTH: $($top40Csv.Length) chars ==="
Write-Host "=== ALL CSV LENGTH: $($allCsv.Length) chars ==="

# Save to files
$top40Csv | Out-File -Encoding UTF8 "F:\Documents\Repositories\WebsiteDropshipping\temp_top40.csv"
$allCsv | Out-File -Encoding UTF8 "F:\Documents\Repositories\WebsiteDropshipping\temp_all.csv"

Write-Host "Files written."
Write-Host "DONE"