function determineBasePath(): string {
  const base = document.querySelector('base');
  if (base) {
    return new URL(base.href).pathname.replace(/\/+$/, '');
  }
  return import.meta.env.BASE_URL.replace(/\/+$/, '');
}

export const BASE_PATH = determineBasePath();
export const BASE_URL = BASE_PATH ? BASE_PATH : '/';
