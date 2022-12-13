import axios from 'axios';
import { CREDetails, CREResourceCreateRequest, ResponseStatus } from '../types';

export const fetchCREResources = (): Promise<CREDetails[]> => {
  const url = '/api/cre';
  return axios
    .get(url)
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw new Error(e.response.data.message);
    });
};

export const createCREResource = (image: CREResourceCreateRequest): Promise<ResponseStatus> => {
  const url = '/api/cre';
  return axios
    .post(url, image)
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw new Error(e.response.data.message);
    });
};

export const deleteCREResource = (id: string): Promise<ResponseStatus> => {
  const url = `/api/cre/${id}`;
  return axios
    .delete(url)
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw new Error(e.response.data.message);
    });
};
