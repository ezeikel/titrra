import type { DefaultSession } from 'next-auth';

// Expose the DB User.id on the session (set in auth.ts session callback), so
// server/client code reads the identity without a second DB roundtrip.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
