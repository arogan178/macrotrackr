export interface AuthenticatedUser {
  userId?: number | null;
  id: string;
  clerkUserId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

export interface AuthenticatedContext {
  user: AuthenticatedUser;
  clerkUserId: string | null;
  internalUserId: number | null;
  correlationId: string;
  request: Request;
  set: {
    status?: number;
    headers?: Record<string, string>;
  };
}

export interface AuthenticatedContextWithDb extends AuthenticatedContext {
  db: import("bun:sqlite").Database;
}

export type RouteParams = Record<string, string>;

export type RouteQuery = Record<string, string | undefined>;

export interface RouteContext<
  TBody = unknown,
  TParams = RouteParams,
  TQuery = RouteQuery,
> extends AuthenticatedContext {
  body?: TBody;
  params?: TParams;
  query: TQuery;
}

export interface AuthenticatedRouteContext<
  TBody = unknown,
  TParams = RouteParams,
  TQuery = RouteQuery,
> extends AuthenticatedContextWithDb {
  body?: TBody;
  params?: TParams;
  query: TQuery;
}
