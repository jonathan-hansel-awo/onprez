# OnPrez

Digital identity platform with integrated booking for service professionals.

## Getting Started

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd onprez

# Install dependencies
npm install
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your values
# For basic development, the defaults are fine!
```

📖 **See [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) for detailed guide**

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

This project uses type-safe environment variables with validation:

```typescript
// ✅ Type-safe way
import { env } from '@/lib/env'
const url = env.NEXT_PUBLIC_APP_URL

// ❌ Not type-safe
const url = process.env.NEXT_PUBLIC_APP_URL
```

**Required for development:**

- `NEXT_PUBLIC_APP_URL` - Your app URL (default: http://localhost:3000)
- `NEXT_PUBLIC_APP_NAME` - App name (default: OnPrez)

**Optional (configured in later milestones):**

- Database variables (Milestone 2)
- Supabase Auth variables (Milestone 3)
- Stripe, Resend, and other service keys (later)

See `.env.example` for all available variables.

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
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Homepage
│   ├── components/       # React components
│   │   ├── ui/          # Shadcn/ui components
│   │   └── ...
│   ├── lib/             # Utilities
│   │   ├── env.ts       # Environment variables
│   │   └── utils.ts     # Helper functions
│   └── types/           # TypeScript types
├── __tests__/           # Test files
├── docs/                # Documentation
│   └── ENVIRONMENT_VARIABLES.md
├── .husky/              # Git hooks
├── .vscode/             # VSCode settings
├── public/              # Static files
├── .env.example         # Environment template
└── .env.local          # Your local env (gitignored)
```

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Components:** Shadcn/ui
- **Testing:** Jest + React Testing Library
- **Linting:** ESLint + Prettier
- **Git Hooks:** Husky + lint-staged
- **Validation:** Zod (for env vars and data)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

**Note:** Vercel will automatically:

- Detect it's a Next.js app
- Install dependencies
- Build and deploy
- Set up preview deployments

See [Vercel deployment docs](https://nextjs.org/docs/deployment) for more details.

## Development Workflow

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes**
   - Code is auto-formatted on save (if using VSCode)
   - Tests run in watch mode: `npm run test:watch`

3. **Commit**

   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

   - Pre-commit hooks will run automatically
   - Lint and format issues will be auto-fixed

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature
   ```

## Troubleshooting

### Environment Variables Not Loading

- Restart dev server after changing `.env.local`
- Check file is named `.env.local` (not `.env`)
- Ensure variables are in the Zod schema

### Tests Failing

- Run `npm run test` to see specific errors
- Check `jest.setup.ts` has mock env vars
- Ensure all files are properly formatted

### Build Errors

- Run `npm run type-check` to find TypeScript errors
- Run `npm run lint` to find linting issues
- Check all required env vars are set

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting PR

---

## Milestones Completed

- ✅ **1.1:** Project Setup & Infrastructure
- ✅ **1.2:** Styling Foundation (Tailwind + Shadcn/ui)
- ✅ **1.3:** Code Quality Tools (ESLint + Prettier + Husky)
- ✅ **1.4:** Environment Variables (Type-safe with Zod)

**Next:** Landing page, testing infrastructure, then database setup!

---

Built with ❤️ for service professionals everywhere.
