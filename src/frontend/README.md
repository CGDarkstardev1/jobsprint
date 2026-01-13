# JobSprint Frontend

Modern React frontend for JobSprint AI-powered job search automation platform.

## Tech Stack

- **React 18+** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **lucide-react** for icons
- **recharts** for data visualization
- **@tanstack/react-query** for data fetching
- **Vite** for build tooling
- **React Router** for navigation

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
cd src/frontend
npm install
```

### Development

```bash
npm run dev
```

This starts the development server at `http://localhost:3000`.

### Build

```bash
npm run build
```

This creates a production build in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── layout/       # Header, Footer, AppLayout
│   ├── features/     # Feature-specific components
│   └── pages/        # Page components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── types/            # TypeScript types
├── App.tsx           # Main app component
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## Features

- **Dashboard**: Overview of job search metrics and recent activity
- **Job Search**: AI-powered job search with advanced filtering
- **Auto-Apply**: Automated job application workflow
- **Resume Tools**: ATS checker and AI resume tailoring
- **Settings**: API configuration and preferences

## Customization

### Theme

The theme is configured in `tailwind.config.js` using CSS variables defined in `src/index.css`. Modify the color values to customize the look and feel.

### Components

shadcn/ui components can be customized by modifying the source files in `src/components/ui/`.

## License

MIT
