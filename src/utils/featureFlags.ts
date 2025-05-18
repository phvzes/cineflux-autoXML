/**
 * featureFlags.ts
 * 
 * Utility for managing feature flags in the application.
 * Provides type-safe access to feature flags configured via environment variables.
 */

// Define known feature flags with their default values
export interface FeatureFlags {
  debugMode: boolean;
  experimentalFeatures: boolean;
  advancedAnalysis: boolean;
  // Add more feature flags as needed
}

// Default values for feature flags (used as fallback)
const defaultFeatureFlags: FeatureFlags = {
  debugMode: false,
  experimentalFeatures: false,
  advancedAnalysis: true,
};

/**
 * Check if a feature flag is enabled
 * 
 * @param flagName - Name of the feature flag to check
 * @returns Boolean indicating if the feature is enabled
 */
export const isFeatureEnabled = (flagName: keyof FeatureFlags): boolean => {
  // Access feature flags from window object (set in main.tsx)
  const featureFlags = window.__FEATURE_FLAGS__ || {};
  
  // Return the flag value or default if not found
  return flagName in featureFlags 
    ? Boolean(featureFlags[flagName]) 
    : defaultFeatureFlags[flagName];
};

/**
 * Get all enabled feature flags
 * 
 * @returns Array of enabled feature flag names
 */
export const getEnabledFeatures = (): (keyof FeatureFlags)[] => {
  const featureFlags = window.__FEATURE_FLAGS__ || {};
  
  return Object.keys(defaultFeatureFlags).filter(flag => {
    const typedFlag = flag as keyof FeatureFlags;
    return isFeatureEnabled(typedFlag);
  }) as (keyof FeatureFlags)[];
};

/**
 * React hook to check if a feature is enabled
 * 
 * @param flagName - Name of the feature flag to check
 * @returns Boolean indicating if the feature is enabled
 */
export const useFeature = (flagName: keyof FeatureFlags): boolean => {
  return isFeatureEnabled(flagName);
};

export default {
  isFeatureEnabled,
  getEnabledFeatures,
  useFeature,
};
