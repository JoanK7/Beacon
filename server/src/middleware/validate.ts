import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';
import { badRequest } from '../utils/http-error';
import type { ValidSource } from '../types';

/**
 * Validate and coerce `req[source]` against a zod schema. On success the parsed
 * value is stored on req.valid, so handlers only ever see clean data.
 */
export function validate(schema: z.ZodType, source: ValidSource = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      return next(badRequest('Some fields need attention.', details));
    }
    // Express 5 exposes req.query as a getter, so store parsed values separately.
    req.valid = { ...(req.valid || {}), [source]: result.data };
    return next();
  };
}

/** Read validated data with the exact type the schema produces. */
export function getValid<S extends z.ZodType>(req: Request, _schema: S, source: ValidSource = 'body'): z.output<S> {
  return req.valid?.[source] as z.output<S>;
}
