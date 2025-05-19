# Singleton Pattern in CineFlux-AutoXML

## Overview

The Singleton pattern is a design pattern that restricts the instantiation of a class to a single instance and provides a global point of access to that instance. In CineFlux-AutoXML, we use the Singleton pattern for our service classes to ensure that only one instance of each service exists throughout the application lifecycle.

## Why Use Singletons for Services?

1. **Resource Management**: Services like `AudioService` and `VideoService` manage expensive resources (WebAssembly modules, audio contexts, etc.) that should not be duplicated.
   
2. **State Consistency**: Services maintain state that should be consistent across the application (e.g., loaded audio/video files, analysis results).
   
3. **Simplified Access**: Singletons provide a global access point without passing instances around or using dependency injection frameworks.
   
4. **Lazy Initialization**: Services are only initialized when first accessed, improving application startup performance.

## Implementation in CineFlux-AutoXML

All service classes in CineFlux-AutoXML follow the same singleton implementation pattern:

```typescript
export class ExampleService {
  // Private static instance variable
  private static instance: ExampleService;
  
  // Private constructor to prevent direct instantiation
  private constructor() {
    // Initialization code
  }
  
  // Public static method to get the instance
  public static getInstance(): ExampleService {
    if (!ExampleService.instance) {
      ExampleService.instance = new ExampleService();
    }
    return ExampleService.instance;
  }
  
  // Instance methods
  public instanceMethod(): void {
    // Implementation
  }
  
  // Static methods that delegate to the instance
  public static staticMethod(): void {
    return ExampleService.getInstance().instanceMethod();
  }
}

// Export the class
export default ExampleService;

// Export the singleton instance
export const exampleService = ExampleService.getInstance();
```

## Services Implemented as Singletons

The following services in CineFlux-AutoXML are implemented as singletons:

1. **AudioService**: Handles audio file loading, analysis, and processing.
2. **VideoService**: Handles video file loading, analysis, and processing.
3. **EditDecisionEngine**: Generates edit decisions based on audio and video analysis.
4. **PreviewGenerator**: Generates preview frames and videos for edit decisions.

## How to Use Singleton Services

There are two ways to use the singleton services in CineFlux-AutoXML:

### 1. Import the Singleton Instance

```typescript
import { audioService } from '../services/AudioService';

// Use the singleton instance directly
audioService.loadAudio(file);
```

### 2. Use the Static Methods

```typescript
import AudioService from '../services/AudioService';

// Use the static methods
AudioService.loadAudio(file);
```

Both approaches will use the same singleton instance internally.

## Best Practices

1. **Prefer Importing the Singleton Instance**: This makes it clear that you're using a singleton and not creating a new instance.
   
2. **Avoid Modifying the Singleton Pattern**: Don't try to create new instances of singleton classes using `new` or other means.
   
3. **Use Singletons for Stateful Services**: Only use the singleton pattern for services that need to maintain state or manage resources.
   
4. **Clean Up Resources**: Call cleanup methods when appropriate to release resources held by singleton services.
   
5. **Testing**: When testing, be aware that singleton state persists between tests. Reset state or mock the singleton as needed.

## Client-Side Processing Architecture

CineFlux-AutoXML uses a client-side processing architecture where all media processing happens directly in the browser using WebAssembly and browser APIs. The singleton services encapsulate this processing logic and provide a clean interface for the rest of the application.

Key aspects of this architecture:

1. **No Server Uploads**: Files are processed entirely in the browser, avoiding the need to upload large media files to a server.
   
2. **WebAssembly Libraries**: We use FFmpeg.wasm, OpenCV.js, and other WebAssembly libraries for media processing.
   
3. **Web Audio API**: Audio analysis uses the Web Audio API for real-time processing.
   
4. **Event-Based Progress Reporting**: Services use callbacks and events to report progress during long-running operations.
   
5. **Client-Side State Management**: All application state is managed client-side using React Context and singleton services.

This architecture provides a responsive user experience while handling complex media processing tasks without requiring server infrastructure.