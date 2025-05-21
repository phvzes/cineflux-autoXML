export default {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  moduleNameMapper: {
    "uuid": "<rootDir>/__mocks__/uuid.mjs",
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@ffmpeg/ffmpeg$': '<rootDir>/src/__mocks__/@ffmpeg/ffmpeg.js',
    '^@techstark/opencv-js$': '<rootDir>/src/__mocks__/@techstark/opencv-js.js'
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(@ffmpeg|@techstark|essentia.js|meyda|web-audio-beat-detector)/)'
  ],
};
