# gov-perf-watcher

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## JSON Schema Generator

This project includes a script to automatically generate JSON schemas from JSON data files. The script can process individual files or batch process multiple files from a directory.

### Usage

```bash
bun scripts/generate-schemas.ts [options]
```

### Options

- `--input`, `-i`: Input directory containing JSON files (required)
- `--output`, `-o`: Output directory where schemas will be saved (required)
- `--pattern`, `-p`: Glob pattern to filter specific JSON files (optional, default: *.json)
- `--recursive`, `-r`: Search recursively in subdirectories (optional)
- `--help`, `-h`: Display help information

### Examples

Generate schemas for all JSON files in a specific snapshot directory:
```bash
bun scripts/generate-schemas.ts --input snapshots/2025-05-22T16-59-53+01-00 --output schemas
```

Generate schemas only for files matching a pattern:
```bash
bun scripts/generate-schemas.ts --input snapshots --output schemas --pattern "informacao_base.json"
```

Process all JSON files recursively:
```bash
bun scripts/generate-schemas.ts --input snapshots --output schemas --recursive
```

---

This project was created using `bun init` in bun v1.2.10. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
