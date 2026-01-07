# Extract compare() utility to shared module

## Overview

The compare() function that determines winners between two values is duplicated verbatim in useCompareDistricts.ts and useCompareParties.ts. Extract this to a shared utility.

## Rationale

The identical compare() function exists in two files (lines 24-42 in useCompareDistricts.ts and useCompareParties.ts). Both handle nullable values, equality checks, and higher/lower-is-better logic identically. This is a direct extraction opportunity.

---
*This spec was created from ideation and is pending detailed specification.*
