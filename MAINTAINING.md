# Maintaining CineFlux-AutoXML

This document provides guidelines for maintaining and extending the CineFlux-AutoXML project. It is intended for developers who are responsible for the ongoing maintenance, performance optimization, and feature development of the application.

## Table of Contents

- [Performance Testing](#performance-testing)
  - [Running Performance Tests](#running-performance-tests)
  - [Interpreting Test Results](#interpreting-test-results)
  - [Adding New Performance Tests](#adding-new-performance-tests)
- [WebAssembly Optimization](#webassembly-optimization)
  - [Updating WebAssembly Modules](#updating-webassembly-modules)
  - [Optimizing WebAssembly Loading](#optimizing-webassembly-loading)
- [Code Quality](#code-quality)
  - [TypeScript Best Practices](#typescript-best-practices)
  - [React Component Guidelines](#react-component-guidelines)
- [Release Process](#release-process)
  - [Version Bumping](#version-bumping)
  - [Release Checklist](#release-checklist)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Debugging Strategies](#debugging-strategies)

## Performance Testing

Performance is a critical aspect of CineFlux-AutoXML. The application processes media files directly in the browser, so efficient code and optimized algorithms are essential for a good user experience.

### Running Performance Tests

The project includes a comprehensive performance testing suite that can be run with the following commands:

```bash
# Run all performance tests
npm run test:perf

# Run specific performance test categories
npm run test:perf:wasm      # WebAssembly loading and execution
npm run test:perf:audio     # Audio processing
npm run test:perf:video     # Video processing
npm run test:perf:ui        # UI rendering and responsiveness
```

Performance tests are located in the `tests/performance` directory and are organized by category.

### Interpreting Test Results

Performance test results are output in both console format and as JSON files in the `performance-reports` directory. The reports include:

- **Execution Time**: How long each operation takes to complete
- **Memory Usage**: Peak memory consumption during operations
- **CPU Utilization**: CPU usage during processing
- **Comparison to Baseline**: How current performance compares to established baselines

Key metrics to monitor:

1. **Time to First Meaningful Render**: Should be under 2 seconds on mid-range hardware
2. **WebAssembly Load Time**: Should be under 500ms for cached modules, under 3 seconds for uncached
3. **Audio Analysis Speed**: Should process audio at least 5x faster than real-time
4. **Video Frame Processing**: Should process at least 30 frames per second on mid-range hardware
5. **Memory Leaks**: Memory usage should stabilize after operations, not continuously increase

### Adding New Performance Tests

When adding new features or optimizing existing ones, create corresponding performance tests:

1. Create a new test file in the appropriate category directory
2. Use the `PerformanceTestRunner` class to structure your test
3. Define clear baselines and thresholds for pass/fail criteria
4. Include both best-case and worst-case scenarios
5. Document any special hardware or environment requirements

Example of a new performance test:

```typescript
// tests/performance/video/sceneDetection.perf.ts
import { PerformanceTestRunner } from '../utils/testRunner';
import { SceneDetector } from '../../src/utils/video/sceneDetector';

const testRunner = new PerformanceTestRunner('Scene Detection');

testRunner.addTest({
  name: 'Detect scenes in 1080p video',
  async run() {
    const detector = new SceneDetector();
    const videoPath = './test-assets/sample-1080p.mp4';
    
    // Measure performance
    const startTime = performance.now();
    const scenes = await detector.detectScenes(videoPath);
    const endTime = performance.now();
    
    return {
      executionTime: endTime - startTime,
      memoryUsage: process.memoryUsage().heapUsed,
      result: scenes.length,
      baseline: {
        executionTime: 5000, // 5 seconds
        tolerance: 0.2 // 20% tolerance
      }
    };
  }
});

testRunner.run();
```

## WebAssembly Optimization

WebAssembly modules are critical for the performance of CineFlux-AutoXML. The application uses three main WebAssembly modules:

- **FFmpeg.wasm**: For video processing
- **OpenCV.js**: For computer vision and scene detection
- **Essentia.js**: For audio analysis

### Updating WebAssembly Modules

When updating WebAssembly modules:

1. Place new `.wasm` files in the `public/wasm` directory
2. Update the version numbers in `src/utils/wasm/versions.ts`
3. Run the WebAssembly optimization script:
   ```bash
   npm run optimize:wasm
   ```
4. Update the fallback implementations if necessary
5. Run performance tests to ensure the new modules perform as expected:
   ```bash
   npm run test:perf:wasm
   ```

### Optimizing WebAssembly Loading

The WebAssembly loading system in CineFlux-AutoXML includes several optimizations:

1. **Caching**: WebAssembly modules are cached in IndexedDB
2. **Prefetching**: Modules are prefetched during idle time
3. **Streaming Compilation**: Modules are compiled as they download
4. **Memory Management**: Unused modules are unloaded to free memory

When modifying the WebAssembly loading system:

1. Ensure the caching mechanism works correctly across browsers
2. Test with various network conditions (fast, slow, intermittent)
3. Verify that memory is properly released after module use
4. Check that fallback mechanisms work when WebAssembly is not available

## Code Quality

Maintaining high code quality is essential for the long-term sustainability of the project.

### TypeScript Best Practices

- Use strict type checking with `"strict": true` in `tsconfig.json`
- Define interfaces for all data structures
- Use discriminated unions for complex state management
- Avoid `any` types except when absolutely necessary
- Use generics for reusable components and utilities
- Document public APIs with JSDoc comments

### React Component Guidelines

- Use functional components with hooks
- Implement proper memoization with `useMemo` and `useCallback`
- Split large components into smaller, focused components
- Use lazy loading for components not needed on initial render
- Implement proper error boundaries
- Follow the container/presentational component pattern
- Use custom hooks to extract and reuse logic

## Release Process

CineFlux-AutoXML follows a structured release process to ensure quality and stability.

### Version Bumping

The project follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Incompatible API changes
- **MINOR**: New features in a backward-compatible manner
- **PATCH**: Backward-compatible bug fixes

When bumping the version:

1. Update the version in `package.json`
2. Update the version in `VERSION.md`
3. Update the version badge in `README.md`
4. Update the `CHANGELOG.md` with details of the changes

### Release Checklist

Before creating a new release:

1. Run the full test suite:
   ```bash
   npm run test
   ```

2. Run performance tests and ensure they meet baselines:
   ```bash
   npm run test:perf
   ```

3. Build the production version and test it:
   ```bash
   npm run build
   npm run preview
   ```

4. Test the application in all supported browsers
5. Verify that all documentation is up-to-date
6. Create a release branch:
   ```bash
   git checkout -b release/vX.Y.Z
   ```

7. Commit the version bump:
   ```bash
   git commit -am "docs: prepare for vX.Y.Z release"
   ```

8. Push the release branch:
   ```bash
   git push -u origin release/vX.Y.Z
   ```

9. Create a pull request for the release
10. After approval, merge the pull request
11. Tag the release:
    ```bash
    git tag vX.Y.Z
    git push --tags
    ```

12. Create a GitHub release with release notes

## Troubleshooting

### Common Issues

#### WebAssembly Loading Failures

- **Symptoms**: Console errors about WebAssembly compilation, modules fail to load
- **Causes**: CORS issues, network problems, browser compatibility
- **Solutions**:
  - Ensure proper CORS headers are set for `.wasm` files
  - Verify that the WebAssembly modules are correctly built
  - Check browser compatibility and implement fallbacks

#### Memory Leaks

- **Symptoms**: Application becomes slower over time, browser tab crashes
- **Causes**: Unreleased resources, circular references, accumulating state
- **Solutions**:
  - Use Chrome DevTools Memory profiler to identify leaks
  - Implement proper cleanup in `useEffect` hooks
  - Ensure WebAssembly memory is properly released

#### Performance Degradation

- **Symptoms**: Operations take longer than expected, UI becomes unresponsive
- **Causes**: Inefficient algorithms, unnecessary re-renders, blocking operations
- **Solutions**:
  - Use React DevTools Profiler to identify unnecessary renders
  - Move heavy computations to Web Workers
  - Implement proper memoization and virtualization

### Debugging Strategies

#### WebAssembly Debugging

1. Enable WebAssembly debugging in Chrome DevTools:
   - Go to chrome://flags/#enable-webassembly-debugging
   - Set to "Enabled"
   - Restart Chrome

2. Use the `console.log` bridge in WebAssembly modules
3. Check for CORS issues in the Network tab
4. Verify that the correct WebAssembly module versions are being loaded

#### Performance Debugging

1. Use the Performance tab in Chrome DevTools to record and analyze performance
2. Enable the FPS meter to identify frame drops
3. Use the Memory tab to track memory usage over time
4. Add performance marks and measures:
   ```typescript
   performance.mark('operation-start');
   // ... operation ...
   performance.mark('operation-end');
   performance.measure('operation', 'operation-start', 'operation-end');
   ```

5. Use the built-in performance monitoring:
   ```typescript
   import { PerfMonitor } from '../utils/performance/perfMonitor';
   
   const perfMonitor = PerfMonitor.getInstance();
   const measureId = perfMonitor.startMeasure('operation-name');
   // ... operation ...
   perfMonitor.endMeasure(measureId);
   ```

By following these guidelines, you can maintain and extend CineFlux-AutoXML while ensuring it remains performant, stable, and maintainable.
