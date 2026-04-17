import {
  getCurrentBuildDate,
  getCurrentCommit,
  getCurrentTag,
  getCurrentVersion
} from '@/utils/version.js';
import type { VesrionInfo } from '@whendarr/shared';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

export async function registerVersionRoute(instance: FastifyInstance) {
  await instance.register(versionV1, { prefix: '/api/v1/version' });
}

const versionV1: FastifyPluginAsync = async (instance: FastifyInstance) => {
  instance.get<{ Reply: VesrionInfo }>('/', async () => {
    const currentVersion = getCurrentVersion();
    const currentTag = getCurrentTag();
    const currentCommit = getCurrentCommit();
    const currentBuildDate = getCurrentBuildDate();

    // TODO: Fetch Current Version Data and Cache

    return {
      current: {
        version: currentVersion,
        tag: currentTag,
        commit: currentCommit,
        date: currentBuildDate,
        edge: currentVersion.includes('-')
      }
    } as VesrionInfo;
  });
};
