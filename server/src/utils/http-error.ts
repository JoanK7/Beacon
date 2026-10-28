export interface FieldIssue {
  field: string;
  message: string;
}

/** An error that maps directly to an HTTP response. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: FieldIssue[],
  ) {
    super(message);
  }
}

export const badRequest = (msg: string, details?: FieldIssue[]) => new HttpError(400, msg, details);
export const unauthorized = (msg = 'Please sign in to continue.') => new HttpError(401, msg);
export const forbidden = (msg = 'You do not have access to this resource.') => new HttpError(403, msg);
export const notFound = (msg = 'Not found.') => new HttpError(404, msg);
export const conflict = (msg: string) => new HttpError(409, msg);
