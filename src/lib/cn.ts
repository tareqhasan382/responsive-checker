export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | { readonly [key: string]: boolean | null | undefined };

/**
 * Minimal, dependency-free class name composer.
 * Flattens strings, arrays and conditional objects into a single string.
 */
export function cn(...inputs: readonly ClassValue[]): string {
  const out: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      out.push(String(input));
      continue;
    }

    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) out.push(nested);
      continue;
    }

    for (const [key, enabled] of Object.entries(input)) {
      if (enabled) out.push(key);
    }
  }

  return out.join(' ');
}
