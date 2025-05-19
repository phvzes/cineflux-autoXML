
# CineFlux-AutoXML Performance Testing Suite

This directory contains performance tests for the CineFlux-AutoXML application. The tests measure the performance of key operations in the application, including WebAssembly module loading, audio analysis, video processing, and edit decision generation.

## Directory Structure

```
performance-tests/
├── jest.config.cjs       # Jest configuration for performance tests
├── lighthouse.config.js  # Lighthouse configuration for web performance
├── perf-helpers.js       # Helper utilities for performance measurement
├── report.js             # Report generation utilities
├── setup.js              # Test setup and mocks
├── README.md             # This file
├── reports/              # Performance test reports
└── test-assets/          # Test media files
    ├── sample.wav        # Sample audio file
    ├── sample.mp3        # Sample audio file
    ├── sample.mp4        # Sample video file
    └── ...
```

## Test Files

- `wasmLoad.test.js`: Tests WebAssembly module loading performance
- `audioAnalysis.test.js`: Tests audio analysis performance
- `videoProcess.test.js`: Tests video processing performance
- `editDecision.test.js`: Tests edit decision generation performance

## Running the Tests

To run all performance tests:

```bash
npm run test:perf
```

To run a specific test:

```bash
npx jest performance-tests/wasmLoad.test.js
```

## Generating Reports

After running the tests, reports are automatically generated in the `reports` directory. You can also generate combined reports using the `report.js` script:

```bash
node performance-tests/report.js
```

This will generate:
- A CLI report displayed in the console
- A JSON report at `reports/combined-report.json`
- An HTML report at `reports/performance-report.html`

## Adding New Tests

To add a new performance test:

1. Create a new test file in the `performance-tests` directory
2. Import the necessary utilities from `perf-helpers.js`
3. Use the `PerformanceTimer` class to measure execution time
4. Call `createReport()` to generate a report

Example:

```javascript
const { PerformanceTimer, createReport } = require('./perf-helpers');

describe('My Performance Test', () => {
  const timer = new PerformanceTimer('My Operation');
  
  test('Operation performance', async () => {
    const myOperation = () => {
      // Operation to measure
    };
    
    const result = await timer.measure(myOperation, 5); // Run 5 iterations
    console.log(`Average time: ${result.average.toFixed(2)}ms`);
    
    // Assert that processing time is within acceptable range
    expect(result.average).toBeLessThan(1000);
  });
});
```

## Customizing Thresholds

Performance thresholds are defined in each test file. To adjust the thresholds, modify the `expect()` assertions in the test files.
