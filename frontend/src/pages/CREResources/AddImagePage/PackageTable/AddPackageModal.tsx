import {
  Button,
  Form,
  FormGroup,
  Modal,
  ModalVariant,
  Select,
  SelectOption,
  SelectVariant,
  Split,
  SplitItem,
  TextInput,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import React from 'react';
import { CREPackage } from 'types';

type AddPackageModalType = {
  existingNames: string[];
  handleSave: (
    name: string,
    version: string,
    specifier: CREPackage['specifier'],
    key: string,
  ) => void;
  handleDelete: () => void;
  isOpen: boolean;
  handleToggle: () => void;
  canDelete: boolean;
  defaultName?: string;
  defaultVersion?: string;
  defaultSpecifier: CREPackage['specifier'];
};

export const AddPackageModal: React.FC<AddPackageModalType> = ({
  existingNames,
  handleSave,
  handleDelete,
  isOpen,
  handleToggle,
  canDelete = true,
  defaultName = '',
  defaultVersion = '',
  defaultSpecifier = '==',
}) => {
  const [name, setName] = React.useState(defaultName);
  const [specifier, setSpecifier] = React.useState(defaultSpecifier);
  const [version, setVersion] = React.useState(defaultVersion);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

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
    setSpecifier(defaultSpecifier);
  }, [isOpen, defaultName, defaultVersion, defaultSpecifier]);

  const clearInputs = () => {
    setName('');
    setVersion('');
    setSpecifier('==');
  };

  const editMode = defaultName !== '' && defaultVersion !== '';

  return (
    <Modal
      variant={ModalVariant.small}
      title={`${editMode ? 'Edit' : 'Add'} Package`}
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
                handleSave(name, version, specifier, defaultName);
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
          {canDelete && (
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
          )}
        </Split>
      }
    >
      <Form>
        <FormGroup
          label="Name"
          isRequired
          fieldId="cre-image-name-label"
          helperTextInvalid="Name already exists in the table."
          helperTextInvalidIcon={<ExclamationCircleIcon />}
          validated={
            !existingNames.includes(name.toLowerCase()) || defaultName === name
              ? undefined
              : 'error'
          }
        >
          <TextInput
            isDisabled={!canDelete}
            id="cre-image-name-input"
            isRequired
            type="text"
            data-id="cre-image-name-input"
            name="cre-image-name-input"
            value={name}
            onChange={(value) => {
              setName(value);
            }}
          />
        </FormGroup>
        <FormGroup label="Specifier" isRequired fieldId="cre-image-specifier-label">
          <Select
            selections={specifier}
            variant={SelectVariant.single}
            isOpen={dropdownOpen}
            onToggle={() => setDropdownOpen(!dropdownOpen)}
            onSelect={(e, newValue) => {
              const sp = newValue?.toString() as CREPackage['specifier'];
              if (sp) {
                setSpecifier(sp);
                setDropdownOpen(false);
              }
            }}
          >
            {['==', '>=', '<=', '<', '>', '~='].map((option) => (
              <SelectOption key={option} value={option} />
            ))}
          </Select>
        </FormGroup>
        <FormGroup
          label="Version"
          isRequired
          fieldId="cre-image-version-label"
          helperTextInvalid="This field is required."
          helperTextInvalidIcon={<ExclamationCircleIcon />}
        >
          <TextInput
            id="cre-image-version-input"
            isRequired
            type="text"
            data-id="cre-image-version-input"
            name="cre-image-version-input"
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
