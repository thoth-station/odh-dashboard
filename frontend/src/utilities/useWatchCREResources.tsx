import * as React from 'react';
import { fetchCREResources } from '../services/creServices';
import { CREDetails } from '../types';
import { POLL_INTERVAL } from './const';

export const useWatchCREResources = (): {
  resources: CREDetails[];
  loaded: boolean;
  loadError: Error | undefined;
  forceUpdate: () => void;
} => {
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<Error>();
  const [resources, setResources] = React.useState<CREDetails[]>([]);
  const forceUpdate = () => {
    setLoaded(false);
    fetchCREResources()
      .then((data: CREDetails[]) => {
        setLoaded(true);
        setLoadError(undefined);
        setResources(data);
      })
      .catch((e) => {
        setLoadError(e);
      });
  };

  React.useEffect(() => {
    let watchHandle;
    let cancelled = false;
    const watchImages = () => {
      fetchCREResources()
        .then((data: CREDetails[]) => {
          if (cancelled) {
            return;
          }
          setLoaded(true);
          setLoadError(undefined);
          setResources(data);
        })
        .catch((e) => {
          if (cancelled) {
            return;
          }
          setLoadError(e);
        });
      watchHandle = setTimeout(watchImages, POLL_INTERVAL);
    };
    watchImages();

    return () => {
      if (watchHandle) {
        cancelled = true;
        clearTimeout(watchHandle);
      }
    };
    // Don't update when components are updated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { resources: resources || [], loaded, loadError, forceUpdate };
};
