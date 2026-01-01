# Rental Property Management System

## Overview

A complete rental property management application built for Brazilian landlords. The system handles property registration, tenant contracts, payment tracking, tax calculations (IRPF), and professional receipt generation. The interface is in Portuguese (pt-BR) and uses Brazilian currency formatting (R$).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled using Vite
- **State Management**: TanStack React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Design System**: Material Design 3 adapted for productivity applications
- **Theming**: Dark/light mode support via CSS custom properties

The frontend uses a tab-based single-page layout with six main sections: Dashboard, Properties (Imóveis), Contracts (Contratos), Payments (Recebimentos), Taxes (Impostos), and Reports (Relatórios).

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Style**: RESTful JSON endpoints under `/api/*`
- **Build**: esbuild for production bundling, Vite dev server for development

The server serves both the API and static frontend assets. In development, Vite middleware handles HMR; in production, pre-built static files are served.

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod schema integration (drizzle-zod)
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command

Core entities:
- **Properties**: Address, type (apartment/house/commercial/land), owner info, rent value
- **Contracts**: Links property to tenant with dates, rent amount, due day, status, admin fee, rent adjustment settings
- **Payments**: Tracks monthly payments with status (paid/pending/overdue)
- **Users**: Full authentication with passport-local and PostgreSQL session storage

### Authentication
- **Strategy**: Passport.js with local strategy
- **Session Storage**: PostgreSQL via connect-pg-simple (table: user_sessions)
- **Password Security**: scrypt hashing with random salt
- **Routes**: /api/auth/login, /api/auth/register, /api/auth/logout, /api/auth/user
- **Frontend**: Login/Register page at client/src/pages/auth.tsx

### Contract Features
- **Admin Fee**: Optional percentage fee on rent (adminFeePercent)
- **Rent Adjustment**: Supports IGPM, IPCA, or fixed percentage with next adjustment date tracking

### Referential Integrity
The system uses Drizzle ORM relations to maintain data consistency:
- `propertiesRelations`: One property has many contracts
- `contractsRelations`: One contract belongs to one property, has many payments
- `paymentsRelations`: One payment belongs to one contract

**Business Rules (enforced at API level):**
- Cannot delete a property with linked contracts (409 Conflict)
- Cannot delete a contract with linked payments (409 Conflict)
- Cannot create a contract for a non-existent property (400 Bad Request)
- Cannot create a payment for a non-existent contract (400 Bad Request)

### Path Aliases
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets` → `./attached_assets/`

## External Dependencies

### Database
- PostgreSQL via `pg` driver (connection string in `DATABASE_URL` env var)
- Session storage: `connect-pg-simple`

### UI Components
- Full shadcn/ui component library (Radix UI primitives)
- Charts: Recharts
- Carousels: Embla Carousel
- Date handling: date-fns

### Build & Development
- Vite with React plugin
- Replit-specific plugins for error overlay, cartographer, and dev banner
- esbuild for server bundling with selective dependency externalization

### Testing
- **Framework**: Vitest with supertest for API integration tests
- **Location**: `tests/api.test.ts`
- **Run tests**: `npx vitest run` or `npx vitest` for watch mode
- **Coverage**: Properties, Contracts, Payments CRUD, Dashboard, Export, Referential Integrity

### PDF Generation
- **Library**: PDFKit for server-side PDF generation
- **Endpoint**: GET `/api/payments/:id/receipt` - generates rent receipt PDF
- **Location**: `server/pdf.ts`

### Email Notifications
- **Service**: Supports SendGrid and Resend (configurable via environment variables)
- **Endpoint**: POST `/api/payments/:id/notify` - sends payment reminder email
- **Location**: `server/email.ts`
- **Environment Variables**: `SENDGRID_API_KEY` or `RESEND_API_KEY`