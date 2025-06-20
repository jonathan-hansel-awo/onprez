# OnPrez - Local Business Booking Platform

OnPrez is a smart booking solution that helps local businesses accept online appointments through customizable, branded profile pages. Businesses can manage their availability, track bookings, and grow their customer base - all from one simple platform.

## 🎯 Core Features

- **Online Booking System** - Let customers book appointments 24/7
- **Branded Profile Pages** - Customizable pages that match your business identity
- **Appointment Management** - Track and manage all bookings in one place
- **Customer Database** - Build relationships with integrated customer management
- **Service Catalog** - Showcase your services with pricing and duration

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/YOUR_USERNAME/onprez.git
   cd onprez
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Copy environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the result.

## 🏗️ Project Structure

\`\`\`
src/
├── app/ # Next.js App Router pages
├── components/ # React components
│ ├── ui/ # Base UI components
│ ├── layout/ # Layout components
│ └── features/ # Feature-specific components
├── lib/ # Utility functions and constants
├── hooks/ # Custom React hooks
├── types/ # TypeScript type definitions
└── styles/ # Global styles
\`\`\`

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/ui
- **Deployment:** Vercel

## 📝 Development

- Run linter: `npm run lint`
- Format code: `npm run format`
- Type check: `npm run type-check`

## 🚢 Deployment

The app is automatically deployed to Vercel on push to the main branch.

## 📄 License

Copyright 2024 OnPrez. All rights reserved.
