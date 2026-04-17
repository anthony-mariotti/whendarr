import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fastify from 'fastify';

import * as vInfo from '../../src/utils/version.js';

vi.mock('../../src/utils/version.js');

import { registerVersionRoute } from '../../src/routes/version.js';

describe('GET /api/v1/version', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function buildApp() {
    const app = fastify();
    await registerVersionRoute(app);
    return app;
  }

  it('returns version info correctly', async () => {
    vi.spyOn(vInfo, 'getCurrentVersion').mockReturnValue('1.2.3');
    vi.spyOn(vInfo, 'getCurrentTag').mockReturnValue('v1.2.3');
    vi.spyOn(vInfo, 'getCurrentCommit').mockReturnValue('abc123');
    vi.spyOn(vInfo, 'getCurrentBuildDate').mockReturnValue('2026-01-01T00:00:00.000Z');

    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/version'
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body).toEqual({
      current: {
        version: '1.2.3',
        tag: 'v1.2.3',
        commit: 'abc123',
        date: '2026-01-01T00:00:00.000Z',
        edge: false
      }
    });
  });
});
