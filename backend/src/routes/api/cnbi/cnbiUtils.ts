import { IMAGE_ANNOTATIONS } from '../../../utils/constants';
import { convertLabelsToString } from '../../../utils/componentUtils';
import {
  KubeFastifyInstance,
  CNBICrd,
  CNBICrdCreateRequest,
  CNBIBuildSpec,
  CNBIImportSpec,
  CNBIExistingSpec
} from '../../../types';
import { FastifyRequest } from 'fastify';
import createError from 'http-errors';

export const postCNBI = async (
  fastify: KubeFastifyInstance,
  request: FastifyRequest,
): Promise<{ success: boolean; error: string }> => {
  const customObjectsApi = fastify.kube.customObjectsApi;
  const namespace = fastify.kube.namespace;
  const body = request.body as CNBICrdCreateRequest;
  const labels = {
    'app.kubernetes.io/created-by': 'cpe-_a-meteor.zone-CNBi-v0.1.0'
  };
  // const imageStreams = (await getCRDs(fastify, labels)) as ImageStream[];
  // const validName = imageStreams.filter((is) => is.metadata.name === body.name);

  // if (validName.length > 0) {
  //   fastify.log.error('Duplicate name unable to add CRD');
  //   return { success: false, error: 'Unable to add CRD: ' + body.name };
  // }


  let spec: CNBIImportSpec | CNBIExistingSpec | CNBIBuildSpec;
  switch(body.type) {
    case "import":
      if(!body.fromImage) {
        return { success: false, error: "Parameter 'fromImage' is expected when using type=import" };
      }

      spec = {
        buildType: "ImageImport",
        fromImage: body.fromImage,
      } as CNBIImportSpec

      if(body.imagePullSecretName) {
        spec["imagePullSecret"] = {
          name: body.imagePullSecretName
        }
      }
      break;

    case "existing":
      if(!body.baseImage) {
        return { success: false, error: "Parameter 'baseImage' is expected when using type=existing" };
      }

      spec = {
        buildType: "PackageList",
        baseImage: body.baseImage,
        packageVersions: body.packages.map(pkg => {
          if(pkg.version) {
            return `${pkg.name}==${pkg.version}`
          }
          else {
            return pkg.name
          }
        })
      } as CNBIExistingSpec
      break;

    case "build":
      let pkgs: string[] = []
      if(body.requirements) {
         pkgs = body.requirements.split('\n')
        pkgs.map(pkg => pkg.trim())
      }

      spec = {
        buildType: "PackageList",
        runtimeEnvironment: {
          osName: "ubi",
          osVersion: "8",
          pythonVersion: "3.8"
        },
        packageVersions: pkgs
      } as CNBIBuildSpec
      break;
  }

  const payload: CNBICrd = {
    kind: 'CustomNBImage',
    apiVersion: 'meteor.zone/v1alpha1',
    metadata: {
      annotations: {
        'opendatahub.io/notebook-image-desc': body.description ?? '',
        'opendatahub.io/notebook-image-name': body.name,
        'opendatahub.io/notebook-image-creator': body.creator,
      },
      name: `cnbi-${Date.now()}`,
      labels: labels,
    },
    spec: spec
  }
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
    console.log(e)

    if (e.response?.statusCode !== 404) {
      fastify.log.error('Unable to add CNBI custom resource: ' + e.toString());
      return { success: false, error: 'Unable to add CNBI custom resource: ' + e.message };
    }
  }
};

export const deleteCNBICrd = async (
  fastify: KubeFastifyInstance,
  request: FastifyRequest,
): Promise<{ success: boolean; error: string }> => {
  const customObjectsApi = fastify.kube.customObjectsApi;
  const namespace = fastify.kube.namespace;
  const params = request.params as { crd: string };

  try {
    await customObjectsApi
      .deleteNamespacedCustomObject(
        'image.openshift.io',
        'v1',
        namespace,
        'customnbimages',
        params.crd,
      )
      .catch((e) => {
        throw createError(e.statusCode, e?.body?.message);
      });
    return { success: true, error: null };
  } catch (e) {
    if (e.response?.statusCode !== 404) {
      fastify.log.error('Unable to delete cnbi crd: ' + e.toString());
      return { success: false, error: 'Unable to delete cnbi crd: ' + e.message };
    }
  }
};

