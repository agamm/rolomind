# SQLite Database - Authentication & User Management

This directory contains the SQLite database implementation used for authentication and user management in Rolomind.

## Overview

- **Technology**: SQLite via [libSQL](https://github.com/libsql/libsql) and [Drizzle ORM](https://orm.drizzle.team/)
- **Purpose**: Authentication, sessions, and user account management
- **Storage**: Server-side database (local file or Turso for production)

## Architecture

```
sqlite/
├── index.ts      # Database connection and Drizzle configuration
├── schema.ts     # Database schema definitions
└── README.md     # This file
```

## Database Schema

### Tables

1. **user** - User accounts
   - `id`: Unique identifier
   - `email`: User email (unique)
   - `emailVerified`: Email verification status
   - `name`: User's display name
   - `image`: Profile image URL
   - `createdAt`: Account creation timestamp
   - `updatedAt`: Last update timestamp

2. **session** - Active user sessions
   - `id`: Session ID
   - `expiresAt`: Session expiration timestamp
   - `token`: Session token (unique)
   - `createdAt`: Session creation timestamp
   - `updatedAt`: Last update timestamp
   - `ipAddress`: Client IP address
   - `userAgent`: Client user agent
   - `userId`: Reference to user

3. **account** - OAuth/authentication provider accounts
   - `id`: Account ID
   - `accountId`: Provider account ID
   - `providerId`: Authentication provider
   - `userId`: Reference to user
   - `accessToken`: OAuth access token
   - `refreshToken`: OAuth refresh token
   - `idToken`: OAuth ID token
   - `accessTokenExpiresAt`: Token expiration
   - `refreshTokenExpiresAt`: Refresh token expiration
   - `scope`: OAuth scopes
   - `password`: Hashed password (for email/password auth)
   - `createdAt`: Account creation timestamp
   - `updatedAt`: Last update timestamp

4. **verification** - Email verification tokens
   - `id`: Verification ID
   - `identifier`: Email address
   - `value`: Verification token
   - `expiresAt`: Token expiration
   - `createdAt`: Token creation timestamp
   - `updatedAt`: Last update timestamp

## Configuration

### Local Development
```env
DATABASE_URL=file:local.db
DATABASE_AUTH_TOKEN=
```

### Production (Turso)
```env
DATABASE_URL=libsql://your-database.turso.io
DATABASE_AUTH_TOKEN=your-auth-token
```

## Usage

The database is accessed through Better Auth's Drizzle adapter:

```typescript
import { db } from '@/db/sqlite';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  // ... other config
});
```

## Migrations

Run database migrations:
```bash
npm run db:push
```

## Security Notes

- Passwords are hashed using Better Auth's built-in security
- Session tokens are securely generated
- Database file should be properly secured in production
- Use environment variables for sensitive configuration

## Separation of Concerns

This SQLite database is completely separate from the IndexedDB contact storage:
- **SQLite**: Server-side auth and user management
- **IndexedDB**: Client-side contact data (privacy-first)

This separation ensures:
- Contact data never touches the server
- Authentication can work across devices
- Clear security boundaries
- Independent scaling of auth vs. contact storage