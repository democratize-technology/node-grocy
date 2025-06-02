# Contributing to node-grocy v1.0.0

Welcome to the node-grocy v1.0.0 refactoring project! This guide will help you understand our development workflow, quality standards, and automated systems.

## 🎯 Project Overview

We're transforming node-grocy from a 19,843-line JavaScript monolith into a modular, TypeScript-based library with enterprise-grade quality standards. Our **#1 principle: IMMUTABILITY** - No mutations, ever.

## 🔄 Development Workflow

### Branch Structure

```
main (production)
└── feature/v1-refactoring (v1.0.0 base branch)
    ├── feature/your-feature-name
    ├── feature/fix-issue-number
    └── feature/implement-something
```

### Getting Started

1. **Fork the repository**
2. **Create feature branch** off `feature/v1-refactoring`:
   ```bash
   git checkout feature/v1-refactoring
   git checkout -b feature/your-feature-name
   ```
3. **Make changes following our standards** (see below)
4. **Push and create PR** targeting `feature/v1-refactoring`

## 🤖 Automated Quality Gates

Our GitHub Actions workflows enforce quality standards automatically:

### Phase 1 - Critical Workflows (Always Required)

#### 🚨 Immutability Check (`immutability-check.yml`)

- **Trigger**: Every push/PR to `feature/v1-refactoring`
- **Purpose**: Enforces our core principle - NO mutations allowed
- **Checks**:
  - ESLint functional rules validation
  - Scans for mutation methods (`push`, `pop`, `splice`, etc.)
  - Validates object mutations
  - Generates immutability report

**What it catches:**

```javascript
// ❌ VIOLATIONS - Will fail the build
product.name = 'new name'; // Object mutation
items.push(newItem); // Array mutation
let counter = 0;
counter++; // Variable mutation

// ✅ CORRECT - Will pass
product = { ...product, name: 'new name' }; // Immutable update
items = [...items, newItem]; // Immutable array
const counter = items.length; // Immutable variable
```

#### 📊 Test Coverage (`test-coverage.yml`)

- **Trigger**: Every push/PR to `feature/v1-refactoring`
- **Purpose**: Maintains 95%+ test coverage requirement
- **Features**:
  - Enforces 95% minimum coverage threshold
  - Compares coverage with base branch
  - Posts coverage reports to PRs
  - Fails if coverage decreases

**Requirements:**

- All new code must include comprehensive tests
- Focus on edge cases and error handling
- Maintain or improve overall coverage percentage

#### 🛡️ Security Scan (`security.yml`)

- **Trigger**: Push/PR + weekly schedule
- **Purpose**: Identifies security vulnerabilities
- **Checks**:
  - npm audit for dependency vulnerabilities
  - CodeQL static analysis
  - Secret scanning
  - Security best practices validation

### Phase 2 - Migration Support Workflows

#### 📈 TypeScript Migration (`typescript-migration.yml`)

- **Trigger**: Changes to `.js`, `.mjs`, `.ts`, `.tsx` files
- **Purpose**: Tracks JavaScript → TypeScript conversion progress
- **Features**:
  - Visual progress tracking with charts
  - Migration percentage calculation
  - Identifies large files needing conversion
  - Auto-generates `tsconfig.json` if missing

#### 🔍 API Compatibility (`api-compatibility.yml`)

- **Trigger**: PRs that modify public APIs
- **Purpose**: Prevents breaking changes during v1.0.0 migration
- **Features**:
  - Compares API surface between branches
  - Detects removed/added API elements
  - Fails on breaking changes
  - Generates migration guidance

#### 🏗️ Architecture Validation (`architecture.yml`)

- **Trigger**: Changes to service files in `src/`
- **Purpose**: Enforces modular architecture principles
- **Checks**:
  - Service boundary validation
  - Dependency injection patterns
  - Circular dependency detection
  - File size limits (300 lines per service)

### Enhanced Core Workflows

#### ✅ CI Pipeline (`ci.yml`)

- **Trigger**: All pushes and PRs
- **Features**:
  - Multi-platform testing (Ubuntu, macOS, Windows)
  - Node.js 20.x and 22.x compatibility
  - Comprehensive test suite execution
  - Artifact caching for performance

## 📝 Development Standards

### 1. Immutability Requirements (CRITICAL)

**All code MUST be immutable. No exceptions.**

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
  return [...stock, item]; // Creates new array
}
```

**Key Rules:**

- Use `const` instead of `let/var`
- Use spread operator for object updates: `{...obj, newProp: value}`
- Use immutable array methods: `concat()`, `filter()`, `map()`, `slice()`
- Mark function parameters as `Readonly<T>` or `ReadonlyArray<T>`
- Return new objects/arrays, never modify inputs

### 2. TypeScript Migration Standards

```typescript
// ❌ Avoid
function processData(data: any): any;

// ✅ Prefer
import { z } from 'zod';

const GrocyProductSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1),
  location_id: z.number(),
});

type GrocyProduct = z.infer<typeof GrocyProductSchema>;

function processProduct(data: unknown): GrocyProduct {
  return GrocyProductSchema.parse(data);
}
```

### 3. Service Architecture Patterns

```typescript
// ✅ Recommended DI pattern
interface IHttpClient {
  get(url: string): Promise<Response>;
  post(url: string, data: unknown): Promise<Response>;
}

interface IStockService {
  getStock(): Promise<ReadonlyArray<Readonly<StockItem>>>;
  addStock(productId: number, amount: number): Promise<void>;
}

class StockService implements IStockService {
  constructor(private readonly httpClient: IHttpClient) {}

  async getStock(): Promise<ReadonlyArray<Readonly<StockItem>>> {
    const response = await this.httpClient.get('/stock');
    return Object.freeze(response.data);
  }
}
```

### 4. Testing Standards

```typescript
// ✅ Comprehensive test structure
describe('StockService', () => {
  let service: StockService;
  let mockHttpClient: jest.Mocked<IHttpClient>;

  beforeEach(() => {
    mockHttpClient = createMockHttpClient();
    service = new StockService(mockHttpClient);
  });

  describe('getStock', () => {
    it('should return immutable stock array', async () => {
      const mockData = [{ id: 1, amount: 5 }];
      mockHttpClient.get.mockResolvedValue({ data: mockData });

      const result = await service.getStock();

      expect(result).toEqual(mockData);
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should handle empty inventory gracefully', async () => {
      mockHttpClient.get.mockResolvedValue({ data: [] });
      const result = await service.getStock();
      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('API Error'));
      await expect(service.getStock()).rejects.toThrow('API Error');
    });
  });
});
```

## 🚀 PR Process

### 1. Before Submitting

- [ ] All tests pass locally: `npm test`
- [ ] Code follows immutability principles
- [ ] New code has 95%+ test coverage
- [ ] No console.log statements remain
- [ ] TypeScript types are properly defined
- [ ] Documentation updated for API changes

### 2. PR Requirements

```markdown
## Summary

Brief description of changes

## Related Issue

Fixes #[issue-number]

## Changes Made

- Specific changes with technical details
- Architectural decisions explained

## Testing

- Test coverage details
- Performance impact assessment

## Breaking Changes

- List any breaking changes
- Migration instructions if needed

## Checklist

- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No breaking changes OR migration guide provided
- [ ] Immutability principles followed
```

### 3. Automated Checks

Your PR will automatically be checked by:

- 🚨 **Immutability Check** - Must pass (no mutations)
- 📊 **Test Coverage** - Must maintain 95%+
- 🛡️ **Security Scan** - No vulnerabilities
- 🔍 **API Compatibility** - No breaking changes
- 🏗️ **Architecture** - Follows service patterns
- 📈 **TypeScript Migration** - Progress tracking

### 4. Review Process

- **Automated Review**: AI-powered review via Bedrock
- **Manual Review**: Team member review required
- **Architecture Review**: For significant changes
- **Security Review**: For security-sensitive code

## 🔧 Local Development Setup

### Prerequisites

- Node.js 20.x or 22.x
- npm (comes with Node.js)
- Git

### Installation

```bash
git clone https://github.com/democratize-technology/node-grocy.git
cd node-grocy
git checkout feature/v1-refactoring
npm install
```

### Development Commands

```bash
# Run tests
npm test

# Run tests with coverage (manual)
npx c8 npm test

# Run immutability checks (manual)
npx eslint *.mjs --config .eslintrc.json

# Check for mutations (manual)
grep -n -E "(\.push\(|\.pop\(|\.shift\()" *.mjs || echo "No mutations found"
```

### TypeScript Setup

```bash
# Install TypeScript dependencies
npm install --save-dev typescript @types/node

# Create tsconfig.json (if not exists)
# This is automatically created by the TypeScript Migration workflow
```

## 🐛 Issue Reporting

### Bug Reports

Use this template for bug reports:

```markdown
## Bug Description

Clear description of the bug

## Steps to Reproduce

1. Step one
2. Step two
3. Step three

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- Node.js version:
- npm version:
- OS:

## Additional Context

Any other relevant information
```

### Feature Requests

```markdown
## Feature Description

Clear description of the proposed feature

## Use Case

Why is this feature needed?

## Proposed Implementation

High-level implementation approach

## Breaking Changes

Any potential breaking changes

## Related Issues

Links to related issues
```

## 📚 Resources

### Key Documents

- [CLAUDE.md](../CLAUDE.md) - Core development principles
- [Git Workflow](../docs/git-workflow.md) - Branch strategy details
- [Code Review Guidelines](.claude/code-review.md) - Review standards

### External Resources

- [Grocy API Documentation](https://demo.grocy.info/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Functional Programming in TypeScript](https://gcanti.github.io/fp-ts/)
- [Zod Documentation](https://zod.dev/)

### Community

- [GitHub Issues](https://github.com/democratize-technology/node-grocy/issues)
- [Discussions](https://github.com/democratize-technology/node-grocy/discussions)

## 🎉 Recognition

Contributors who follow these guidelines and help improve node-grocy will be:

- Listed in the CONTRIBUTORS.md file
- Credited in release notes
- Invited to join the core team for significant contributions

## 📄 License

By contributing to node-grocy, you agree that your contributions will be licensed under the MIT License.

---

**Remember**: We're building the foundation for the next 5 years of node-grocy development. Every line of code matters, and immutability is our cornerstone principle!

For questions, please open a [Discussion](https://github.com/democratize-technology/node-grocy/discussions) or reach out to the maintainers.
