import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import jsxA11y from "eslint-plugin-jsx-a11y";
import noOnlyTests from "eslint-plugin-no-only-tests";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "logs/**",
      "**/*.log",
      "next-env.d.ts",
      "**/*.tmp",
      "**/*.temp",
      "eslint-plugins/**",
    ],
  },

  // Base configuration
  js.configs.recommended,

  // JavaScript and JSX files (without TypeScript)
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        React: "readonly",
        JSX: "readonly",
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      "no-only-tests": noOnlyTests,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // Basic React rules for JS files
      "react/prop-types": "off", // Using TypeScript instead
      "react/react-in-jsx-scope": "off", // Not needed in Next.js
      "react/display-name": "error",
      "react/jsx-key": "error",
      "react/no-array-index-key": "error",
      "react/no-unescaped-entities": "error",

      // Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",

      // Accessibility rules
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/no-autofocus": "error",
      "jsx-a11y/no-redundant-roles": "error",

      // General rules
      "no-console": "warn",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
    },
  },

  // TypeScript and React files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2021,
        sourceType: "module",
        project: ["./tsconfig.json"],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        React: "readonly",
        JSX: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      "no-only-tests": noOnlyTests,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // ========================================
      // CRITICAL TYPESCRIPT RULES - NO EXCEPTIONS
      // ========================================

      // 🚨 NO 'any' types allowed - NEVER ALLOWED
      "@typescript-eslint/no-explicit-any": "error",

      // All functions must have explicit return types
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",

      // Strict type checking
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",

      // ========================================
      // REACT/JSX RULES
      // ========================================

      // 🚨 NEVER assign JSX to variables - NEVER ALLOWED
      "no-unused-vars": "off", // Use TypeScript version instead
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^(jsx|JSX|React)", // This will catch JSX assignments
        },
      ],

      // Custom rule to prevent JSX assignment to variables
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'VariableDeclarator[init.type="JSXElement"], VariableDeclarator[init.type="JSXFragment"]',
          message:
            "🚨 NEVER assign JSX to variables - extract to components or inline directly",
        },
        {
          selector:
            'AssignmentExpression[right.type="JSXElement"], AssignmentExpression[right.type="JSXFragment"]',
          message:
            "🚨 NEVER assign JSX to variables - extract to components or inline directly",
        },
        {
          selector:
            'VariableDeclarator[init.type="ConditionalExpression"][init.consequent.type="JSXElement"]',
          message:
            "🚨 NEVER assign JSX to variables - extract to components or inline directly",
        },
        {
          selector:
            'VariableDeclarator[init.type="ConditionalExpression"][init.alternate.type="JSXElement"]',
          message:
            "🚨 NEVER assign JSX to variables - extract to components or inline directly",
        },
        {
          selector:
            'VariableDeclarator[init.type="LogicalExpression"][init.right.type="JSXElement"]',
          message:
            "🚨 NEVER assign JSX to variables - extract to components or inline directly",
        },
      ],

      // React component rules
      "react/prop-types": "off", // Using TypeScript instead
      "react/react-in-jsx-scope": "off", // Not needed in Next.js
      "react/display-name": "error",
      "react/jsx-key": "error",
      "react/no-array-index-key": "error",
      "react/no-unescaped-entities": "error",

      // Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",

      // ========================================
      // SERVER DATA STORAGE PREVENTION
      // ========================================

      // Prevent database and storage operations
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["*prisma*", "*mongoose*", "*sequelize*", "*typeorm*"],
              message:
                "🚨 CRITICAL: NO DATABASE CONNECTIONS ALLOWED - Use frontend storage only",
            },
            {
              group: [
                "*redis*",
                "*memcached*",
                "*node-cache*",
                "*memory-cache*",
              ],
              message:
                "🚨 CRITICAL: NO CACHE STORAGE ON SERVER - Use frontend storage only",
            },
          ],
        },
      ],

      // Prevent global storage patterns
      "no-restricted-globals": [
        "error",
        {
          name: "global",
          message:
            "🚨 CRITICAL: NO GLOBAL STORAGE ON SERVER - Use frontend storage only",
        },
      ],

      // ========================================
      // ERROR HANDLING RULES
      // ========================================

      // Require proper error handling
      "no-throw-literal": "error",
      "prefer-promise-reject-errors": "error",

      // Async/await best practices
      "no-async-promise-executor": "error",
      "no-await-in-loop": "error",

      // ========================================
      // TESTING RULES
      // ========================================

      // Prevent debug code in tests
      "no-only-tests/no-only-tests": "error",

      // ========================================
      // ACCESSIBILITY RULES
      // ========================================

      // Material Design accessibility requirements
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/no-autofocus": "error",
      "jsx-a11y/no-redundant-roles": "error",

      // ========================================
      // GENERAL CODE QUALITY
      // ========================================

      // Prevent common mistakes
      "no-console": "warn",
      "no-debugger": "error",
      "no-alert": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",

      // Enforce consistent coding style
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-arrow-callback": "error",
      "prefer-template": "error",
      "prefer-spread": "error",

      // Naming conventions
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "interface",
          format: ["PascalCase"],
        },
        {
          selector: "typeAlias",
          format: ["PascalCase"],
        },
        {
          selector: "enum",
          format: ["PascalCase"],
        },
        {
          selector: "class",
          format: ["PascalCase"],
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"], // PascalCase for React components
        },
        {
          selector: "variable",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
        },
      ],
    },
  },

  // ========================================
  // FILE-SPECIFIC OVERRIDES
  // ========================================

  // Test files
  {
    files: ["**/__tests__/**/*", "**/*.test.*", "**/*.spec.*"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      // Allow any types in test mocks only
      "@typescript-eslint/no-explicit-any": "off",
      // Allow more flexible typing in tests
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },

  // API routes - strict server rules
  {
    files: ["**/api/**/*"],
    rules: {
      // Extra strict rules for API routes - NO EXCEPTIONS
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'CallExpression[callee.property.name="writeFile"], CallExpression[callee.property.name="writeFileSync"]',
          message:
            "⚠️ WARNING: File operations in API routes must include cleanup in try/finally blocks",
        },
        {
          selector:
            'CallExpression[callee.object.name="fs"][callee.property.name="writeFile"]',
          message:
            "⚠️ WARNING: File operations in API routes must include cleanup in try/finally blocks",
        },
        {
          selector:
            'CallExpression[callee.object.name="fs"][callee.property.name="writeFileSync"]',
          message:
            "⚠️ WARNING: File operations in API routes must include cleanup in try/finally blocks",
        },
        // Detect database operations
        {
          selector:
            'MemberExpression[property.name="save"], MemberExpression[property.name="create"], MemberExpression[property.name="update"], MemberExpression[property.name="delete"]',
          message:
            "🚨 CRITICAL: NO DATABASE OPERATIONS IN API ROUTES - NEVER ALLOWED",
        },
        // Detect cache operations
        {
          selector:
            'MemberExpression[property.name="set"], MemberExpression[property.name="get"][object.name=/redis|cache|memcached/]',
          message:
            "🚨 CRITICAL: NO CACHE OPERATIONS IN API ROUTES - NEVER ALLOWED",
        },
      ],
    },
  },

  // Configuration files
  {
    files: [
      "*.config.js",
      "*.setup.js",
      "eslint.config.js",
      ".lintstagedrc.js",
    ],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off",
      "import/no-unresolved": "off",
    },
  },

  // Utility files (healthcheck, etc.)
  {
    files: ["healthcheck.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off", // Allow console in utility scripts
    },
  },
];
