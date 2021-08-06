module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  verbose: true,
  collectCoverage: true,
  reporters: ['default', 'jest-junit'],
  "coveragePathIgnorePatterns": [
    "node_modules"
  ]
}