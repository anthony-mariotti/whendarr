/**
 * Get the clients IANA timezone.
 * Works in both browser and React Native environments.
 *
 * @returns IANA timezone string (e.g., `America/New_York`) or `UTC` as fallback
 */
export function getClientTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Validate IANA timezone.
 *
 * @param tz Timezone string to validate against
 * @returns true if tz is a valid IANA timezone, otherwise false
 */
export function validateTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
