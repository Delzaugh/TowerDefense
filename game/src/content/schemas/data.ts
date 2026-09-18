import { z } from 'zod';

export type ReadonlyData<T> = T extends readonly (infer U)[]
  ? readonly ReadonlyData<U>[]
  : T extends object ? { readonly [K in keyof T]: ReadonlyData<T[K]> } : T;

export function freezeData<T>(value: T): ReadonlyData<T> {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freezeData(child);
    Object.freeze(value);
  }
  return value as ReadonlyData<T>;
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`).join(',')}}`;
  }
  const encoded = JSON.stringify(value);
  if (encoded === undefined || (typeof value === 'number' && !Number.isFinite(value))) {
    throw new Error('Only finite JSON data can be canonicalized.');
  }
  return encoded;
}

export type ValidationIssue = { code: string; path: string; message: string };
export class ValidationError extends Error {
  constructor(readonly issues: readonly ValidationIssue[]) {
    super(issues.map(issue => `${issue.path || '$'}: ${issue.message}`).join('\n'));
    this.name = 'ValidationError';
  }
}

export function parseData<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationError(result.error.issues.map(issue => ({
      code: issue.code, path: issue.path.map(String).join('.'), message: issue.message,
    })));
  }
  return result.data;
}

export const identifierSchema = z.string().regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/).max(80);
export const versionSchema = z.string().regex(/^v\d{2,}$/).max(12);
export const counterSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1);
