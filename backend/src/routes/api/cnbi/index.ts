import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ImageType } from '../../../types';
import { postCNBI, deleteCNBICrd } from './cnbiUtils';
import { secureAdminRoute, secureRoute } from '../../../utils/route-security';

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.delete(
    '/:crd',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      return deleteCNBICrd(fastify, request)
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
};
