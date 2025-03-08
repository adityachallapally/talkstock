# TalkStock Project Guidelines

## Commands
- **Dev server**: `npm run dev` (http://localhost:3000)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Start production**: `npm run start`
- **Remotion studio**: `npm run remotion`
- **Render video**: `npm run render`

## Code Style
- **Architecture**: Next.js App Router with TypeScript
- **Components**: React functional components with TypeScript
- **State**: React hooks for local state
- **Database**: Prisma ORM with PostgreSQL
- **Styling**: Tailwind CSS with shadcn/ui components
- **API routes**: Located in app/api/ directory
- **Authentication**: NextAuth.js
- **Video generation**: Remotion
- **Error handling**: Use try/catch blocks, return proper API responses
- **Naming**: PascalCase for components, camelCase for variables/functions

## Project Structure
- `/app`: Next.js routes and API endpoints
- `/components`: Reusable React components
- `/remotion`: Video templates and animations
- `/prisma`: Database schema and migrations
- `/lib`: Utility functions and services