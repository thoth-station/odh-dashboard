import {
  Button,
  Form,
  FormGroup,
  Modal,
  ModalVariant,
  Split,
  SplitItem,
  TextInput,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import React from 'react';

type AddComponentModalType = {
  existingNames: string[];
  handleSave: (name: string, version: string, key: string) => void;
  handleDelete: () => void;
  label: 'software' | 'packages';
  isOpen: boolean;
  handleToggle: () => void;
  defaultName?: string;
  defaultVersion?: string;
};

export const AddComponentModal: React.FC<AddComponentModalType> = ({
  existingNames,
  handleSave,
  handleDelete,
  label,
  isOpen,
  handleToggle,
  defaultName = '',
  defaultVersion = '',
}) => {
  const [name, setName] = React.useState('');
  const [version, setVersion] = React.useState('');

  // TODO validation can be supported by Thoth API in the future
  const validated =
    name &&
    name !== '' &&
    (!existingNames.includes(name.toLowerCase()) || defaultName === name) &&
    version &&
    version !== '';

  React.useEffect(() => {
    setName(defaultName);
    setVersion(defaultVersion);
  }, [isOpen, defaultName, defaultVersion]);

  const clearInputs = () => {
    setName('');
    setVersion('');
  };

  const editMode = defaultName !== '' && defaultVersion !== '';

  return (
    <Modal
      variant={ModalVariant.small}
      title={`${editMode ? 'Edit' : 'Add'} ${label === 'packages' ? 'Package' : 'Software'}`}
      isOpen={isOpen}
      onClose={handleToggle}
      footer={
        <Split hasGutter style={{ width: '100%' }}>
          <SplitItem>
            <Button
              isDisabled={!validated}
              key="confirm"
              variant="primary"
              onClick={() => {
                handleToggle();
                handleSave(name, version, defaultName);
                clearInputs();
              }}
            >
              {editMode ? 'Save' : 'Add'}
            </Button>
          </SplitItem>
          <SplitItem isFilled>
            <Button
              key="cancel"
              variant="link"
              onClick={() => {
                clearInputs();
                handleToggle();
              }}
            >
              Cancel
            </Button>
          </SplitItem>
          <SplitItem>
            {editMode ? (
              <Button
                style={{ textAlign: 'right' }}
                key="delete"
                variant="danger"
                onClick={handleDelete}
              >
                Delete
              </Button>
            ) : undefined}
          </SplitItem>
        </Split>
      }
    >
      <Form>
        <FormGroup
          label="Name"
          isRequired
          fieldId="byon-image-name-label"
          helperTextInvalid="Name already exists in the table."
          helperTextInvalidIcon={<ExclamationCircleIcon />}
          validated={
            !existingNames.includes(name.toLowerCase()) || defaultName === name
              ? undefined
              : 'error'
          }
        >
          <TextInput
            id="byon-image-name-input"
            isRequired
            type="text"
            data-id="byon-image-name-input"
            name="byon-image-name-input"
            value={name}
            onChange={(value) => {
              setName(value);
            }}
          />
        </FormGroup>
        <FormGroup
          label="Version"
          isRequired
          fieldId="byon-image-version-label"
          helperTextInvalid="This field is required."
          helperTextInvalidIcon={<ExclamationCircleIcon />}
        >
          <TextInput
            id="byon-image-version-input"
            isRequired
            type="text"
            data-id="byon-image-version-input"
            name="byon-image-version-input"
            value={version}
            onChange={(value) => {
              setVersion(value);
            }}
          />
        </FormGroup>
      </Form>
    </Modal>
  );
};
