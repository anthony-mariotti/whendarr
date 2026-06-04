import { config } from 'dotenv';
import { resolve } from 'path';

const isDevelopment = (process.env['NODE_ENV'] ?? 'development').toLowerCase() === 'development';

export const PROJECT_ROOT = resolve(process.cwd(), isDevelopment ? '../..' : '');

config({ path: resolve(PROJECT_ROOT, '.env'), quiet: !isDevelopment });
