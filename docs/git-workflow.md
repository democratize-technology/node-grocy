# Git Workflow for node-grocy v1.0.0 Development

## Critical Branch Structure Rules

🚨 **NEVER FORCE PUSH TO `feature/v1-refactoring`** 🚨

- **NEVER commit directly to `feature/v1-refactoring`** - this is the base branch for v1.0.0 work
- **NEVER force push to any shared branch** - destroys git history and breaks collaboration
- **ALWAYS create feature branches off of `feature/v1-refactoring`**
- **ALWAYS target PRs back to `feature/v1-refactoring`** as the base branch
- **ALWAYS go through PR review process** - no exceptions, even for "trivial" changes

## Correct Workflow Pattern

1. `git checkout feature/v1-refactoring`
2. `git checkout -b feature/descriptive-name` (create feature branch)
3. Make changes and commit to feature branch
4. `git push -u origin feature/descriptive-name`
5. `gh pr create --base feature/v1-refactoring --reviewer democratize-technology-code-reviewer`
6. **Wait for review approval** - no exceptions
7. Merge only after all GitHub Actions pass and reviewer approves

## Absolutely Forbidden Actions

- ❌ Direct commits to `feature/v1-refactoring`
- ❌ Force pushing (`git push --force`) to any shared branch
- ❌ Bypassing PR review process
- ❌ Merging without approval
- ❌ "Quick fixes" directly to integration branch
- ❌ Pushing broken code that fails GitHub Actions
- ❌ **Force adding ignored files with `git add -f`** - respect `.gitignore` rules
- ❌ **Committing `.claude/` directory contents** - keep local configs local

**Violation of these rules will result in branch protection enforcement and loss of direct push privileges.**

## Why These Rules Matter

### Technical Consequences

- **Force pushing destroys shared history**: Other developers' work can be lost permanently
- **Unreviewed code introduces bugs**: The immutability principle requires constant vigilance
- **Direct commits break CI/CD**: Our 12 workflows need to validate every change
- **Broken commits block everyone**: Failed CI prevents all PRs from merging

### Human Consequences

- **Violations dissolve trust**: When you bypass processes, teammates can't rely on you
- **Lost work breeds resentment**: Force pushing someone's commits creates lasting friction
- **Rushed fixes cause stress**: "Quick" unreviewed changes often create urgent firefighting
- **Process violations set bad examples**: New contributors learn bad habits

Remember: **Trust takes months to build and seconds to destroy.** Each violation makes collaboration harder.

## Recovery Procedures

If you accidentally:

### Force Pushed to a Shared Branch

1. **STOP** - Don't try to fix it yourself
2. Contact the team immediately via Slack/Discord
3. Share the output of `git reflog` from your machine
4. Team lead will coordinate recovery from backups/reflog
5. Wait for all-clear before continuing work

### Committed Directly to `feature/v1-refactoring`

1. Do NOT force push to "fix" it
2. Create a revert commit immediately:
   ```bash
   git revert HEAD
   git push origin feature/v1-refactoring
   ```
3. Create a proper feature branch with your changes
4. Submit a PR following the correct workflow

### Pushed `.claude/` or Ignored Files

1. Remove from git (but keep locally):
   ```bash
   git rm -r --cached .claude/
   git commit -m "fix: remove accidentally committed .claude directory"
   ```
2. Ensure `.gitignore` contains the path
3. Create PR with the fix

### Merged Without Approval

1. Contact reviewer immediately
2. If issues are found, create a fix PR urgently
3. Document what happened in the PR description

## Good Practice Examples

### ✅ Perfect Workflow Example

```bash
# Start fresh from latest integration branch
git checkout feature/v1-refactoring
git pull origin feature/v1-refactoring

# Create descriptive feature branch
git checkout -b feature/add-zod-validation-issue-1

# Make atomic commits with clear messages
git add src/validators/
git commit -m "feat: add Zod schemas for API validation

- Implements type-safe validation for all API inputs
- Addresses Issue #1 security concerns
- All existing tests pass"

# Push and create PR with reviewer
git push -u origin feature/add-zod-validation-issue-1
gh pr create --base feature/v1-refactoring \
  --reviewer democratize-technology-code-reviewer \
  --title "feat: add Zod validation for API inputs (#1)" \
  --body "Implements comprehensive input validation..."
```

### ✅ Collaborative Conflict Resolution

```bash
# When you have conflicts with integration branch
git checkout feature/v1-refactoring
git pull origin feature/v1-refactoring
git checkout feature/your-branch
git rebase feature/v1-refactoring  # Never force push after this!

# If rebase is complex, prefer merge
git merge feature/v1-refactoring
git push origin feature/your-branch  # Regular push, not force
```

### ✅ Stacked PRs Done Right

```bash
# When building on pending PR
git checkout feature/pending-pr-branch
git checkout -b feature/builds-on-pending-pr

# In PR description, note the dependency
# "This PR depends on #25 and should be merged after it"
```

## Branch Hierarchy

```
main branch (production)
└── feature/v1-refactoring (v1.0.0 base branch)
    ├── feature/host-system-memory
    ├── feature/fix-input-validation
    ├── feature/add-error-handling
    └── feature/typescript-migration
    └── ... (other feature branches)
```

## Why This Structure?

The `feature/v1-refactoring` branch serves as:

- A stable integration point for all v1.0.0 work
- Protection against breaking the main branch during major refactoring
- Clear separation of v1.0.0 development from maintenance work
- Easier testing and review of the complete v1.0.0 changes before merging to main

## For Contributors

When contributing to the v1.0.0 refactoring:

1. Always branch off `feature/v1-refactoring`
2. Keep your feature branches focused and small
3. Target your PRs to `feature/v1-refactoring`, not main
4. Follow the immutability principles outlined in `CLAUDE.md`
5. Read and understand the recovery procedures BEFORE you need them
6. Remember: Quality > Speed. Always.
