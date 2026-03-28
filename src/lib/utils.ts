import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * URL-friendly naming rules:
 * - Convert all characters to lowercase
 * - Replace spaces with hyphens (-)
 * - Remove special characters such as &, ', ", ,, (, ), [, ], {, }, @, #, %, !, ?, :, ;
 * - Replace underscores (_) with hyphens
 * - Replace multiple spaces or separators with a single hyphen
 * - Remove duplicate hyphens
 * - Trim hyphens from the beginning and end
 * - Transliterate non-English characters to ASCII where possible
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD') // Transliterate non-English characters (accents)
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
    .toLowerCase()
    .replace(/[&'"\(\)\[\]\{\}@#%!\?:;,]/g, '') // Remove specific special characters
    .replace(/[\s_.]+/g, '-') // Replace spaces, underscores, and dots with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove any remaining non-alphanumeric characters (except hyphens)
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start and end
}

export function getFileParts(filename: string) {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return { name: filename, extension: '' };
  return {
    name: filename.substring(0, lastDotIndex),
    extension: filename.substring(lastDotIndex),
  };
}
