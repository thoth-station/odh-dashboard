import axios from 'axios';
import { CREDetails, CREImageStreamUpdateRequest, ImageInfo, ResponseStatus } from '../types';

export const fetchImages = (): Promise<ImageInfo[]> => {
  const url = `/api/images/jupyter`;
  return axios
    .get(url)
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw new Error(e.response.data.message);
    });
};

export const deleteCREImage = (image: CREDetails): Promise<ResponseStatus> => {
  const url = `/api/images/${image.id}`;
  return axios
    .delete(url)
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw new Error(e.response.data.message);
    });
};

export const updateCREImage = (image: CREImageStreamUpdateRequest): Promise<ResponseStatus> => {
  const url = `/api/images/${image.id}`;
  return axios
    .put(url, image)
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw new Error(e.response.data.message);
    });
};
