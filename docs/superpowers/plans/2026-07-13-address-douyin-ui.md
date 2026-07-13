# Address Douyin UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize the Address module into a Douyin-inspired light glassmorphism UI without changing business behavior.

**Architecture:** Keep the existing Vue 2 single-file components and Ant Design Vue controls. Change template wrappers and scoped Less/CSS classes only where needed, preserving API calls, pagination, modals, and row actions. Keep the project’s existing light theme and use glassmorphism, Apple-style clarity, Tailwind UI-style cards, and Douyin admin information hierarchy rather than a dark theme.

**Tech Stack:** Vue 2, Ant Design Vue 1.x, Vue CLI 4, scoped styles in `.vue` files.

---

### Task 1: Address list page light glass visual refresh

**Files:**
- Modify: `src/views/module/Address/index.vue`

- [ ] **Step 1: Add a dark hero section around current table actions**

Replace the current `.table-operations` content with a white-blue glass hero layout that still calls `$refs.CreateForm.handleAdd()` and keeps `<table-setting>`.

- [ ] **Step 2: Add computed counts for display**

Add `taskCountText` and `deviceCountText` computed properties based on `total` and `deviceData.length`.

- [ ] **Step 3: Restyle the table**

Keep all columns and slots, but change scoped CSS so the table uses rounded glass headers, blue hover, soft shadows, micro-glow borders, and Douyin-style pills.

### Task 2: Address detail page visual refresh

**Files:**
- Modify: `src/views/module/Address/detailPage.vue`

- [ ] **Step 1: Restyle page shell**

Keep the `.address` wrapper light blue, with soft gradients, translucent glow blobs, and subtle red/cyan accents.

- [ ] **Step 2: Restyle region card and comments**

Keep the current left image/right comments layout, but update `.video-list__douyin-card`, `.douyin-card__left`, `.douyin-card__right`, comment text, empty states, and load-more controls into light glass panels.

- [ ] **Step 3: Restyle filter bar and video cards**

Update `.video-list__sort-buttons` and `.video-list__video-card` to use white glass panels, blue primary controls, subtle red/cyan accents, micro-glow borders, and compact information pills.

### Task 3: Verify and commit

**Files:**
- Verify: project root

- [ ] **Step 1: Run production build**

Run: `npm run build`

Expected: exit code `0`.

- [ ] **Step 2: Review changed files**

Run: `git status --short` and `git diff --stat`

Expected: only docs and Address Vue files changed.

- [ ] **Step 3: Commit implementation**

Run:

```bash
git add docs/superpowers/specs/2026-07-13-address-douyin-ui-design.md docs/superpowers/plans/2026-07-13-address-douyin-ui.md src/views/module/Address/index.vue src/views/module/Address/detailPage.vue
git commit -m "feat: refresh address module douyin style UI"
```

- [ ] **Step 4: Try safe remote push**

Run:

```bash
git push -u origin feature/address-douyin-ui-20260713
```

Expected: push succeeds if GitHub credentials are available; otherwise keep the local commit and report the exact push command.
