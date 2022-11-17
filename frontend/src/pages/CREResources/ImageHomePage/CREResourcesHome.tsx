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
import ApplicationsPage from '../../ApplicationsPage';
import { useWatchCREResources } from '../../../utilities/useWatchCREResources';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { CREResourcesTable } from './CREResourcesTable';
import { useNavigate } from 'react-router-dom';

const description = `Import, delete, and modify notebook images.`;

const CREResourcesHome: React.FC = () => {
  const navigate = useNavigate();
  const { resources, loaded, loadError, forceUpdate } = useWatchCREResources();
  const isEmpty = !resources || resources.length === 0;

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
            navigate('add-new-resource');
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
            <CREResourcesTable resources={resources} forceUpdate={forceUpdate} />
          </PageSection>
        </div>
      ) : null}
    </ApplicationsPage>
  );
};

export default CREResourcesHome;
