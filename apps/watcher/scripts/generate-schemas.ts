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
  },
  default: {
    recursive: false
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
  const recursive = argv.recursive;

  console.log('JSON Schema Generator');
  console.log('-------------------');
  console.log(`Input directory: ${inputDir}`);
  console.log(`Output directory: ${outputDir}`);
  console.log(`Pattern: ${pattern}`);
  console.log(`Recursive: ${recursive}`);
  console.log('-------------------');

  // Validate input directory
  if (!existsSync(inputDir) || !statSync(inputDir).isDirectory()) {
    console.error(`Error: Input directory ${inputDir} does not exist or is not a directory`);
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    console.log(`Created output directory: ${outputDir}`);
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
      console.log(`✅ Generated schema for ${jsonFile} -> ${schemaFile}`);
      successful++;
    } catch (error) {
      console.error(`❌ Failed to process ${jsonFile}: ${(error as Error).message}`);
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
async function createSchemaFromFile(jsonPath: string, schemaPath: string): Promise<boolean> {
  try {
    const data = JSON.parse(await readFile(jsonPath, 'utf8'));
    const schema = generateSchema.json(jsonPath, data);
    await writeFile(schemaPath, JSON.stringify(schema, null, 2));
    return true;
  } catch (error) {
    throw new Error(`Error generating schema: ${(error as Error).message}`);
  }
}

// Function to find JSON files
function findJsonFiles(dir: string, pattern: string, recursive: boolean): string[] {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory() && recursive) {
      files.push(...findJsonFiles(fullPath, pattern, recursive));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      // Simple pattern matching (can be enhanced with micromatch or minimatch)
      if (pattern === '*.json' || matchesPattern(entry.name, pattern)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

// Simple pattern matching function
function matchesPattern(filename: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\./g, '\\.')    // Escape dots
    .replace(/\*/g, '.*');    // Convert * to .*
  
  return new RegExp(`^${regexPattern}$`).test(filename);
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
  bun scripts/generate-schemas.ts --input snapshots --output schemas --pattern "informacao_base.json"

  # Process all JSON files recursively
  bun scripts/generate-schemas.ts --input snapshots --output schemas --recursive
  `);
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});