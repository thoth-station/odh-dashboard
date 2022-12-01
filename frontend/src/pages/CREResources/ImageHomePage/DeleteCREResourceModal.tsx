import React from 'react';
import { Button, Modal, ModalVariant } from '@patternfly/react-core';
import { deleteCREResource } from '../../../services/creServices';
import { CREDetails } from 'types';
import { deleteCREImage } from 'services/imagesService';

export type DeleteCREResourceModalProps = {
  isOpen: boolean;
  resource: CREDetails;
  onDeleteHandler: () => void;
  onCloseHandler: () => void;
};

export const DeleteCREResourceModal: React.FC<DeleteCREResourceModalProps> = ({
  isOpen,
  resource,
  onDeleteHandler,
  onCloseHandler,
}) => {
  const [loading, setLoading] = React.useState(false);

  return (
    <Modal
      variant={ModalVariant.medium}
      title="Delete notebook image"
      titleIconVariant="warning"
      isOpen={isOpen}
      onClose={onCloseHandler}
      actions={[
        <Button
          key="confirm"
          variant="danger"
          isLoading={loading}
          onClick={() => {
            setLoading(true);
            if (resource) {
              deleteCREResource(resource.resourceId).then(() => {
                if (resource.hasImage) {
                  deleteCREImage(resource).then(() => {
                    onDeleteHandler();
                    onCloseHandler();
                  });
                } else {
                  onDeleteHandler();
                  onCloseHandler();
                }
              });
            }
            setLoading(false);
          }}
        >
          Delete
        </Button>,
        <Button key="cancel" variant="link" onClick={onCloseHandler}>
          Cancel
        </Button>,
      ]}
    >
      Do you wish to permanently delete <b>{resource?.name}</b>?
    </Modal>
  );
};

export default DeleteCREResourceModal;
