import { z } from 'zod';
import { validateTimezone } from './functions.js';

export const timezoneSchema = z
  .string()
  .min(1)
  .max(100)
  .refine(validateTimezone, { message: 'Invalid IANA timezone identifier' })
  .optional();

export const calendarQuerySchema = z.object({
  month: z.iso.date().optional(),
  tz: timezoneSchema
});

export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
