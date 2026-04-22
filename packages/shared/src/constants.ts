// SYSTEM
export const API_V1_BASE_PATH = '/api/v1';
export const HEALTH_STATUS = ['healthy', 'degraded', 'unhealthy'] as const;

// MEDIA
export const MEDIA_TYPES = ['movie', 'show'] as const;
export const RELEASE_TYPES = ['cinema', 'digital', 'physical'] as const;
export const MOVIE_STATUS = ['tba', 'announced', 'inCinemas', 'released', 'deleted'] as const;
export const SHOW_STATUS = ['deleted', 'continuing', 'ended', 'upcoming', 'unknown'] as const;
export const SHOW_AVAILABILITY = ['unavailable', 'partial', 'available'] as const;
