# Code Review Guidelines for node-grocy v1.0.0

## Critical Git Workflow Rules

🚨 **NEVER FORCE PUSH TO `feature/v1-refactoring`** 🚨

The `feature/v1-refactoring` branch is the protected integration branch for v1.0.0 development. ALL changes must go through proper PR review process:

### Required Workflow for ALL Changes
1. **Create feature branch**: `git checkout -b feature/descriptive-name`
2. **Make changes and commit**: Follow conventional commit format
3. **Push to remote**: `git push -u origin feature/descriptive-name`  
4. **Open PR**: `gh pr create --base feature/v1-refactoring --reviewer democratize-technology-code-reviewer`
5. **Wait for review**: No exceptions, even for "trivial" changes
6. **Merge after approval**: Only after all checks pass and review approval

### Absolutely Forbidden
- ❌ Direct commits to `feature/v1-refactoring`
- ❌ Force pushing to any shared branch
- ❌ Bypassing PR review process
- ❌ Merging without approval
- ❌ "Quick fixes" directly to integration branch

**Violation of these rules will result in branch protection and mandatory review for ALL future changes.**

## For Developers Preparing PRs

### Before Submitting Your PR

1. **Self-Review Checklist**
   - [ ] No mutations - all updates create new objects/arrays
   - [ ] Run all tests locally: `npm test`
   - [ ] Check test coverage: `npm run coverage` (must be ≥95%)
   - [ ] Lint your code: `npm run lint` (enforces immutability rules)
   - [ ] Build TypeScript (if applicable): `npm run build`
   - [ ] Update CHANGELOG.md with your changes
   - [ ] Update documentation for any API changes
   - [ ] Ensure no console.log statements remain
   - [ ] Verify no sensitive data (API keys, passwords) in code
   - [ ] All function parameters use Readonly types
   - [ ] New line at the end of file

2. **PR Title Format**
   ```
   [TYPE] Brief description

   Types: feat, fix, refactor, test, docs, perf, chore
   Example: [refactor] Extract StockService from monolithic client
   ```

3. **PR Description Template**
   ```markdown
   ## Summary
   Brief description of what this PR does

   ## Related Issue
   Fixes #[issue number]

   ## Changes Made
   - Bullet points of specific changes
   - Include technical decisions made

   ## Testing
   - Describe test coverage added/modified
   - Include performance impact if applicable

   ## Breaking Changes
   - List any breaking changes
   - Include migration instructions

   ## Checklist
   - [ ] Tests pass locally
   - [ ] Documentation updated
   - [ ] No breaking changes OR migration guide provided
   - [ ] Security review completed
   ```
### What Claude Code Should Include in PRs

When Claude Code creates a PR, ensure it includes:

1. **Commit Messages**
   - Use conventional commit format
   - Reference issue numbers
   - Keep under 72 characters for title
   ```
   fix: prevent API key exposure in URLs (#3)

   - Move API key from URL to headers
   - Add tests for secure transmission
   - Update documentation
   ```

2. **Code Comments**
   - Document complex logic
   - Explain non-obvious decisions
   - Add JSDoc for all public methods
   ```typescript
   /**
    * Retrieves current stock levels for products
    * @param productId - Optional product ID to filter results
    * @returns Promise resolving to array of stock entries
    * @throws {GrocyAuthenticationError} If API key is invalid
    * @example
    * const stock = await stockService.getStock();
    * console.log(stock[0].amount); // 5
    */
   async getStock(productId?: number): Promise<StockEntry[]> {
     // Implementation
   }
   ```

3. **Test Coverage**
   - Unit tests for all new code
   - Integration tests for API endpoints
   - Edge case coverage
   - Error scenario testing

### Immutability Requirements

**All code MUST be immutable:**
- No object mutations - use spread operator `{...obj, newProp: value}`
- No array mutations - use `concat()`, `filter()`, `map()`, spread `[...arr]`
- Mark all parameters as `Readonly<T>` or `ReadonlyArray<T>`
- Use `Object.freeze()` for runtime immutability enforcement
- Return new objects from functions, never modify inputs

**ESLint Enforcement:**
Our ESLint configuration (`eslint-plugin-functional`) automatically enforces:
- `functional/immutable-data` - Prevents mutations
- `functional/no-let` - Enforces const declarations
- `functional/prefer-readonly-type` - Requires Readonly types
- `functional/prefer-immutable-types` - Deep immutability checking
- Blocks mutating array methods: push, pop, shift, unshift, splice, sort, reverse

**Examples:**
```typescript
// ❌ NEVER DO THIS
function updateStock(stock: Stock[], item: StockItem) {
  stock.push(item); // MUTATION!
  return stock;
}

// ✅ ALWAYS DO THIS
function updateStock(
  stock: ReadonlyArray<Readonly<Stock>>,
  item: Readonly<StockItem>
): ReadonlyArray<Stock> {
  return [...stock, item];
}
```

### Security Considerations

**Always check for:**
- API keys in code (should be in environment variables)
- SQL injection vulnerabilities
- XSS attack vectors
- Sensitive data in logs
- Proper input validation
- CORS configuration
### Performance Review Points

1. **API Calls**
   - Batch operations where possible
   - Implement proper caching
   - Use connection pooling
   - Handle rate limiting

2. **Memory Management**
   - Stream large files instead of loading into memory
   - Clean up event listeners
   - Proper error handling to prevent leaks

3. **Algorithm Efficiency**
   - Avoid N+1 query problems
   - Use appropriate data structures
   - Consider time/space complexity

### TypeScript Migration Specific

1. **Type Safety**
   ```typescript
   // ❌ Avoid
   function processData(data: any): any

   // ✅ Prefer
   function processData(data: GrocyApiResponse): ProcessedData
   ```

2. **Validation**
   ```typescript
   // Use Zod for runtime validation
   const schema = z.object({
     id: z.number().positive(),
     name: z.string().min(1),
     amount: z.number().nonnegative()
   });

   function validateInput(input: unknown): ValidatedData {
     return schema.parse(input);
   }
   ```
## For Code Reviewers

### Review Priority Order
1. **Immutability violations** (MUST fix - no mutations allowed)
2. **Security vulnerabilities** (MUST fix before merge)
3. **Breaking changes** (require migration guide)
4. **Test coverage** (must meet 95% threshold)
5. **Performance issues** (profile if suspicious)
6. **Code style** (should follow project conventions)

### Reviewer Assignment
- **Always tag `democratize-technology-code-reviewer` as reviewer** when creating pull requests
- For architecture changes, request additional review from project maintainer
- For security-sensitive changes, request security team review

### Review Response Time
- Critical security fixes: Within 2 hours
- Bug fixes: Within 24 hours
- Features/refactoring: Within 48 hours

### Feedback Format
Use the emoji system defined in CLAUDE.md:
- 🚨 **Critical**: Must fix before merge
- ⚠️ **Important**: Should fix, discuss if you disagree
- 💡 **Suggestion**: Consider for improvement
- ✨ **Praise**: Good patterns to encourage
- ❓ **Question**: Need clarification

### Common Review Focus Areas
1. **Immutability**: No mutations, Readonly types, Object.freeze usage
2. **Security**: API key handling, input validation, SQL injection
3. **Tests**: Coverage, edge cases, mocking strategy
4. **Types**: No `any`, proper generics, validation, Readonly everywhere
5. **Errors**: Custom error classes, proper error messages
6. **Docs**: JSDoc completeness, examples, changelog

Remember: The goal is to ship high-quality, maintainable code that will serve the node-grocy community for years to come.
