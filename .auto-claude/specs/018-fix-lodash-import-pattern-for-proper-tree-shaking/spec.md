# Fix lodash import pattern for proper tree-shaking

## Overview

The InitiativeList component imports debounce using `import { debounce } from 'lodash'` which includes the entire lodash library (~70KB). Named imports from lodash don't tree-shake properly. Should use path import `import debounce from 'lodash/debounce'` or switch to a dedicated debounce package (~1KB).

## Rationale

Lodash is a large utility library and the current import pattern prevents tree-shaking. Only the debounce function is used in the entire codebase, but the full lodash library may be bundled. Using path imports or a dedicated package would reduce this to ~1KB.

---
*This spec was created from ideation and is pending detailed specification.*
