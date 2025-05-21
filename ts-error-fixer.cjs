#!/usr/bin/env node

/**
 * ts-error-fixer.js
 * 
 * A Node.js script to automatically fix common TypeScript errors.
 * 
 * Usage:
 *   node ts-error-fixer.js [options] <file-or-directory-paths...>
 * 
 * Options:
 *   --help, -h                 Show this help message
 *   --fix-unused               Fix unused variables (prefix with underscore or remove)
 *   --fix-missing-types        Fix missing type annotations (add 'any' as temporary fix)
 *   --fix-property-access      Fix property access errors (add optional chaining)
 *   --fix-imports              Fix import issues
 *   --fix-interfaces           Fix missing interface properties
 *   --all                      Apply all fixes (default)
 *   --dry-run                  Show what would be fixed without making changes
 *   --verbose                  Show detailed information about fixes
 * 
 * Examples:
 *   node ts-error-fixer.js src/components
 *   node ts-error-fixer.js --fix-unused --fix-missing-types src/api.ts
 *   node ts-error-fixer.js --all --verbose src
 */

const fs = require('fs');
const path = require('path');
const { Project, SyntaxKind, ts } = require('ts-morph');

// Parse command line arguments
const args = process.argv.slice(2);
let options = {
  paths: [],
  fixUnused: false,
  fixMissingTypes: false,
  fixPropertyAccess: false,
  fixImports: false,
  fixInterfaces: false,
  dryRun: false,
  verbose: false
};

// Process command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  } else if (arg === '--fix-unused') {
    options.fixUnused = true;
  } else if (arg === '--fix-missing-types') {
    options.fixMissingTypes = true;
  } else if (arg === '--fix-property-access') {
    options.fixPropertyAccess = true;
  } else if (arg === '--fix-imports') {
    options.fixImports = true;
  } else if (arg === '--fix-interfaces') {
    options.fixInterfaces = true;
  } else if (arg === '--all') {
    options.fixUnused = true;
    options.fixMissingTypes = true;
    options.fixPropertyAccess = true;
    options.fixImports = true;
    options.fixInterfaces = true;
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg === '--verbose') {
    options.verbose = true;
  } else {
    options.paths.push(arg);
  }
}

// If no specific fixes are selected, apply all fixes
if (!options.fixUnused && !options.fixMissingTypes && !options.fixPropertyAccess && 
    !options.fixImports && !options.fixInterfaces) {
  options.fixUnused = true;
  options.fixMissingTypes = true;
  options.fixPropertyAccess = true;
  options.fixImports = true;
  options.fixInterfaces = true;
}

// If no paths are provided, show help
if (options.paths.length === 0) {
  console.error('Error: No file or directory paths provided.');
  showHelp();
  process.exit(1);
}

// Show help message
function showHelp() {
  const helpText = fs.readFileSync(__filename, 'utf8')
    .split('\n')
    .filter(line => line.startsWith(' *'))
    .map(line => line.substring(3))
    .join('\n');
  
  console.log(helpText);
}

// Initialize ts-morph project
const project = new Project({
  // Use the tsconfig.json from the current directory if it exists
  tsConfigFilePath: fs.existsSync('./tsconfig.json') ? './tsconfig.json' : undefined,
  skipAddingFilesFromTsConfig: true,
});

// Add files to the project
for (const pathItem of options.paths) {
  if (fs.existsSync(pathItem)) {
    const stats = fs.statSync(pathItem);
    if (stats.isDirectory()) {
      // Add all TypeScript files in the directory and its subdirectories
      addFilesFromDirectory(pathItem);
    } else if (stats.isFile() && (pathItem.endsWith('.ts') || pathItem.endsWith('.tsx'))) {
      // Add individual TypeScript file
      project.addSourceFileAtPath(pathItem);
    } else {
      console.warn(`Warning: Skipping non-TypeScript file: ${pathItem}`);
    }
  } else {
    console.error(`Error: Path does not exist: ${pathItem}`);
    process.exit(1);
  }
}

// Recursively add TypeScript files from a directory
function addFilesFromDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      addFilesFromDirectory(filePath);
    } else if (stats.isFile() && (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) {
      project.addSourceFileAtPath(filePath);
    }
  }
}

// Statistics for reporting
const stats = {
  filesProcessed: 0,
  unusedVariablesFixed: 0,
  missingTypesFixed: 0,
  propertyAccessFixed: 0,
  importsFixed: 0,
  interfacesFixed: 0
};

// Process all source files
const sourceFiles = project.getSourceFiles();
console.log(`Processing ${sourceFiles.length} TypeScript files...`);

for (const sourceFile of sourceFiles) {
  const filePath = sourceFile.getFilePath();
  let fileModified = false;
  
  if (options.verbose) {
    console.log(`\nProcessing file: ${filePath}`);
  }
  
  // Fix 1: Unused variables (prefix with underscore or remove)
  if (options.fixUnused) {
    fileModified = fixUnusedVariables(sourceFile) || fileModified;
  }
  
  // Fix 2: Missing type annotations for function parameters
  if (options.fixMissingTypes) {
    fileModified = fixMissingTypeAnnotations(sourceFile) || fileModified;
  }
  
  // Fix 3: Property access errors (add optional chaining)
  if (options.fixPropertyAccess) {
    fileModified = fixPropertyAccessErrors(sourceFile) || fileModified;
  }
  
  // Fix 4: Import issues
  if (options.fixImports) {
    fileModified = fixImportIssues(sourceFile) || fileModified;
  }
  
  // Fix 5: Missing interface properties
  if (options.fixInterfaces) {
    fileModified = fixMissingInterfaceProperties(sourceFile) || fileModified;
  }
  
  // Save changes if file was modified and not in dry-run mode
  if (fileModified && !options.dryRun) {
    sourceFile.saveSync();
    stats.filesProcessed++;
    
    if (options.verbose) {
      console.log(`Saved changes to: ${filePath}`);
    }
  } else if (fileModified && options.dryRun) {
    stats.filesProcessed++;
    
    if (options.verbose) {
      console.log(`Would save changes to: ${filePath} (dry run)`);
    }
  }
}

// Print summary
console.log('\nSummary:');
console.log(`Files processed: ${stats.filesProcessed}`);
if (options.fixUnused) console.log(`Unused variables fixed: ${stats.unusedVariablesFixed}`);
if (options.fixMissingTypes) console.log(`Missing type annotations fixed: ${stats.missingTypesFixed}`);
if (options.fixPropertyAccess) console.log(`Property access errors fixed: ${stats.propertyAccessFixed}`);
if (options.fixImports) console.log(`Import issues fixed: ${stats.importsFixed}`);
if (options.fixInterfaces) console.log(`Interface issues fixed: ${stats.interfacesFixed}`);

if (options.dryRun) {
  console.log('\nNote: This was a dry run. No files were actually modified.');
}

/**
 * Helper function to safely get a node from a diagnostic
 * 
 * @param {any} diagnostic - The diagnostic
 * @param {import('ts-morph').SourceFile} sourceFile - The source file
 * @returns {import('ts-morph').Node | undefined} - The node or undefined
 */
function getNodeFromDiagnostic(diagnostic, sourceFile) {
  try {
    // For newer versions of ts-morph
    return diagnostic.getNode();
  } catch (e) {
    // For older versions of ts-morph, try to get the node from the start position
    try {
      const start = diagnostic.getStart();
      if (start !== undefined) {
        return sourceFile.getDescendantAtPos(start);
      }
    } catch (e2) {
      // If we can't get the node, return undefined
      return undefined;
    }
  }
  return undefined;
}

/**
 * Helper function to safely get the message text from a diagnostic
 * 
 * @param {any} diagnostic - The diagnostic
 * @returns {string} - The message text or empty string
 */
function getMessageTextFromDiagnostic(diagnostic) {
  try {
    const message = diagnostic.getMessageText();
    
    // Handle different message types
    if (typeof message === 'string') {
      return message;
    } else if (message && typeof message === 'object' && message.messageText) {
      return message.messageText;
    } else if (message && typeof message === 'object' && message.getMessageText) {
      return message.getMessageText();
    }
  } catch (e) {
    // If we can't get the message text, return empty string
    return '';
  }
  return '';
}

/**
 * Fix 1: Unused variables (prefix with underscore or remove)
 * 
 * This function identifies unused variables in the source file and either:
 * 1. Prefixes them with an underscore (for parameters and declarations)
 * 2. Removes them entirely if they're standalone variable declarations
 * 
 * @param {import('ts-morph').SourceFile} sourceFile - The source file to process
 * @returns {boolean} - Whether any changes were made
 */
function fixUnusedVariables(sourceFile) {
  let modified = false;
  const diagnostics = sourceFile.getPreEmitDiagnostics();
  
  // Find all "unused variable" and "unused parameter" diagnostics
  const unusedDiagnostics = diagnostics.filter(diagnostic => {
    return diagnostic.getCode() === 6133 || // 'X' is declared but its value is never read
           diagnostic.getCode() === 6196;   // 'X' is declared but never used
  });
  
  // Process each diagnostic
  for (const diagnostic of unusedDiagnostics) {
    // Get the node from the diagnostic
    const node = getNodeFromDiagnostic(diagnostic, sourceFile);
    if (!node) continue;
    
    // Handle different node types
    if (node.getKind() === SyntaxKind.Parameter) {
      // For function parameters, prefix with underscore
      const paramName = node.getName();
      if (!paramName.startsWith('_')) {
        node.rename(`_${paramName}`);
        modified = true;
        stats.unusedVariablesFixed++;
        
        if (options.verbose) {
          console.log(`Fixed unused parameter: ${paramName} -> _${paramName}`);
        }
      }
    } else if (node.getKind() === SyntaxKind.VariableDeclaration) {
      // For variable declarations, check if it's part of a destructuring pattern
      const parent = node.getParent();
      if (parent && parent.getKind() === SyntaxKind.VariableDeclarationList) {
        const declarations = parent.getDeclarations();
        
        if (declarations.length === 1) {
          // If it's the only declaration in the list, remove the entire statement
          const statement = parent.getParent();
          if (statement) {
            statement.remove();
            modified = true;
            stats.unusedVariablesFixed++;
            
            if (options.verbose) {
              console.log(`Removed unused variable: ${node.getName()}`);
            }
          }
        } else {
          // If it's part of multiple declarations, prefix with underscore
          const varName = node.getName();
          if (!varName.startsWith('_')) {
            node.rename(`_${varName}`);
            modified = true;
            stats.unusedVariablesFixed++;
            
            if (options.verbose) {
              console.log(`Fixed unused variable: ${varName} -> _${varName}`);
            }
          }
        }
      }
    } else if (node.getKind() === SyntaxKind.Identifier) {
      // For identifiers (like in destructuring patterns), prefix with underscore
      const parent = node.getParent();
      if (parent && (
          parent.getKind() === SyntaxKind.BindingElement || 
          parent.getKind() === SyntaxKind.VariableDeclaration
      )) {
        const varName = node.getText();
        if (!varName.startsWith('_')) {
          node.replaceWithText(`_${varName}`);
          modified = true;
          stats.unusedVariablesFixed++;
          
          if (options.verbose) {
            console.log(`Fixed unused variable: ${varName} -> _${varName}`);
          }
        }
      }
    }
  }
  
  return modified;
}

/**
 * Fix 2: Missing type annotations for function parameters
 * 
 * This function adds 'any' type annotations to function parameters that don't have types.
 * 
 * @param {import('ts-morph').SourceFile} sourceFile - The source file to process
 * @returns {boolean} - Whether any changes were made
 */
function fixMissingTypeAnnotations(sourceFile) {
  let modified = false;
  
  // Find all function declarations, arrow functions, and method declarations
  const functions = [
    ...sourceFile.getFunctions(),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration)
  ];
  
  for (const func of functions) {
    const parameters = func.getParameters();
    
    for (const param of parameters) {
      // Check if parameter has a type annotation
      if (!param.getTypeNode()) {
        // Add 'any' type annotation
        param.setType('any');
        modified = true;
        stats.missingTypesFixed++;
        
        if (options.verbose) {
          console.log(`Added 'any' type to parameter: ${param.getName()}`);
        }
      }
    }
  }
  
  return modified;
}

/**
 * Fix 3: Property access errors (add optional chaining)
 * 
 * This function adds optional chaining (?.) to property accesses that might cause errors.
 * It looks for property access expressions and adds optional chaining if the object might be null/undefined.
 * 
 * @param {import('ts-morph').SourceFile} sourceFile - The source file to process
 * @returns {boolean} - Whether any changes were made
 */
function fixPropertyAccessErrors(sourceFile) {
  let modified = false;
  const diagnostics = sourceFile.getPreEmitDiagnostics();
  
  // Find all "Object is possibly 'undefined'" or "Object is possibly 'null'" diagnostics
  const nullishDiagnostics = diagnostics.filter(diagnostic => {
    return diagnostic.getCode() === 2532 || // Object is possibly 'undefined'
           diagnostic.getCode() === 2531 || // Object is possibly 'null'
           diagnostic.getCode() === 18048 || // 'X' is possibly 'undefined'
           diagnostic.getCode() === 18049;   // 'X' is possibly 'null' or 'undefined'
  });
  
  // Process each diagnostic
  for (const diagnostic of nullishDiagnostics) {
    // Get the node from the diagnostic
    const node = getNodeFromDiagnostic(diagnostic, sourceFile);
    if (!node) continue;
    
    // Find the property access expression
    try {
      let propertyAccess = node;
      while (propertyAccess && 
             propertyAccess.getKind() !== SyntaxKind.PropertyAccessExpression &&
             propertyAccess.getKind() !== SyntaxKind.ElementAccessExpression) {
        propertyAccess = propertyAccess.getParent();
      }
      
      if (propertyAccess) {
        // Get the text of the property access
        const text = propertyAccess.getText();
        
        // Check if it already has optional chaining
        if (!text.includes('?.')) {
          try {
            // Replace the dot with optional chaining
            if (propertyAccess.getKind() === SyntaxKind.PropertyAccessExpression) {
              const object = propertyAccess.getExpression();
              const property = propertyAccess.getName();
              
              if (object && property) {
                // Check if the object already has optional chaining
                const objectText = object.getText();
                
                // Create the new text with optional chaining
                let newText;
                if (objectText.includes('?.')) {
                  // If the object already has optional chaining, don't add another one
                  newText = `${objectText}.${property}`;
                  
                  // Check if we need to add optional chaining to the property access
                  if (messageText.includes(`'${objectText}.${property}'`)) {
                    newText = `(${objectText})?.${property}`;
                  }
                } else {
                  newText = `${objectText}?.${property}`;
                }
                
                propertyAccess.replaceWithText(newText);
                
                modified = true;
                stats.propertyAccessFixed++;
                
                if (options.verbose) {
                  console.log(`Added optional chaining: ${text} -> ${newText}`);
                }
              }
            } else if (propertyAccess.getKind() === SyntaxKind.ElementAccessExpression) {
              const object = propertyAccess.getExpression();
              const argumentExpression = propertyAccess.getArgumentExpression();
              
              if (object && argumentExpression) {
                // Check if the object already has optional chaining
                const objectText = object.getText();
                const argText = argumentExpression.getText();
                
                // Create the new text with optional chaining for element access
                let newText;
                if (objectText.includes('?.')) {
                  // If the object already has optional chaining, don't add another one
                  newText = `${objectText}[${argText}]`;
                  
                  // Check if we need to add optional chaining to the element access
                  if (messageText.includes(`'${objectText}[${argText}]'`)) {
                    newText = `(${objectText})?.[${argText}]`;
                  }
                } else {
                  newText = `${objectText}?.[${argText}]`;
                }
                
                propertyAccess.replaceWithText(newText);
                
                modified = true;
                stats.propertyAccessFixed++;
                
                if (options.verbose) {
                  console.log(`Added optional chaining: ${text} -> ${newText}`);
                }
              }
            }
          } catch (e) {
            // Skip this property access if there's an error
            if (options.verbose) {
              console.log(`Error processing property access: ${e.message}`);
            }
          }
        }
      }
    } catch (e) {
      // Skip this diagnostic if there's an error
      if (options.verbose) {
        console.log(`Error finding property access: ${e.message}`);
      }
    }
  }
  
  return modified;
}

/**
 * Fix 4: Import issues
 * 
 * This function fixes common import issues:
 * 1. Missing imports (adds them based on usage)
 * 2. Unused imports (removes them)
 * 3. Incorrect module specifiers (fixes paths)
 * 
 * @param {import('ts-morph').SourceFile} sourceFile - The source file to process
 * @returns {boolean} - Whether any changes were made
 */
function fixImportIssues(sourceFile) {
  let modified = false;
  const diagnostics = sourceFile.getPreEmitDiagnostics();
  
  // Find all import-related diagnostics
  const importDiagnostics = diagnostics.filter(diagnostic => {
    return diagnostic.getCode() === 2306 || // Module 'X' has no exported member 'Y'
           diagnostic.getCode() === 2307 || // Cannot find module 'X' or its corresponding type declarations
           diagnostic.getCode() === 2724;   // Module 'X' has no exported member named 'Y'. Did you mean 'Z'?
  });
  
  // Process each diagnostic
  for (const diagnostic of importDiagnostics) {
    // Get the node from the diagnostic
    const node = getNodeFromDiagnostic(diagnostic, sourceFile);
    if (!node) continue;
    
    // Get the message text
    const messageText = getMessageTextFromDiagnostic(diagnostic);
    if (!messageText) continue;
    
    // Fix 1: Module has no exported member 'Y'. Did you mean 'Z'?
    if (diagnostic.getCode() === 2724 && messageText.includes('Did you mean')) {
      const matches = messageText.match(/Module ['"](.+)['"] has no exported member ['"](.+)['"].*Did you mean ['"](.+)['"]?/);
      
      if (matches && matches.length >= 4) {
        const [, moduleName, wrongName, correctName] = matches;
        
        // Find the import declaration
        const importDeclarations = sourceFile.getImportDeclarations();
        for (const importDecl of importDeclarations) {
          if (importDecl.getModuleSpecifierValue() === moduleName) {
            const namedImports = importDecl.getNamedImports();
            
            for (const namedImport of namedImports) {
              if (namedImport.getName() === wrongName) {
                // Replace the wrong name with the correct one
                namedImport.setName(correctName);
                modified = true;
                stats.importsFixed++;
                
                if (options.verbose) {
                  console.log(`Fixed import: ${wrongName} -> ${correctName} from '${moduleName}'`);
                }
              }
            }
          }
        }
      }
    }
    
    // Fix 2: Cannot find module 'X'
    if (diagnostic.getCode() === 2307) {
      const matches = messageText.match(/Cannot find module ['"](.+)['"] or its corresponding type declarations/);
      
      if (matches && matches.length >= 2) {
        const moduleName = matches[1];
        
        // Try to fix relative paths by checking if the file exists with different extensions
        if (moduleName.startsWith('.')) {
          const possibleExtensions = ['.ts', '.tsx', '.js', '.jsx'];
          const baseDir = path.dirname(sourceFile.getFilePath());
          
          for (const ext of possibleExtensions) {
            const possiblePath = path.join(baseDir, `${moduleName}${ext}`);
            
            if (fs.existsSync(possiblePath)) {
              // Find the import declaration
              const importDeclarations = sourceFile.getImportDeclarations();
              for (const importDecl of importDeclarations) {
                if (importDecl.getModuleSpecifierValue() === moduleName) {
                  // Update the module specifier to include the extension
                  const newModuleName = `${moduleName}${ext === '.ts' || ext === '.tsx' ? '' : ext}`;
                  importDecl.setModuleSpecifier(newModuleName);
                  modified = true;
                  stats.importsFixed++;
                  
                  if (options.verbose) {
                    console.log(`Fixed import path: '${moduleName}' -> '${newModuleName}'`);
                  }
                  
                  break;
                }
              }
              
              break;
            }
          }
        }
      }
    }
  }
  
  // Remove unused imports
  const importDeclarations = sourceFile.getImportDeclarations();
  for (const importDecl of importDeclarations) {
    const namedImports = importDecl.getNamedImports();
    const unusedImports = [];
    
    // First collect all unused imports
    for (const namedImport of namedImports) {
      try {
        const name = namedImport.getName();
        const references = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
          .filter(id => {
            try {
              return id.getText() === name && 
                     id.getParent() && 
                     id.getParent().getKind() !== SyntaxKind.ImportSpecifier;
            } catch (e) {
              return false;
            }
          });
        
        if (references.length === 0) {
          unusedImports.push(name);
        }
      } catch (e) {
        // Skip this import if there's an error
        continue;
      }
    }
    
    // Then create a new import declaration without the unused imports
    if (unusedImports.length > 0) {
      try {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        const defaultImport = importDecl.getDefaultImport();
        const usedNamedImports = namedImports
          .filter(namedImport => {
            try {
              return !unusedImports.includes(namedImport.getName());
            } catch (e) {
              return true; // Keep imports we can't check
            }
          });
        
        // If there are still imports left, update the import declaration
        if (defaultImport || usedNamedImports.length > 0) {
          // Create a new import declaration
          const newNamedImports = usedNamedImports.map(ni => {
            try {
              return { name: ni.getName() };
            } catch (e) {
              return null;
            }
          }).filter(Boolean);
          
          // Replace the old import declaration with a new one
          importDecl.replaceWithText(
            `import ${defaultImport ? defaultImport.getText() : ''}${defaultImport && newNamedImports.length > 0 ? ', ' : ''}${
              newNamedImports.length > 0 
                ? `{ ${newNamedImports.map(ni => ni.name).join(', ')} }` 
                : ''
            } from '${moduleSpecifier}';`
          );
          
          modified = true;
          stats.importsFixed += unusedImports.length;
          
          if (options.verbose) {
            for (const unusedImport of unusedImports) {
              console.log(`Removed unused import: ${unusedImport}`);
            }
          }
        } else {
          // If all imports were removed, remove the entire import declaration
          importDecl.remove();
          modified = true;
          stats.importsFixed += unusedImports.length;
          
          if (options.verbose) {
            console.log(`Removed empty import: ${moduleSpecifier}`);
          }
        }
      } catch (e) {
        // Skip this import declaration if there's an error
        if (options.verbose) {
          console.log(`Error processing import: ${e.message}`);
        }
      }
    }
  }
  
  return modified;
}

/**
 * Fix 5: Missing interface properties
 * 
 * This function identifies objects that don't satisfy their interfaces and adds missing properties.
 * 
 * @param {import('ts-morph').SourceFile} sourceFile - The source file to process
 * @returns {boolean} - Whether any changes were made
 */
function fixMissingInterfaceProperties(sourceFile) {
  let modified = false;
  const diagnostics = sourceFile.getPreEmitDiagnostics();
  
  // Find all "Property 'X' is missing in type 'Y' but required in type 'Z'" diagnostics
  const missingPropDiagnostics = diagnostics.filter(diagnostic => {
    return diagnostic.getCode() === 2741; // Property 'X' is missing in type 'Y' but required in type 'Z'
  });
  
  // Process each diagnostic
  for (const diagnostic of missingPropDiagnostics) {
    // Get the node from the diagnostic
    const node = getNodeFromDiagnostic(diagnostic, sourceFile);
    if (!node) continue;
    
    // Get the message text
    const messageText = getMessageTextFromDiagnostic(diagnostic);
    if (!messageText) continue;
    
    // Extract the missing property name
    const matches = messageText.match(/Property ['"](.+)['"] is missing in type/);
    
    if (matches && matches.length >= 2) {
      const missingProp = matches[1];
      
      try {
        // Find object literal expressions
        if (node.getKind() === SyntaxKind.ObjectLiteralExpression) {
          const objectLiteral = node;
          
          try {
            // Check if the property already exists
            const existingProp = objectLiteral.getProperty(missingProp);
            
            if (!existingProp) {
              // Add the missing property with a placeholder value
              objectLiteral.addPropertyAssignment({
                name: missingProp,
                initializer: 'undefined'
              });
              
              modified = true;
              stats.interfacesFixed++;
              
              if (options.verbose) {
                console.log(`Added missing property: ${missingProp} to object literal`);
              }
            }
          } catch (e) {
            // Skip this object literal if there's an error
            if (options.verbose) {
              console.log(`Error processing object literal: ${e.message}`);
            }
          }
        }
        
        // Find interface declarations that might need the property
        try {
          const interfaces = sourceFile.getInterfaces();
          let interfaceFixed = false;
          
          for (const interfaceDecl of interfaces) {
            try {
              // Check if this interface is mentioned in the error message
              const interfaceName = interfaceDecl.getName();
              if (messageText.includes(`type '${interfaceName}'`)) {
                // Check if the property already exists
                const existingProp = interfaceDecl.getProperty(missingProp);
                
                if (!existingProp) {
                  // Add the missing property to the interface
                  interfaceDecl.addProperty({
                    name: missingProp,
                    type: 'any',
                    hasQuestionToken: true // Make it optional to avoid breaking existing code
                  });
                  
                  modified = true;
                  stats.interfacesFixed++;
                  interfaceFixed = true;
                  
                  if (options.verbose) {
                    console.log(`Added missing property: ${missingProp} to interface ${interfaceName}`);
                  }
                  
                  break;
                }
              }
            } catch (e) {
              // Skip this interface if there's an error
              continue;
            }
          }
          
          // If we didn't fix any interface, try to find classes
          if (!interfaceFixed) {
            try {
              const classes = sourceFile.getClasses();
              
              for (const classDecl of classes) {
                try {
                  // Check if this class is mentioned in the error message
                  const className = classDecl.getName();
                  if (messageText.includes(`type '${className}'`)) {
                    // Check if the property already exists
                    const existingProp = classDecl.getProperty(missingProp);
                    
                    if (!existingProp) {
                      // Add the missing property to the class
                      classDecl.addProperty({
                        name: missingProp,
                        type: 'any',
                        hasQuestionToken: true // Make it optional to avoid breaking existing code
                      });
                      
                      modified = true;
                      stats.interfacesFixed++;
                      
                      if (options.verbose) {
                        console.log(`Added missing property: ${missingProp} to class ${className}`);
                      }
                      
                      break;
                    }
                  }
                } catch (e) {
                  // Skip this class if there's an error
                  continue;
                }
              }
            } catch (e) {
              // Skip classes if there's an error
              if (options.verbose) {
                console.log(`Error processing classes: ${e.message}`);
              }
            }
          }
        } catch (e) {
          // Skip interfaces if there's an error
          if (options.verbose) {
            console.log(`Error processing interfaces: ${e.message}`);
          }
        }
      } catch (e) {
        // Skip this diagnostic if there's an error
        if (options.verbose) {
          console.log(`Error processing missing property: ${e.message}`);
        }
      }
    }
  }
  
  return modified;
}
