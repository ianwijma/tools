# ESLint Code Style Enforcement

This document explains how ESLint is configured to automatically enforce all the code style guidelines from the project documentation.

## 🚨 Critical Rules - NO EXCEPTIONS

### 1. NO 'any' Types Policy

**Rule**: `@typescript-eslint/no-explicit-any: 'error'`

```typescript
// ❌ FORBIDDEN - Will cause ESLint error
const data: any = getData();
function process(input: any): any { }

// ✅ CORRECT - Explicit types required
const data: UserData = getData();
function process(input: UserInput): ProcessResult { }
```

**Additional Rules**:
- `@typescript-eslint/no-unsafe-any: 'error'`
- `@typescript-eslint/no-unsafe-assignment: 'error'`
- `@typescript-eslint/no-unsafe-call: 'error'`
- `@typescript-eslint/no-unsafe-member-access: 'error'`
- `@typescript-eslint/no-unsafe-return: 'error'`

### 2. NO JSX in Variables Policy

**Rule**: `no-restricted-syntax` with custom selectors

```typescript
// ❌ FORBIDDEN - Will cause ESLint error
const jsx = <div>Hello</div>;
const element = condition ? <span>Yes</span> : <span>No</span>;
const items = [<li key="1">Item</li>, <li key="2">Item</li>];

// ✅ CORRECT - Extract to components or inline directly
const HelloComponent = (): JSX.Element => <div>Hello</div>;
return condition ? <span>Yes</span> : <span>No</span>;
return (
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
);
```

### 3. NO Server Data Storage Policy

**Rules**: 
- `no-restricted-imports` with database patterns
- `no-restricted-properties` for global storage
- `no-restricted-syntax` for API routes

```typescript
// ❌ FORBIDDEN - Will cause ESLint error
import { PrismaClient } from '@prisma/client';
import redis from 'redis';
global.userData = data;

// API routes with file operations without cleanup
export async function POST(request: NextRequest) {
  await fs.writeFile('data.json', data); // ❌ No cleanup
  return NextResponse.json(result);
}

// ✅ CORRECT - Frontend storage only
localStorage.setItem('userData', JSON.stringify(data));

// ✅ CORRECT - Temporary files with cleanup
export async function POST(request: NextRequest) {
  let tempFile: string | null = null;
  try {
    tempFile = await createTempFile(data);
    const result = await processFile(tempFile);
    return NextResponse.json(result);
  } finally {
    if (tempFile) {
      await fs.unlink(tempFile).catch(console.error);
    }
  }
}
```

## 📋 Explicit Typing Requirements

### Function Return Types

**Rule**: `@typescript-eslint/explicit-function-return-type: 'error'`

```typescript
// ❌ FORBIDDEN - Will cause ESLint error
function getData() {
  return { name: 'John', age: 30 };
}

const processUser = (user) => {
  return user.name.toUpperCase();
};

// ✅ CORRECT - Explicit return types
function getData(): UserData {
  return { name: 'John', age: 30 };
}

const processUser = (user: User): string => {
  return user.name.toUpperCase();
};
```

### Variable Type Annotations

**Rule**: `@typescript-eslint/typedef` with comprehensive options

```typescript
// ❌ FORBIDDEN - Will cause ESLint error
const users = [];
let count;
const handler = (event) => { };

// ✅ CORRECT - Explicit types
const users: User[] = [];
let count: number;
const handler = (event: Event): void => { };
```

## 🧪 Testing Rules

### Visibility Over Presence

**Rules**: 
- `testing-library/prefer-screen-queries: 'error'`
- `testing-library/await-async-queries: 'error'`

```typescript
// ❌ FORBIDDEN - Will cause ESLint error
expect(getByText('Submit')).toBeInTheDocument();

// ✅ CORRECT - Test visibility
expect(screen.getByText('Submit')).toBeVisible();
```

### No Debug Code

**Rules**:
- `no-only-tests/no-only-tests: 'error'`
- `jest/no-focused-tests: 'error'`
- `testing-library/no-debugging-utils: 'error'`

```typescript
// ❌ FORBIDDEN - Will cause ESLint error
describe.only('Component', () => { });
it.only('should work', () => { });
screen.debug();

// ✅ CORRECT - No debug code
describe('Component', () => { });
it('should work', () => { });
```

## ♿ Accessibility Rules

### Material Design Compliance

**Rules**:
- `jsx-a11y/alt-text: 'error'`
- `jsx-a11y/label-has-associated-control: 'error'`
- `jsx-a11y/heading-has-content: 'error'`

```typescript
// ❌ FORBIDDEN - Will cause ESLint error
<img src="photo.jpg" />
<input type="text" />
<h1></h1>

// ✅ CORRECT - Accessible markup
<img src="photo.jpg" alt="User profile photo" />
<label htmlFor="username">Username</label>
<input id="username" type="text" />
<h1>Page Title</h1>
```

## 🔧 Error Handling Rules

### Proper Async/Await Usage

**Rules**:
- `@typescript-eslint/no-floating-promises: 'error'`
- `@typescript-eslint/await-thenable: 'error'`

```typescript
// ❌ FORBIDDEN - Will cause ESLint error
fetchData(); // Floating promise
await nonPromise; // Awaiting non-thenable

// ✅ CORRECT - Proper async handling
await fetchData();
void fetchData(); // If you want to ignore the promise
const result = await fetchData();
```

## 📦 Import Organization

**Rule**: `import/order` with specific groups

```typescript
// ❌ FORBIDDEN - Will cause ESLint error
import './styles.css';
import { useState } from 'react';
import { Button } from '@mui/material';

// ✅ CORRECT - Organized imports
import { useState } from 'react';

import { Button } from '@mui/material';

import './styles.css';
```

## 🎯 Naming Conventions

**Rule**: `@typescript-eslint/naming-convention`

```typescript
// ❌ FORBIDDEN - Will cause ESLint error
interface user_data { }
type API_Response = { };
class component { }

// ✅ CORRECT - Proper naming
interface UserData { }
type ApiResponse = { };
class Component { }
```

## 🔄 File-Specific Overrides

### Test Files
- Allow `any` types for mocks only
- Relaxed typing requirements for test utilities

### API Routes
- Extra strict server storage rules
- File operation cleanup requirements

### Configuration Files
- Allow `require()` statements
- Relaxed typing for config objects

## 📋 Scripts and Commands

### Linting Commands

```bash
# Run all linting checks
npm run lint

# Run individual linters
npm run lint:biome     # Biome formatting and basic linting
npm run lint:eslint    # ESLint code style enforcement
npm run lint:types     # TypeScript type checking

# Fix automatically fixable issues
npm run lint:fix
npm run lint:biome:fix
npm run lint:eslint:fix
```

### Pre-commit Hooks

Automatically enforced on every commit:
1. Biome formatting and linting
2. ESLint code style enforcement
3. TypeScript type checking
4. Related tests for changed files

### CI/CD Pipeline

GitHub Actions workflow enforces:
1. All linting rules must pass
2. No warnings allowed (`--max-warnings 0`)
3. Type checking must pass
4. Tests must pass
5. Build must succeed

## 🚫 Common Violations and Fixes

### 1. 'any' Type Usage

```typescript
// ❌ Error: Do not use 'any' types
const data: any = response.data;

// ✅ Fix: Use proper types
interface ApiResponse {
  data: UserData;
}
const data: UserData = (response as ApiResponse).data;
```

### 2. JSX in Variables

```typescript
// ❌ Error: JSX assigned to variable
const element = <div>Hello</div>;

// ✅ Fix: Extract to component
const HelloComponent = (): JSX.Element => <div>Hello</div>;
```

### 3. Missing Return Types

```typescript
// ❌ Error: Missing return type
function processData(input) {
  return input.map(item => item.value);
}

// ✅ Fix: Add explicit types
function processData(input: DataItem[]): string[] {
  return input.map((item: DataItem) => item.value);
}
```

### 4. Database Operations

```typescript
// ❌ Error: Database operation detected
await prisma.user.create({ data: userData });

// ✅ Fix: Use frontend storage
localStorage.setItem('userData', JSON.stringify(userData));
```

## 🔍 Checking Your Code

Before committing, run:

```bash
# Check everything
npm run ci-check

# Just linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

The pre-commit hook will automatically run these checks and prevent commits with violations.

## 📚 Additional Resources

- [TypeScript ESLint Rules](https://typescript-eslint.io/rules/)
- [React ESLint Plugin](https://github.com/jsx-eslint/eslint-plugin-react)
- [JSX A11y Plugin](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
- [Testing Library ESLint Plugin](https://github.com/testing-library/eslint-plugin-testing-library)
- [Material Design Guidelines](https://m3.material.io/)

## 🎯 Remember

- **ESLint errors MUST be fixed before committing**
- **Type errors MUST be resolved**
- **No warnings are allowed in CI**
- **All rules are enforced automatically**
- **No exceptions to critical rules**

The goal is to make code style enforcement automatic and trivial, removing the need to remember or manually check these rules.
