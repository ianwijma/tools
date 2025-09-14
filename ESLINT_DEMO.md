# ESLint Code Style Enforcement Demo

This file demonstrates how ESLint automatically enforces all the project's code style guidelines. All examples below will cause ESLint errors, making them impossible to commit.

## 🚨 Critical Rule Violations (Auto-Blocked)

### 1. NO 'any' Types Policy - ENFORCED ✅

```typescript
// ❌ ESLint Error: @typescript-eslint/no-explicit-any
const userData: any = fetchUser();
function process(input: any): any { return input; }

// ✅ REQUIRED: Explicit types
const userData: UserData = fetchUser();
function process(input: UserInput): UserOutput { return transformInput(input); }
```

### 2. NO JSX in Variables Policy - ENFORCED ✅

```typescript
// ❌ ESLint Error: no-restricted-syntax
const element = <div>Hello World</div>;
const conditional = condition ? <span>Yes</span> : <span>No</span>;
const items = [<li key="1">Item 1</li>, <li key="2">Item 2</li>];

// ✅ REQUIRED: Extract to components or inline
const HelloComponent = (): JSX.Element => <div>Hello World</div>;
return condition ? <span>Yes</span> : <span>No</span>;
return <ul><li>Item 1</li><li>Item 2</li></ul>;
```

### 3. NO Server Data Storage Policy - ENFORCED ✅

```typescript
// ❌ ESLint Error: no-restricted-imports
import { PrismaClient } from '@prisma/client';
import redis from 'redis';

// ❌ ESLint Error: no-restricted-globals  
global.userData = data;

// ✅ REQUIRED: Frontend storage only
localStorage.setItem('userData', JSON.stringify(data));
```

### 4. Explicit Function Return Types - ENFORCED ✅

```typescript
// ❌ ESLint Error: @typescript-eslint/explicit-function-return-type
function getUserData() { return { name: 'John' }; }
const processUser = (user) => user.name.toUpperCase();

// ✅ REQUIRED: Explicit return types
function getUserData(): UserData { return { name: 'John' }; }
const processUser = (user: User): string => user.name.toUpperCase();
```

## 📋 Real-Time Enforcement

### In Your Editor
ESLint will show red squiggly lines under violations immediately as you type:

- VS Code: Install ESLint extension
- WebStorm: Built-in support
- Vim/Neovim: Use ALE or coc-eslint

### Pre-Commit Hook
```bash
# This will run automatically on git commit
npm run lint  # Biome + ESLint + TypeScript
npm run test  # Jest tests

# If any violations exist, commit is BLOCKED
```

### CI/CD Pipeline
```bash
# GitHub Actions runs these checks
npm run ci-check  # Complete verification

# Pull requests cannot be merged if:
# - ESLint errors exist
# - TypeScript errors exist  
# - Tests fail
# - Build fails
```

## 🔧 Commands to Verify Rules

### Test Current Codebase
```bash
npm run lint:eslint    # Check ESLint rules only
npm run lint:types     # Check TypeScript rules only
npm run lint           # Check everything
```

### Auto-Fix What's Possible
```bash
npm run lint:fix       # Fix formatting and auto-fixable rules
```

### Create Test Violations
```bash
# Try creating a file with 'any' types
echo "const test: any = 123;" > test-violation.ts
npm run lint:eslint    # Will show errors

# Clean up
rm test-violation.ts
```

## 📊 Rules Coverage

### Enforced Rules ✅
- ✅ NO 'any' types (`@typescript-eslint/no-explicit-any`)
- ✅ NO JSX in variables (`no-restricted-syntax`)
- ✅ NO server storage (`no-restricted-imports`, `no-restricted-globals`)
- ✅ Explicit function return types (`@typescript-eslint/explicit-function-return-type`)
- ✅ Explicit variable types (`@typescript-eslint/typedef`)
- ✅ Proper error handling (`@typescript-eslint/no-floating-promises`)
- ✅ React best practices (`react-hooks/rules-of-hooks`)
- ✅ Accessibility standards (`jsx-a11y/*`)
- ✅ Import organization (`import/order`)
- ✅ Naming conventions (`@typescript-eslint/naming-convention`)

### Test-Specific Overrides ✅
- ✅ Allow 'any' in test mocks only
- ✅ Relaxed typing for test utilities
- ✅ Prevent debug code (`no-only-tests/no-only-tests`)

### API Route Strict Rules ✅
- ✅ Extra strict server storage prevention
- ✅ File operation cleanup requirements
- ✅ Database operation blocking

## 🎯 Try It Yourself

1. **Create a violation:**
   ```typescript
   // In any .ts/.tsx file, try adding:
   const badCode: any = "this will fail ESLint";
   ```

2. **Run linting:**
   ```bash
   npm run lint:eslint
   ```

3. **See the error:**
   ```
   ✖ @typescript-eslint/no-explicit-any
   Unexpected any. Specify a different type.
   ```

4. **Fix the violation:**
   ```typescript
   const goodCode: string = "this will pass ESLint";
   ```

5. **Verify fix:**
   ```bash
   npm run lint:eslint  # Should pass ✅
   ```

## 🔄 Automatic Enforcement Flow

```
Developer writes code
         ↓
Editor shows ESLint errors in real-time
         ↓
Developer attempts to commit
         ↓
Pre-commit hook runs lint checks
         ↓
❌ BLOCKED if violations exist
✅ ALLOWED if clean
         ↓
Push to repository
         ↓
GitHub Actions runs CI checks
         ↓
❌ PR blocked if violations exist
✅ PR allowed if clean
         ↓
Code review and merge
```

## 📈 Benefits Achieved

### ✅ Automatic Code Quality
- No manual code review needed for style issues
- Consistent code across all contributors
- Impossible to merge violating code

### ✅ Developer Experience
- Immediate feedback in editor
- Clear error messages with solutions
- Auto-fixing for simple issues

### ✅ Project Standards
- 100% adherence to documented guidelines
- Zero 'any' types in production code
- No JSX in variables anywhere
- No server data storage violations

### ✅ Maintenance
- Rules are automatically updated
- No need to remember guidelines
- New team members follow standards immediately

## 🎉 Result

The code style guidelines are now **trivially enforced** through tooling instead of requiring manual adherence or documentation reading. Every rule from the project documentation is automatically checked and violations are prevented at multiple levels:

1. **Editor** - Real-time feedback
2. **Pre-commit** - Local enforcement  
3. **CI/CD** - Repository enforcement
4. **Build** - Production safety

This makes code style enforcement **automatic** and **foolproof**!
