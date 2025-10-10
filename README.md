# OnPrez

Digital identity platform with integrated booking for service professionals.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Code Quality Tools

This project uses several tools to maintain code quality:

### ESLint

Identifies and fixes code problems:

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### Prettier

Formats code consistently:

```bash
npm run format        # Format all files
npm run format:check  # Check if files are formatted
```

### Pre-commit Hooks (Husky)

Automatically runs linting and formatting before each commit. This ensures:

- ✅ All code is properly formatted
- ✅ No ESLint errors
- ✅ Consistent code style across the team

### TypeScript Type Checking

```bash
npm run type-check  # Verify TypeScript types
```

### Running Tests

```bash
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
```

## VSCode Setup

For the best development experience:

1. **Install recommended extensions** (VSCode will prompt you)
2. **Enable format on save** (already configured in `.vscode/settings.json`)
3. **Reload window** after installing extensions

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files are formatted
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Project Structure

```
onprez/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   │   └── ui/          # Shadcn/ui components
│   ├── lib/             # Utilities
│   └── types/           # TypeScript types
├── __tests__/           # Test files
├── .husky/              # Git hooks
├── .vscode/             # VSCode settings
├── public/              # Static files
└── ...config files
```

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Components:** Shadcn/ui
- **Testing:** Jest + React Testing Library
- **Linting:** ESLint + Prettier
- **Git Hooks:** Husky + lint-staged

---
