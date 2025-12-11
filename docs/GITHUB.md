# GitHub Workflow (team quick guide)

Use this when collaborating so everyone stays in sync and reviews are smooth.

## 1) Before you start work
- Ensure you’re on main and up to date:  
  `git checkout main`  
  `git pull origin main`
- Create a feature branch:  
  `git checkout -b feature/<short-description>`

## 2) Do the work
- Make small, focused changes.
- Check what you changed: `git status`, `git diff`.
- Avoid committing secrets or environment files (e.g., `.env`, DB dumps).

## 3) Commit
- Stage and commit with a clear message:  
  `git add <files>`  
  `git commit -m "feat: short summary"`
- Keep commits logical; avoid piling unrelated changes together.

## 4) Push and open a PR
- Push your branch: `git push -u origin feature/<short-description>`
- Open a Pull Request on GitHub:
  - Title: short and descriptive.
  - Description: what changed, why, how to test.
  - Link related issue (if any) and request reviewers.

## 5) Keep your PR fresh
- If main moved, rebase or merge main into your branch:  
  `git fetch origin`  
  `git rebase origin/main`  (or `git merge origin/main`)
- Resolve conflicts locally, test again, and push: `git push --force-with-lease` (for rebase) or `git push` (for merge).

## 6) Pulling changes from others
- Switch to main: `git checkout main`
- Pull latest: `git pull origin main`
- Update your branch with main (rebase or merge as above).

## 7) Common dev checklist
- Run quick checks/lints/tests relevant to your change.
- Verify the app runs in XAMPP after DB migrations.
- Keep PRs small; big changes are harder to review.
- Add/update docs when you add features (API, game rules, setup steps).

## 8) Merging
- Only merge after approval and passing checks.
- Prefer “Squash and merge” for tidy history unless the team agrees otherwise.

