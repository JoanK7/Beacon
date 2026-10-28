// Shared server-side types.

export type Role = 'peer' | 'admin' | 'coordinator';

/** The user shape exposed to the client and attached to authenticated requests. */
export interface PublicUser {
  id: number;
  username: string;
  role: Role;
  university: string;
  createdAt: Date;
}

export type ValidSource = 'body' | 'query' | 'params';

// Teach Express about the properties our middleware adds to each request.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: PublicUser;
      sessionToken?: string;
      valid?: Partial<Record<ValidSource, unknown>>;
    }
  }
}
