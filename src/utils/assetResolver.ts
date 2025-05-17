/**
 * assetResolver.ts
 * 
 * A utility for resolving asset paths consistently across different environments.
 * This helps prevent issues with relative vs absolute paths and ensures assets
 * are loaded correctly in development and production.
 */

// Get the base URL from environment or default to '/'
const getBaseUrl = (): string => {
  // Use window.location.pathname for base URL detection if in browser
  if (typeof window !== 'undefined') {
    // Extract the base path from the current URL
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length > 2) {
      // If we're in a subdirectory, use that as the base
      return `/${pathParts[1]}/`;
    }
  }
  return '/';
};

/**
 * Resolves an asset path to its correct URL based on the current environment
 * 
 * @param path - The relative path to the asset
 * @returns The fully resolved URL for the asset
 */
export const resolveAssetPath = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Combine base URL with the clean path
  return `${getBaseUrl()}${cleanPath}`;
};

/**
 * Resolves a public asset path (assets in the public directory)
 * 
 * @param path - The relative path within the public directory
 * @returns The fully resolved URL for the public asset
 */
export const resolvePublicAsset = (path: string): string => {
  return resolveAssetPath(path);
};

/**
 * Resolves a source asset path (assets imported in source code)
 * 
 * @param asset - The imported asset (result of import statement)
 * @returns The fully resolved URL for the source asset
 */
export const resolveSourceAsset = (asset: string): string => {
  return asset; // Vite handles these imports automatically
};

export default {
  resolveAssetPath,
  resolvePublicAsset,
  resolveSourceAsset
};
