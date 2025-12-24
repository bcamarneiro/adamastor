# Gov-Perf-Frontend

A modern React application for tracking and analyzing Portuguese parliamentary activities.

## Overview

Gov-Perf-Frontend is a web application built with React and TypeScript that bridges the gap between parliamentary activities and citizen understanding. While Portugal's Parliament produces extensive documentation of its activities, this information often remains inaccessible to the average citizen - buried in complex documents, technical jargon, and hard-to-navigate official websites. This project transforms this complex parliamentary data into an accessible, easy-to-understand format for everyone.

## Why This Matters

The distance between citizens and their elected representatives has never been greater. Most people:

- Feel overwhelmed by the complexity of parliamentary processes
- Struggle to track what their elected representatives are actually doing
- Can't easily find or understand voting records on issues they care about
- Get lost in technical jargon and bureaucratic language
- Don't have time to monitor official channels and documents

This tool democratizes access to parliamentary information by:

- Presenting complex legislative processes in plain language
- Making it easy to track specific issues or initiatives
- Showing clear voting records and party positions
- Highlighting the actual impact of parliamentary decisions
- Enabling citizens to hold their representatives accountable

## Key Features

- Track parliamentary initiatives and their progress
- Search and filter legislative proposals
- View detailed information about:
  - Parliamentary initiatives
  - Voting records
  - Debate transcripts
  - Legislative timelines
- Real-time updates on parliamentary activities
- Modern UI with Radix UI and Tailwind CSS
- Efficient data fetching with React Query
- State management with Zustand
- Type-safe development with TypeScript
- Comprehensive testing with Vitest

## Data Structure

The application processes parliamentary data including:

- Initiative types and titles
- Author information (parliamentary groups)
- Event timelines and phases
- Voting records
- Debate transcripts
- Related documents and references

## Prerequisites

- Node.js (latest LTS version recommended)
- npm or yarn

## Getting Started

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/gov-perf-frontend.git
   cd gov-perf-frontend
   Copy
   Insert
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

### Development

To start the development server:

```bash
npm run dev
```

This will start the Vite development server, typically at [http://localhost:3000](http://localhost:3000).

### Building for Production

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

### Testing

Run tests in watch mode:

```bash
npm run test
```

Run tests for CI:

```bash
npm run test:ci
```

### Linting

Check code for linting issues:

```bash
npm run lint
```

Fix linting issues automatically:

```bash
npm run lint:fix
```

### Project Structure

```bash
gov-perf-frontend/
├── src/
│ ├── assets/ # Static assets
│ ├── components/ # Reusable UI components
│ ├── pages/ # Page components
│ ├── services/ # API and service integrations
│ │ └── initiatives/ # Parliamentary initiatives services
│ ├── store/ # State management
│ ├── styles/ # Global styles
│ ├── utils/ # Utility functions
│ ├── App.tsx # Main App component
│ └── main.tsx # Application entry point
├── public/
│ └── data/ # Parliamentary data files
│     └── XVI/ # Legislative term data
└── ... # Config files
```

### Technologies

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- React Query
- Zustand
- Vitest
- Biome

#### CI/CD

The project uses GitHub Actions for continuous integration. The workflow runs tests on every push to ensure code quality.

### Contributing

1. Fork the repository
2. Create your feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add some amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

#### Attribution of Contributions

Contributions are made by individuals, not by the organizations they may be associated with.

## 📜 License & Usage

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** license. This means:

- ✅ **You are free to:**

  - Share - Copy and redistribute the material in any medium or format.
  - Adapt - Remix, transform, and build upon the material.

- ❗ **Under the following conditions:**
  - **Attribution** - You must give appropriate credit to all contributors, provide a link to the license, and indicate if changes were made.
  - **NonCommercial** - You may not use the material for commercial purposes.
  - **ShareAlike** - If you remix, transform, or build upon the material, you must distribute your contributions under the same license.

For full details, see the [official CC BY-NC-SA 4.0 license](https://creativecommons.org/licenses/by-nc-sa/4.0/).

## 🏛 Political Neutrality

This project is **independent and not affiliated with any political party**. Contributions from all parties, organizations, or individuals are welcome as long as they align with the principles of open data and transparency.

While some contributors may have political affiliations, **this project does not endorse any party or ideology**. Contributions should be made in the spirit of data integrity and public interest.

## 🎯 Project Goals

1. **Democratize Access to Parliamentary Data**

   - Make legislative processes more transparent and understandable
   - Provide easy access to parliamentary activities
   - Enable efficient tracking of legislative initiatives

2. **Enhance Civic Participation**

   - Lower barriers to understanding parliamentary processes
   - Enable informed civic engagement
   - Facilitate research and analysis of legislative activities

3. **Ensure Data Transparency**
   - Provide accurate and up-to-date information
   - Maintain political neutrality
   - Support open government initiatives
