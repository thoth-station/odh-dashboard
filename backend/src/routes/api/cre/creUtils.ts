import {
  CREImageStreamDetails,
  CREDetails,
  CREImageImportSpec,
  CREPackageListSpec,
  CREResource,
  CREResourceCreateRequest,
  KubeFastifyInstance,
} from '../../../types';
import { FastifyRequest } from 'fastify';
import { getImageList } from '../images/imageUtils';
import { CRE_ANNOTATIONS } from '../../../utils/constants';
import createError from 'http-errors';

export const getCREResourceList = async (fastify: KubeFastifyInstance): Promise<CREDetails[]> => {
  const CREResourceList = await Promise.resolve(getCREResources(fastify));
  const CREImageStreams = (await Promise.resolve(
    getImageList(fastify, { 'app.kubernetes.io/created-by': 'cpe-_a-meteor.zone-CNBi-v0.1.0' }),
  )) as CREImageStreamDetails[];
  const imageInfoList = CREResourceList.map((resource) => {
    const matchingImageStream = CREImageStreams.find(
      (image) => image.id === resource.metadata.name,
    );
    return processCREResourceInfo(resource, matchingImageStream);
  });
  return imageInfoList;
};

const getCREResources = async (fastify: KubeFastifyInstance): Promise<CREResource[]> => {
  const requestPromise = fastify.kube.customObjectsApi
    .listNamespacedCustomObject('meteor.zone', 'v1alpha1', fastify.kube.namespace, 'customnbimages')
    .then((res) => {
      const list = (
        res?.body as {
          items: CREResource[];
        }
      ).items;
      return list;
    })
    .catch((e) => {
      fastify.log.error(e);
      return [];
    });
  return await requestPromise;
};

export const processCREResourceInfo = (
  resource: CREResource,
  image?: CREImageStreamDetails,
): CREDetails => {
  const resourceInfo: CREDetails = {
    id: resource.metadata.name,
    hasImage: image !== undefined,
    name: image?.name ?? resource.metadata.annotations[CRE_ANNOTATIONS.NAME],
    description: image?.description ?? resource.metadata.annotations[CRE_ANNOTATIONS.DESC],
    user: image?.user ?? resource.metadata.annotations[CRE_ANNOTATIONS.CREATOR],
    phase: image?.phase,
    error: image?.error,
    // TODO Is the array desc or asc?
    lastCondition:
      resource?.status?.conditions?.length > 0 ? resource.status.conditions[0] : undefined,
    uploaded: resource.metadata?.creationTimestamp,
    visible: image?.visible,
    labels: image?.labels,
    url: image?.url,
  };

  return resourceInfo;
};

export const postCNBI = async (
  fastify: KubeFastifyInstance,
  request: FastifyRequest,
): Promise<{ success: boolean; error: string }> => {
  const customObjectsApi = fastify.kube.customObjectsApi;
  const namespace = fastify.kube.namespace;
  const body = request.body as CREResourceCreateRequest;
  const resources = (await getCREResources(fastify)) as CREResource[];
  const validName = resources.filter((cre) => cre.metadata.name === body.name);

  if (validName.length > 0) {
    fastify.log.error('Duplicate name unable to add CRE resource');
    return { success: false, error: 'Unable to add CRE resource: ' + body.name };
  }

  let spec: CREPackageListSpec | CREImageImportSpec;

  if (body.buildType === 'ImageImport') {
    if (!body.fromImage) {
      return {
        success: false,
        error: "Parameter 'fromImage' is expected when using buildType: 'ImageImport'",
      };
    }

    spec = {
      buildType: 'ImageImport',
      fromImage: body.fromImage,
    } as CREImageImportSpec;

    if (body.imagePullSecretName) {
      spec['imagePullSecret'] = {
        name: body.imagePullSecretName,
      };
    }
  } else if (body.buildType === 'PackageList') {
    if (body.baseImage) {
      spec = {
        buildType: 'PackageList',
        baseImage: body.baseImage,
        packageVersions: body.packageVersions,
      } as CREPackageListSpec;
    } else if (
      body?.runtimeEnvironment?.osName &&
      body?.runtimeEnvironment?.osVersion &&
      body?.runtimeEnvironment?.pythonVersion
    ) {
      spec = {
        buildType: 'PackageList',
        runtimeEnvironment: {
          osName: body.runtimeEnvironment.osName,
          osVersion: body.runtimeEnvironment.osVersion,
          pythonVersion: body.runtimeEnvironment.pythonVersion,
        },
        packageVersions: body.packageVersions,
      } as CREPackageListSpec;
    } else {
      return {
        success: false,
        error:
          "Parameter 'runtimeEnvironment' or 'baseImage' is expected when using buildType: 'PackageList'",
      };
    }
  }

  const payload: CREResource = {
    kind: 'CustomNBImage',
    apiVersion: 'meteor.zone/v1alpha1',
    metadata: {
      annotations: {
        'opendatahub.io/notebook-image-desc': body.description ?? '',
        'opendatahub.io/notebook-image-name': body.name,
        'opendatahub.io/notebook-image-creator': body.user,
      },
      name: `cre-${Date.now()}`,
      labels: {
        'app.kubernetes.io/created-by': 'cpe-_a-meteor.zone-CNBi-v0.1.0',
      },
    },
    spec: spec,
  };
  try {
    await customObjectsApi.createNamespacedCustomObject(
      'meteor.zone',
      'v1alpha1',
      namespace,
      'customnbimages',
      payload,
    );

    return { success: true, error: null };
  } catch (e) {
    if (e.response?.statusCode !== 404) {
      fastify.log.error('Unable to add CRE resource: ' + e.toString());
      return { success: false, error: 'Unable to add CRE resource: ' + e.message };
    }
  }
};

export const deleteCRE = async (
  fastify: KubeFastifyInstance,
  request: FastifyRequest,
): Promise<{ success: boolean; error: string }> => {
  const customObjectsApi = fastify.kube.customObjectsApi;
  const namespace = fastify.kube.namespace;
  const params = request.params as { id: string };

  try {
    await customObjectsApi
      .deleteNamespacedCustomObject(
        'meteor.zone',
        'v1alpha1',
        namespace,
        'customnbimages',
        params.id,
      )
      .catch((e) => {
        throw createError(e.statusCode, e?.body?.message);
      });
    return { success: true, error: null };
  } catch (e) {
    if (e.response?.statusCode !== 404) {
      fastify.log.error('Unable to delete CRE resource: ' + e.toString());
      return { success: false, error: 'Unable to delete CRE resource: ' + e.message };
    }
  }
};
