module.exports = {
  // TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': [
    // First run Biome for formatting and basic linting
    'biome check --write',
    // Then run ESLint for strict code style enforcement
    'eslint --fix',
    // Finally check TypeScript types
    () => 'tsc --noEmit',
  ],

  // JSON files
  '*.json': ['biome format --write'],

  // CSS files
  '*.css': ['biome format --write'],

  // Test files - run tests for changed files
  '**/*.test.{ts,tsx,js,jsx}': [
    'jest --bail --findRelatedTests --passWithNoTests',
  ],
};
