# JSON Schema Generator Script Plan

## Overview

This document outlines the plan for a standalone script that can batch process multiple JSON files from a directory, generating JSON schemas for each file. The script will build on the existing `createSchemaFromFile` function in `src/validator.ts`.

## Script Details

**Script Name**: `scripts/generate-schemas.ts`

## Features

1. **Command line arguments**:
   - `--input` or `-i`: Input directory containing JSON files (required)
   - `--output` or `-o`: Output directory where schemas will be saved (required)
   - `--pattern` or `-p`: Optional glob pattern to filter specific JSON files (optional)
   - `--recursive` or `-r`: Flag to search recursively in subdirectories (optional)
   - `--help` or `-h`: Display help information

2. **Batch processing**:
   - Find all JSON files in the input directory (optionally filtered by pattern)
   - Process each file to generate a schema
   - Save the schemas to the output directory
   - Maintain directory structure if recursive mode is enabled

3. **Output**:
   - Create the output directory if it doesn't exist
   - Save schemas with `.schema.json` suffix
   - Display summary of processing results (total files, successful, failed)

## Implementation

### Script Structure

```typescript
#!/usr/bin/env bun

import { readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename, dirname, relative } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import generateSchema from 'generate-schema';
import minimist from 'minimist';

// Parse command line arguments
const argv = minimist(process.argv.slice(2), {
  string: ['input', 'output', 'pattern'],
  boolean: ['recursive', 'help'],
  alias: {
    i: 'input',
    o: 'output',
    p: 'pattern',
    r: 'recursive',
    h: 'help'
  }
});

// Display help if requested or if required arguments are missing
if (argv.help || !argv.input || !argv.output) {
  displayHelp();
  process.exit(argv.help ? 0 : 1);
}

// Main function
async function main() {
  const inputDir = argv.input;
  const outputDir = argv.output;
  const pattern = argv.pattern || '*.json';
  const recursive = argv.recursive || false;

  // Validate input directory
  if (!existsSync(inputDir) || !statSync(inputDir).isDirectory()) {
    console.error(`Error: Input directory ${inputDir} does not exist or is not a directory`);
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Find all JSON files
  const jsonFiles = findJsonFiles(inputDir, pattern, recursive);
  console.log(`Found ${jsonFiles.length} JSON files to process`);

  // Process each file
  let successful = 0;
  let failed = 0;

  for (const jsonFile of jsonFiles) {
    try {
      // Calculate relative path to maintain directory structure
      const relPath = relative(inputDir, jsonFile);
      const schemaFile = join(outputDir, relPath.replace(/\.json$/, '.schema.json'));
      
      // Ensure the output directory exists
      const outputSubDir = dirname(schemaFile);
      if (!existsSync(outputSubDir)) {
        mkdirSync(outputSubDir, { recursive: true });
      }
      
      // Generate schema
      await createSchemaFromFile(jsonFile, schemaFile);
      console.log(`✓ Generated schema for ${jsonFile} -> ${schemaFile}`);
      successful++;
    } catch (error) {
      console.error(`✗ Failed to process ${jsonFile}: ${error.message}`);
      failed++;
    }
  }

  // Display summary
  console.log('\nSummary:');
  console.log(`Total files: ${jsonFiles.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
}

// Function to create schema from a JSON file
async function createSchemaFromFile(jsonPath, schemaPath) {
  const data = JSON.parse(await readFile(jsonPath, 'utf8'));
  const schema = generateSchema.json(jsonPath, data);
  await writeFile(schemaPath, JSON.stringify(schema, null, 2));
}

// Function to find JSON files
function findJsonFiles(dir, pattern, recursive) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory() && recursive) {
      files.push(...findJsonFiles(fullPath, pattern, recursive));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      // Simple pattern matching (can be enhanced with micromatch or minimatch)
      if (!pattern || pattern === '*.json' || entry.name.match(new RegExp(pattern.replace('*', '.*')))) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

// Function to display help
function displayHelp() {
  console.log(`
JSON Schema Generator

Usage: bun scripts/generate-schemas.ts [options]

Options:
  --input, -i     Input directory containing JSON files (required)
  --output, -o    Output directory where schemas will be saved (required)
  --pattern, -p   Glob pattern to filter specific JSON files (optional, default: *.json)
  --recursive, -r Search recursively in subdirectories (optional)
  --help, -h      Display this help information

Examples:
  # Generate schemas for all JSON files in a specific snapshot directory
  bun scripts/generate-schemas.ts --input snapshots/2025-05-22T16-59-53+01-00 --output schemas

  # Generate schemas only for files matching a pattern
  bun scripts/generate-schemas.ts --input snapshots --output schemas --pattern "*_base.json"

  # Process all JSON files recursively
  bun scripts/generate-schemas.ts --input snapshots --output schemas --recursive
  `);
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
```

### Dependencies

The script will need the `minimist` package for parsing command line arguments. This should be added to the project:

```bash
bun add minimist
bun add @types/minimist --dev
```

## Example Usage

```bash
# Generate schemas for all JSON files in a specific snapshot directory
bun scripts/generate-schemas.ts --input snapshots/2025-05-22T16-59-53+01-00 --output schemas

# Generate schemas only for files matching a pattern
bun scripts/generate-schemas.ts --input snapshots --output schemas --pattern "informacao_base.json"

# Process all JSON files recursively
bun scripts/generate-schemas.ts --input snapshots --output schemas --recursive
```

## Expected Output

The script will generate schema files in the output directory with names corresponding to the input files but with `.schema.json` suffix. For example:

- Input: `snapshots/2025-05-22T16-59-53+01-00/informacao_base.json`
- Output: `schemas/informacao_base.schema.json`

## Implementation Steps

1. Create the script file `scripts/generate-schemas.ts`
2. Install required dependencies (`minimist`)
3. Implement the command-line argument parsing
4. Implement the file discovery logic
5. Integrate the schema generation functionality
6. Add output handling and error reporting
7. Test with sample data
8. Document usage in the README

## Next Steps

After reviewing this plan, we should switch to Code mode to implement the script according to the specifications outlined above.