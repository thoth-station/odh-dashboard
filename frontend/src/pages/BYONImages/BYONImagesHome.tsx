import * as React from 'react';
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  EmptyStateBody,
  PageSection,
  PageSectionVariants,
  Title,
} from '@patternfly/react-core';
import ApplicationsPage from '../ApplicationsPage';
import { useWatchBYONImages } from '../../utilities/useWatchBYONImages';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { BYONImagesTable } from './BYONImagesTable';
import { useNavigate } from 'react-router-dom';

const description = `Import, delete, and modify notebook images.`;

const BYONImagesHome: React.FC = () => {
  const navigate = useNavigate();
  const { images, loaded, loadError, forceUpdate } = useWatchBYONImages();
  const isEmpty = !images || images.length === 0;

  const noImagesPageSection = (
    <PageSection isFilled>
      <EmptyState variant={EmptyStateVariant.full} data-id="empty-empty-state">
        <EmptyStateIcon icon={PlusCircleIcon} />
        <Title headingLevel="h5" size="lg">
          No custom notebook images found.
        </Title>
        <EmptyStateBody>To get started import a custom notebook image.</EmptyStateBody>
        <Button
          data-id="display-image-modal-button"
          variant={ButtonVariant.primary}
          onClick={() => {
            navigate('add-new-image');
          }}
        >
          Add new image
        </Button>
      </EmptyState>
    </PageSection>
  );

  return (
    <ApplicationsPage
      title="Notebook image settings"
      description={description}
      loaded={loaded}
      empty={isEmpty}
      loadError={loadError}
      errorMessage="Unable to load notebook images."
      emptyStatePage={noImagesPageSection}
    >
      {!isEmpty ? (
        <div className="odh-cluster-settings">
          <PageSection variant={PageSectionVariants.light} padding={{ default: 'noPadding' }}>
            <BYONImagesTable images={images} forceUpdate={forceUpdate} />
          </PageSection>
        </div>
      ) : null}
    </ApplicationsPage>
  );
};

export default BYONImagesHome;
