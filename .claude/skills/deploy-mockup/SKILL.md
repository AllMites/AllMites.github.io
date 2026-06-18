---
name: deploy-mockup
description: Use when template HTML is reskinned and ready for client preview — deploys to GitHub Pages and returns live URL. Fully automated, no checkpoints.
---

# deploy-mockup

Deploy a reskinned template `index.html` to GitHub Pages and return the live mockup URL. Fully automated — no verification checkpoints, no manual steps.

## Input

Ask user for:
- `htmlSourcePath` — path to the output HTML (e.g., `Clients/sinaya-coffee/mockup.html`)
- `slug` — URL-safe repo name. If omitted, auto-extracted from the output path.
- `businessName` — display name for the repo description. If omitted, extracted from config.

**Slug auto-detection:** If `htmlSourcePath` is under `Clients/{slug}/`, extract the slug from the path. Otherwise, read the config to derive it. Generate slug: lowercase, replace spaces/special chars with hyphens, collapse consecutive hyphens.

**Config source:** Always read from `Clients/{slug}/clientconfig.json` (at the same slug level as the HTML).

---

## Phase 1: Validate

Run all validations. Abort with specific error if any fail.

### 1a. HTML file exists and is valid

```powershell
Test-Path "{htmlSourcePath}"
```

Read first 3 lines to confirm it starts with `<!DOCTYPE html>` or `<html`.

### 1b. gh CLI authenticated

```powershell
gh auth status
```

If exit code non-zero → abort: "gh CLI not authenticated. Run `gh auth login` first."

### 1c. Resolve slug and businessName

Extract the slug from the `htmlSourcePath`. If path is under `Clients/{slug}/`, parse it:

```powershell
$slug = ($htmlSourcePath -split '[/\\]' | Select-Object -Index 1)
```

If slug not detectable from path, ask user.

Read config for business name:
```powershell
$configPath = "Clients/$slug/clientconfig.json"
$config = Get-Content $configPath | ConvertFrom-Json
```

Extract business name (works for all template types):
- `config.BUSINESS_NAME` (cafe, barbershop, trades may use this or `HERO_BUSINESS_NAME`)
- Fallback: `config.HERO_BUSINESS_NAME`

Generate slug (overrides path-based slug if different):
```powershell
$slug = $businessName.ToLower() -replace '[^a-z0-9]+', '-' -replace '^-|-$', ''
```

If slug generation fails → abort: "Could not generate slug. Provide one manually."

### 1d. Check for existing repo

```powershell
gh repo view "AllMites/$slug" --json name 2>$null
```

If repo exists:
- If user says "redeploy" or "update" → update existing repo (Phase 2a-alt)
- Otherwise → append `-2` to slug (or `-3`, `-4`... first available)
- Log: "Repo AllMites/{original-slug} already exists. Using AllMites/{new-slug} instead."

### 1e. Detect redeploy intent

Check user's message for "redeploy", "deploy again", "update" combined with a slug or repo name. If detected:
- Set `$isRedeploy = $true`
- Use the existing slug (don't increment)
- Skip to Phase 2a-alt (clone-and-update flow)

---

## Phase 2: Deploy

### 2a. Create temp directory and init git (new repo)

```powershell
$tempDir = New-Item -ItemType Directory -Path "$env:TEMP/deploy-{slug}-$(Get-Random)" -Force
Set-Location $tempDir
git init
git checkout -b main
```

### 2a-alt. Clone existing repo (redeploy)

Only use this when `$isRedeploy = $true`:

```powershell
$tempDir = New-Item -ItemType Directory -Path "$env:TEMP/deploy-{slug}-$(Get-Random)" -Force
Set-Location $tempDir
git clone "https://github.com/AllMites/{slug}.git" .
```

Then proceed to 2b, 2b-2, commit, and push normally (gh repo create skipped).

### 2b. Copy HTML as index.html and images folder

```powershell
Copy-Item "{htmlSourcePath}" "$tempDir/index.html"
```

### 2b-2. Copy images folder (if exists)

```powershell
$imagesDir = "Clients/{slug}/images"
if (Test-Path $imagesDir) {
  Copy-Item $imagesDir "$tempDir/images" -Recurse -Force
  Write-Host "Images folder deployed."
} else {
  Write-Host "No images folder — skipping."
}
```

### 2c. Create repo on GitHub and push

```powershell
git add index.html images/
git commit -m "Initial deploy for {businessName}"
gh repo create "AllMites/{slug}" --public --description "Website for {businessName}" --source=. --remote=origin --push
```

If this fails:
- Check error for "name already exists" → increment slug, retry from 2a
- Check error for "push declined" → force push with `git push --set-upstream origin main --force` (only if repo was just created)
- Any other error → abort with the gh error message

### 2d. Enable GitHub Pages

```powershell
gh api "repos/AllMites/{slug}/pages" -X POST -f "source[branch]=main" -f "source[path]=/"
```

If this returns an error containing "already" or "exists" → Pages is already enabled. Continue.
If this returns any other error → warn: "Pages enable failed: {error}. Try enabling manually at https://github.com/AllMites/{slug}/settings/pages" — then continue to return URL anyway.

### 2e. Wait for Pages build

```powershell
$maxWait = 120
$elapsed = 0
do {
  Start-Sleep -Seconds 5
  $elapsed += 5
  $status = gh api "repos/AllMites/{slug}/pages" --jq '.status' 2>$null
} while ($status -eq 'building' -and $elapsed -lt $maxWait)
```

If status is `built` → Pages is live.
If status is `errored` → warn: "Pages build errored. Check https://github.com/AllMites/{slug}/settings/pages"
If timed out → warn: "Pages still building after {maxWait}s. Check manually at https://github.com/AllMites/{slug}/settings/pages"

### 2f. Clean up temp directory

```powershell
Remove-Item -Recurse -Force $tempDir
Set-Location "F:\Documents\Repositories\WebsiteDropshipping"
```

---

## Phase 3: Report

```
Deployed: https://allmites.github.io/{slug}/

  Business:   {businessName}
  Repo:       https://github.com/AllMites/{slug}
  Status:     {built | building (check manually) | errored}
  Slug used:  {slug}

Next: Send this URL to the client. They can open it on their phone.
```

If the Pages URL isn't working yet, also output the raw repo URL:
```
Raw file: https://github.com/AllMites/{slug}/blob/main/index.html
(Open on phone via raw.githack.com if Pages not live yet)
```

**Skill complete.** Mockup is live and ready for client.
