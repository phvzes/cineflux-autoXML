/**
 * Safely stringify objects with circular references
 * 
 * This utility function handles circular references in objects when using JSON.stringify
 * by keeping track of objects that have already been serialized and replacing circular
 * references with a placeholder.
 * 
 * @param obj - The object to stringify
 * @param space - Optional number of spaces for indentation
 * @returns A JSON string representation of the object with circular references handled
 */
export function safeStringify(obj: any, space?: number): string {
  const seen = new WeakSet();
  
  return JSON.stringify(obj, (key, value) => {
    // Handle non-object values normally
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    
    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // Handle circular references
    if (seen.has(value)) {
      return '[Circular Reference]';
    }
    
    // Add this object to the set of seen objects
    seen.add(value);
    return value;
  }, space);
}

/**
 * Parse a JSON string that was created with safeStringify
 * 
 * @param text - The JSON string to parse
 * @returns The parsed object
 */
export function safeParse(text: string): any {
  return JSON.parse(text);
}

export default safeStringify;
