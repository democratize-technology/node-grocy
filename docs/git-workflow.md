# Git Workflow for node-grocy v1.0.0 Development

## Critical Branch Structure Rules
- **NEVER commit directly to `feature/v1-refactoring`** - this is the base branch for v1.0.0 work
- **ALWAYS create feature branches off of `feature/v1-refactoring`**
- **ALWAYS target PRs back to `feature/v1-refactoring`** as the base branch

## Correct Workflow Pattern
1. `git checkout feature/v1-refactoring`
2. `git checkout -b feature/descriptive-name` (create feature branch)
3. Make changes and commit to feature branch
4. `git push -u origin feature/descriptive-name`
5. `gh pr create --base feature/v1-refactoring` (target the base branch)
6. Add reviewer: `--reviewer democratize-technology-code-reviewer`

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