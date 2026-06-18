# Migrate kantowd from Netlify to GitHub Pages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move kantowd (portfolio Vite site) from Netlify to GitHub Pages, eliminating credit usage.

**Architecture:** Push portfolio source to `AllMites/kanto-coffee` repo (replacing bare `index.html`), add GitHub Actions workflow to build Vite + deploy to GitHub Pages. Delete Netlify site after verification.

**Tech Stack:** Vite + React 19 + Tailwind CSS 4, GitHub Actions, GitHub Pages

---

### Task 1: Init Git and Push Portfolio Source

**Files:**
- Create: `portfolio/.gitignore` (exists, verify)
- Will overwrite: `AllMites/kanto-coffee` repo contents

- [ ] **Step 1: Init git in portfolio directory**

```bash
cd F:/Documents/Repositories/WebsiteDropshipping/portfolio
git init
```

- [ ] **Step 2: Verify .gitignore covers dist and node_modules**

```bash
cat .gitignore
```

Expected: contains `node_modules`, `dist`, `.netlify`

- [ ] **Step 3: Add and commit all source files**

```bash
git add .
git commit -m "feat: portfolio source — Vite + React + Tailwind"
```

- [ ] **Step 4: Add remote and force-push to kanto-coffee**

```bash
git remote add origin https://github.com/AllMites/kanto-coffee.git
git branch -M main
git push -f origin main
```

Note: Force push required — `kanto-coffee` currently has a bare `index.html` from template demo. This replaces it with the portfolio source.

- [ ] **Step 5: Verify push succeeded**

```bash
gh api repos/AllMites/kanto-coffee/contents --jq '.[].name'
```

Expected: `src/`, `public/`, `package.json`, `vite.config.js`, etc. (NOT just `index.html`)

### Task 2: Add GitHub Actions Workflow

**Files:**
- Create: `portfolio/.github/workflows/deploy.yml`

- [ ] **Step 1: Create workflow file**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit and push workflow**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Pages deploy workflow"
git push origin main
```

### Task 3: Enable GitHub Pages

- [ ] **Step 1: Set Pages to deploy from Actions**

```bash
gh api repos/AllMites/kanto-coffee/pages --method POST -f "build_type=legacy" -f "source.branch=main" -f "source.path=/"
```

Wait 10s, then:

```bash
gh api repos/AllMites/kanto-coffee/pages --method PUT -f "build_type=workflow"
```

- [ ] **Step 2: Wait for workflow run and verify**

```bash
gh run list --repo AllMites/kanto-coffee --workflow deploy.yml --limit 1 --json status,conclusion
```

- [ ] **Step 3: Get Pages URL**

```bash
gh api repos/AllMites/kanto-coffee/pages --jq '.html_url'
```

Expected: `https://allmites.github.io/kanto-coffee/`

### Task 4: Verify and Clean Up

- [ ] **Step 1: Open the Pages URL in browser and verify site renders correctly**

Navigate to `https://allmites.github.io/kanto-coffee/` — should match `https://kantowd.netlify.app`

- [ ] **Step 2: Delete Netlify site after verification**

```bash
netlify sites:delete --site-id 87db2c77-6939-435b-ba9f-83e6a8f0daab
```

Confirm when prompted.

- [ ] **Step 3: Remove netlify.toml from repo to keep things clean**

```bash
git rm netlify.toml
git commit -m "chore: remove netlify config after migration"
git push origin main
```
