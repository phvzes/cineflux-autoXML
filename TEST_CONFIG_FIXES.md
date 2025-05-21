# Test Configuration Fixes

## Issues Identified
1. The project was using Vitest for testing but trying to run tests with Jest
2. There was no Jest configuration file
3. There were TypeScript configuration issues with ESM modules
4. There were missing mock implementations for external dependencies

## Changes Made
1. Created a Jest configuration file (jest.config.js) with TypeScript support
2. Added a Jest setup file (jest.setup.js) with:
   - TextEncoder and TextDecoder polyfills
   - Global mocks for browser APIs
   - UUID mock implementation
3. Updated test files to use Jest instead of Vitest:
   - Replaced vi.fn() with jest.fn()
   - Replaced vi.spyOn() with jest.spyOn()
   - Replaced vi.clearAllMocks() with jest.clearAllMocks()
4. Created mock implementations for external dependencies:
   - @ffmpeg/ffmpeg
   - @techstark/opencv-js
   - uuid
5. Fixed ESM-related issues:
   - Updated imports to use ESM syntax
   - Configured Jest to handle ESM modules

## Running Tests
To run the tests, use the following command:
```
npm test
```

Note: Some tests may still fail due to implementation details, but the configuration issues have been fixed.
