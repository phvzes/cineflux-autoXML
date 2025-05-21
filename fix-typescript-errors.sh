#!/bin/bash

# Fix unused variables by prefixing them with underscore
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\([^_]\)\(.*\): \([a-zA-Z0-9]*\) is declared but its value is never read/\1_\2/g'

# Fix implicit any types
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/Parameter \([a-zA-Z0-9]*\) implicitly has an/Parameter \1: any /g'

# Make the script executable
chmod +x fix-typescript-errors.sh
