import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ImageType } from '../../../types';

import { deleteCRE, getCREResourceList, postCNBI } from './creUtils';
import { secureAdminRoute, secureRoute } from '../../../utils/route-security';

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.get(
    '/',
    secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      return getCREResourceList(fastify)
        .then((res) => {
          return res;
        })
        .catch((res) => {
          reply.send(res);
        });
    }),
  );

  fastify.post(
    '/',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      return postCNBI(fastify, request)
        .then((res) => {
          return res;
        })
        .catch((res) => {
          reply.send(res);
        });
    }),
  );

  fastify.delete(
    '/:id',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      return deleteCRE(fastify, request)
        .then((res) => {
          return res;
        })
        .catch((res) => {
          reply.send(res);
        });
    }),
  );
};
