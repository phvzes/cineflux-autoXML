# MIME Type Fix Documentation

## Overview

This document explains the MIME type fixes implemented in the CineFlux-AutoXML project through the custom Vite plugin (`vite-mime-plugin.js`). The plugin addresses common MIME type issues that can occur during development with Vite, particularly when serving JavaScript modules.

## Problem Statement

When serving JavaScript modules in development mode, Vite may sometimes use incorrect MIME types:

1. Using `text/javascript` instead of `application/javascript` for JavaScript modules
2. Using `application/octet-stream` for some JavaScript files
3. Missing charset specification in the Content-Type header

These issues can cause problems in certain browsers that strictly enforce MIME type checking for ES modules, resulting in errors like:

```
Failed to load module script: The server responded with a non-JavaScript MIME type of "text/javascript". 
Strict MIME type checking is enforced for module scripts per HTML spec.
```

## Solution

The `vite-mime-plugin.js` implements a custom Vite plugin that:

1. Intercepts HTTP responses for JavaScript files
2. Ensures the correct MIME type (`application/javascript; charset=utf-8`) is set
3. Fixes both direct URL requests and internal header setting operations

## Implementation Details

The plugin works in two ways:

### 1. Direct URL Interception

For direct requests to JavaScript files, the plugin checks the URL extension and sets the appropriate Content-Type header:

```javascript
if (req.url) {
  const url = req.url.split('?')[0]; // Remove query parameters
  if (url.endsWith('.js') || url.endsWith('.mjs') || 
      url.endsWith('.ts') || url.endsWith('.tsx') || 
      url.endsWith('.jsx')) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  }
}
```

This ensures that files with the following extensions are served with the correct MIME type:
- `.js` - JavaScript files
- `.mjs` - JavaScript modules
- `.ts` - TypeScript files
- `.tsx` - TypeScript React files
- `.jsx` - JavaScript React files

### 2. Header Interception

The plugin also intercepts calls to `setHeader` to ensure that even if another middleware tries to set an incorrect MIME type, it will be corrected:

```javascript
const originalSetHeader = res.setHeader;
res.setHeader = function(name, value) {
  if (name === 'Content-Type' && 
     (value === 'text/javascript' || value === 'application/octet-stream')) {
    return originalSetHeader.call(this, name, 'application/javascript; charset=utf-8');
  }
  return originalSetHeader.call(this, name, value);
};
```

This specifically targets:
- `text/javascript` - An older MIME type that some servers still use
- `application/octet-stream` - A generic binary MIME type that's sometimes used as a fallback

## Usage

The plugin is automatically applied to the Vite development server through the Vite configuration file. No additional setup is required for developers.

## Browser Compatibility

This fix is particularly important for:

- Chrome 60+
- Firefox 60+
- Safari 10.1+
- Edge 79+

These browsers enforce strict MIME type checking for ES modules as specified in the HTML spec.

## References

- [HTML Specification - MIME Type Checking](https://html.spec.whatwg.org/multipage/webappapis.html#module-script-credentials-mode)
- [Vite Plugin API Documentation](https://vitejs.dev/guide/api-plugin.html)
- [MDN Web Docs - JavaScript MIME Types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#javascript_types)
