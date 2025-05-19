# CI Performance Testing Implementation

This document describes the implementation of performance testing in the CI/CD pipeline for the CineFlux-AutoXML project.

## Overview

The performance testing workflow is designed to:

1. Run performance tests on pull requests to the `main` and `integrate/production-ready` branches
2. Compare the results with the baseline performance from the target branch
3. Detect performance regressions (defined as a >10% decrease in performance)
4. Generate and publish performance reports as artifacts
5. Comment the results on the pull request

## Workflow File

The workflow is defined in `.github/workflows/performance-tests.yml` and consists of the following steps:

### Trigger

The workflow runs on pull requests targeting the `main` and `integrate/production-ready` branches:

```yaml
on:
  pull_request:
    branches:
      - main
      - integrate/production-ready
```

### Environment Setup

1. Checkout the repository code with full history (for comparing with the base branch)
2. Set up Node.js environment
3. Install dependencies using `npm ci`

### Running Performance Tests

The workflow runs the performance tests using the existing test script:

```yaml
- name: Run performance tests
  id: run-tests
  run: npm run test:perf
```

This executes the Jest tests defined in the `performance-tests` directory, which measure various performance metrics:
- WebAssembly module loading time
- Audio analysis performance
- Video processing performance
- Edit decision generation performance

### Generating Reports

After running the tests, the workflow generates comprehensive reports:

```yaml
- name: Generate performance report
  run: node performance-tests/report.js
```

This creates:
- A JSON report at `performance-tests/reports/combined-report.json`
- An HTML report at `performance-tests/reports/performance-report.html`
- Individual JSON reports for each test category

### Detecting Performance Regressions

The workflow checks for performance regressions by:

1. Loading the current performance results
2. Fetching and running the tests on the base branch to get baseline results
3. Comparing each metric between the current and baseline results
4. Identifying regressions where performance decreased by more than 10%

The comparison logic is implemented using GitHub Actions JavaScript:

```javascript
// Calculate percentage change
const percentChange = ((currentResult.average - baselineResult.average) / baselineResult.average) * 100;

// Check if it's a regression (>10% slower)
if (percentChange > 10) {
  regressions.push(changeInfo);
}
```

If any regressions are detected, the workflow fails with an error message.

### Publishing Results

The workflow publishes the results in two ways:

1. **Artifacts**: All performance reports are uploaded as artifacts that can be downloaded from the GitHub Actions run:

```yaml
- name: Upload performance report as artifact
  uses: actions/upload-artifact@v3
  with:
    name: performance-reports
    path: performance-tests/reports/
    retention-days: 14
```

2. **PR Comment**: A summary of the results is posted as a comment on the pull request:

```yaml
- name: Comment on PR
  if: always()
  uses: actions/github-script@v6
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: summary
      });
```

The comment includes:
- Performance regressions (if any)
- Performance improvements
- Unchanged metrics

## Performance Metrics

The workflow tracks the following key performance metrics:

1. **WebAssembly Loading**:
   - FFmpeg.wasm Loading
   - OpenCV.js Loading
   - Web Audio API Initialization

2. **Audio Analysis**:
   - Beat Detection
   - Waveform Generation
   - Frequency Analysis

3. **Video Processing**:
   - Frame Extraction
   - Scene Detection
   - Thumbnail Generation

4. **Edit Decision Generation**:
   - EDL Generation
   - XML Export
   - Edit Optimization

## Regression Thresholds

The workflow uses the following thresholds:
- **Regression**: >10% increase in execution time
- **Improvement**: >5% decrease in execution time
- **Unchanged**: Within ±5% of baseline

## Future Improvements

Potential future improvements to the performance testing workflow:

1. Implement trend analysis to track performance over time
2. Add performance budgets for critical operations
3. Integrate with monitoring systems for long-term performance tracking
4. Add visual performance comparisons using charts
5. Implement automatic performance optimization suggestions
