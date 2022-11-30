import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ImageType } from '../../../types';
import { deleteImage, getImageList, updateImage } from './imageUtils';
import { secureAdminRoute, secureRoute } from '../../../utils/route-security';

export default async (fastify: FastifyInstance): Promise<void> => {
    fastify.get(
        '/:type',
        secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
            let labels = {};
            const params = request.params as { type: ImageType };
            if (params.type === 'cre') {
                labels = {
                    'app.kubernetes.io/part-of': 'meteor-operator',
                };
            } else {
                labels = {
                    'opendatahub.io/notebook-image': 'true',
                };
            }
            return getImageList(fastify, labels)
                .then((res) => {
                    return res;
                })
                .catch((res) => {
                    reply.send(res);
                });
        }),
    );

    fastify.delete(
        '/:image',
        secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
            return deleteImage(fastify, request)
                .then((res) => {
                    return res;
                })
                .catch((res) => {
                    reply.send(res);
                });
        }),
    );

    fastify.put(
        '/:image',
        secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
            return updateImage(fastify, request)
                .then((res) => {
                    return res;
                })
                .catch((res) => {
                    reply.send(res);
                });
        }),
    );
};
