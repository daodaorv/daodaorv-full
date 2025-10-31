module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 30000,
  maxWorkers: 1, // 串行运行测试，避免并发冲突
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // Mock Redis in test environment
  moduleNameMapper: {
    '^../utils/redis$': '<rootDir>/src/utils/__mocks__/redis.ts',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
      diagnostics: {
        ignoreCodes: [2578], // Ignore "Unused '@ts-expect-error' directive"
      },
    },
  },
};
