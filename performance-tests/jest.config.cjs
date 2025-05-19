
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/performance-tests/**/*.test.js'],
  setupFilesAfterEnv: ['./setup.js'],
  verbose: true,
  reporters: [
    'default',
    ['./node_modules/jest-html-reporter', {
      pageTitle: 'CineFlux Performance Test Report',
      outputPath: './performance-tests/reports/test-report.html',
      includeConsoleLog: true,
      includeFailureMsg: true
    }],
    ['./node_modules/jest-junit', {
      outputDirectory: './performance-tests/reports',
      outputName: 'junit.xml'
    }]
  ],
  testTimeout: 30000, // Increased timeout for performance tests
  collectCoverage: false,
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-env'] }]
  }
};
