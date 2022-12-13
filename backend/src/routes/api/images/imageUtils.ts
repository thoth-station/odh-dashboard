import { IMAGE_ANNOTATIONS } from '../../../utils/constants';
import { convertLabelsToString } from '../../../utils/componentUtils';
import {
  ImageStreamTag,
  ImageTagInfo,
  ImageInfo,
  ImageStream,
  TagContent,
  KubeFastifyInstance,
  CREImageStreamDetails,
  CREPackageAnnotation,
  CREImageStreamPhase,
  CREImageStreamUpdateRequest,
} from '../../../types';
import { FastifyRequest } from 'fastify';
import createError from 'http-errors';

export const getImageList = async (
  fastify: KubeFastifyInstance,
  labels: { [key: string]: string },
): Promise<CREImageStreamDetails[] | ImageInfo[]> => {
  const imageStreamList = await Promise.resolve(getImageStreams(fastify, labels));
  // Return CRE structured response if CRE label is included
  if (labels['app.kubernetes.io/part-of'] === 'meteor-operator') {
    const CREImageList: CREImageStreamDetails[] = [
      ...imageStreamList.map((is) => mapImageStreamToCREImage(is)),
    ];
    return CREImageList;
  }
  // Return ImageInfo structure if request does not have CRE label
  else {
    const imageInfoList = imageStreamList.map((imageStream) => {
      return processImageInfo(imageStream);
    });
    return imageInfoList;
  }
};

const getImage = async (fastify: KubeFastifyInstance, imageName: string): Promise<ImageStream> => {
  return fastify.kube.customObjectsApi
    .getNamespacedCustomObject(
      'image.openshift.io',
      'v1',
      fastify.kube.namespace,
      'imagestreams',
      imageName,
    )
    .then((res) => {
      return res.body as ImageStream;
    });
};

export const getImageInfo = async (
  fastify: KubeFastifyInstance,
  imageName: string,
): Promise<ImageInfo> => {
  return getImage(fastify, imageName).then((res) => {
    return processImageInfo(res);
  });
};

const getImageStreams = async (
  fastify: KubeFastifyInstance,
  labels: { [key: string]: string },
): Promise<ImageStream[]> => {
  const labelString = convertLabelsToString(labels);
  const requestPromise = fastify.kube.customObjectsApi
    .listNamespacedCustomObject(
      'image.openshift.io',
      'v1',
      fastify.kube.namespace,
      'imagestreams',
      undefined,
      undefined,
      undefined,
      labelString,
    )
    .then((res) => {
      const list = (
        res?.body as {
          items: ImageStream[];
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

export const processImageInfo = (imageStream: ImageStream): ImageInfo => {
  const annotations = imageStream.metadata.annotations;

  const imageInfo: ImageInfo = {
    name: imageStream.metadata.name,
    description: annotations[IMAGE_ANNOTATIONS.DESC] || '',
    url: annotations[IMAGE_ANNOTATIONS.URL] || '',
    display_name: annotations[IMAGE_ANNOTATIONS.DISP_NAME] || imageStream.metadata.name,
    tags: getTagInfo(imageStream),
    order: +annotations[IMAGE_ANNOTATIONS.IMAGE_ORDER] || 100,
    dockerImageRepo: imageStream.status?.dockerImageRepository || '',
    labels: imageStream.metadata.labels,
  };

  return imageInfo;
};

// Check for existence in status.tags
const checkTagExistence = (tag: ImageStreamTag, imageStream: ImageStream): boolean => {
  if (imageStream.status) {
    const tags = imageStream.status.tags;
    if (tags) {
      for (let i = 0; i < tags.length; i++) {
        if (tags[i].tag === tag.name) {
          return true;
        }
      }
    }
  }
  return false;
};

const getTagInfo = (imageStream: ImageStream): ImageTagInfo[] => {
  const tagInfoArray: ImageTagInfo[] = [];
  const tags = imageStream.spec.tags;
  if (!tags?.length) {
    console.error(`${imageStream.metadata.name} does not have any tags.`);
    return;
  }
  tags.forEach((tag) => {
    let tagAnnotations;
    if (tag.annotations != null) {
      tagAnnotations = tag.annotations;
    } else {
      tag.annotations = {};
      tagAnnotations = {};
    }
    if (!checkTagExistence(tag, imageStream)) {
      return; //Skip tag
    }

    const tagInfo: ImageTagInfo = {
      content: getTagContent(tag),
      name: tag.name,
      recommended: JSON.parse(tagAnnotations[IMAGE_ANNOTATIONS.RECOMMENDED] || 'false'),
      default: JSON.parse(tagAnnotations[IMAGE_ANNOTATIONS.DEFAULT] || 'false'),
      annotations: tagAnnotations,
    };
    tagInfoArray.push(tagInfo);
  });
  return tagInfoArray;
};

const getTagContent = (tag: ImageStreamTag): TagContent => {
  const content: TagContent = {
    software: JSON.parse(tag.annotations[IMAGE_ANNOTATIONS.SOFTWARE] || '[]'),
    dependencies: JSON.parse(tag.annotations[IMAGE_ANNOTATIONS.DEPENDENCIES] || '[]'),
  };
  return content;
};

const mapImageStreamToCREImage = (is: ImageStream): CREImageStreamDetails => ({
  id: is.metadata.name,
  name: is.metadata.annotations['opendatahub.io/notebook-image-name'],
  description: is.metadata.annotations['opendatahub.io/notebook-image-desc'],
  phase: is.metadata.annotations['opendatahub.io/notebook-image-phase'] as CREImageStreamPhase,
  visible: is.metadata.labels['opendatahub.io/notebook-image'] === 'true',
  error: is.metadata.annotations['opendatahub.io/notebook-image-messages']
    ? JSON.parse(is.metadata.annotations['opendatahub.io/notebook-image-messages'])
    : [],
  packageAnnotations:
    is.spec.tags &&
    (JSON.parse(
      is.spec.tags[0].annotations['opendatahub.io/notebook-python-dependencies'],
    ) as CREPackageAnnotation[]),
  softwareAnnotations:
    is.spec.tags &&
    (JSON.parse(
      is.spec.tags[0].annotations['opendatahub.io/notebook-software'],
    ) as CREPackageAnnotation[]),
  uploaded: is.metadata.creationTimestamp,
  url: is.metadata.annotations['opendatahub.io/notebook-image-url'],
  user: is.metadata.annotations['opendatahub.io/notebook-image-creator'],
  labels: is.metadata.labels,
});

export const deleteImage = async (
  fastify: KubeFastifyInstance,
  request: FastifyRequest,
): Promise<{ success: boolean; error: string }> => {
  const customObjectsApi = fastify.kube.customObjectsApi;
  const namespace = fastify.kube.namespace;
  const params = request.params as { image: string };

  try {
    await customObjectsApi
      .deleteNamespacedCustomObject(
        'image.openshift.io',
        'v1',
        namespace,
        'imagestreams',
        params.image,
      )
      .catch((e) => {
        throw createError(e.statusCode, e?.body?.message);
      });
    return { success: true, error: null };
  } catch (e) {
    if (e.response?.statusCode !== 404) {
      fastify.log.error('Unable to delete notebook image: ' + e.toString());
      return { success: false, error: 'Unable to delete notebook image: ' + e.message };
    }
  }
};

export const updateImage = async (
  fastify: KubeFastifyInstance,
  request: FastifyRequest,
): Promise<{ success: boolean; error: string }> => {
  const customObjectsApi = fastify.kube.customObjectsApi;
  const namespace = fastify.kube.namespace;
  const params = request.params as { image: string };
  const body = request.body as CREImageStreamUpdateRequest;
  const labels = {
    'app.kubernetes.io/created-by': 'cre',
    'opendatahub.io/notebook-image': 'true',
  };

  const imageStreams = await getImageStreams(fastify, labels);
  const validName = imageStreams.filter(
    (is) =>
      is.metadata.annotations['opendatahub.io/notebook-image-name'] === body.name &&
      is.metadata.name !== body.id,
  );

  if (validName.length > 0) {
    fastify.log.error('Duplicate name unable to add notebook image');
    return { success: false, error: 'Unable to add notebook image: ' + body.name };
  }

  try {
    const imageStream = await customObjectsApi
      .getNamespacedCustomObject(
        'image.openshift.io',
        'v1',
        namespace,
        'imagestreams',
        params.image,
      )
      .then((r) => r.body as ImageStream)
      .catch((e) => {
        throw createError(e.statusCode, e?.body?.message);
      });

    if (body.packageAnnotations && imageStream.spec.tags) {
      imageStream.spec.tags[0].annotations['opendatahub.io/notebook-python-dependencies'] =
        JSON.stringify(body.packageAnnotations);
    }

    if (body.softwareAnnotations && imageStream.spec.tags) {
      imageStream.spec.tags[0].annotations['opendatahub.io/notebook-software'] = JSON.stringify(
        body.softwareAnnotations,
      );
    }

    if (typeof body.visible !== undefined) {
      if (body.visible) {
        imageStream.metadata.labels['opendatahub.io/notebook-image'] = 'true';
      } else {
        imageStream.metadata.labels['opendatahub.io/notebook-image'] = 'false';
      }
    }
    if (body.name) {
      imageStream.metadata.annotations['opendatahub.io/notebook-image-name'] = body.name;
    }

    if (body.description !== undefined) {
      imageStream.metadata.annotations['opendatahub.io/notebook-image-desc'] = body.description;
    }

    await customObjectsApi
      .patchNamespacedCustomObject(
        'image.openshift.io',
        'v1',
        namespace,
        'imagestreams',
        params.image,
        imageStream,
        undefined,
        undefined,
        undefined,
        {
          headers: { 'Content-Type': 'application/merge-patch+json' },
        },
      )
      .catch((e) => console.error(e));

    return { success: true, error: null };
  } catch (e) {
    if (e.response?.statusCode !== 404) {
      fastify.log.error('Unable to update notebook image: ' + e.toString());
      return { success: false, error: 'Unable to update notebook image: ' + e.message };
    }
  }
};
