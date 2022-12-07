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
  handleSave: (name: string, version?: string, specifier?: CREPackage['specifier']) => void;
  handleDelete: () => void;
  isOpen: boolean;
  handleToggle: () => void;
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
  defaultName,
  defaultVersion,
  defaultSpecifier,
}) => {
  const [name, setName] = React.useState(defaultName);
  const [specifier, setSpecifier] = React.useState<CREPackage['specifier']>(defaultSpecifier);
  const [version, setVersion] = React.useState(defaultVersion);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // TODO validation can be supported by Thoth API in the future
  const validated =
    name &&
    name !== '' &&
    (!existingNames.includes(name.toLowerCase()) || defaultName === name) &&
    !((!version && specifier) || (version && !specifier));

  React.useEffect(() => {
    setName(defaultName);
    setVersion(defaultVersion);
    setSpecifier(defaultSpecifier);
  }, [isOpen, defaultName, defaultVersion, defaultSpecifier]);

  const clearInputs = () => {
    setName(undefined);
    setVersion(undefined);
    setSpecifier(undefined);
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
                if (name) {
                  handleToggle();
                  handleSave(name, version, specifier);
                  clearInputs();
                }
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
          fieldId="cre-image-name-label"
          helperTextInvalid="Name already exists in the table."
          helperTextInvalidIcon={<ExclamationCircleIcon />}
          validated={
            (name && !existingNames.includes(name.toLowerCase())) || defaultName === name
              ? undefined
              : 'error'
          }
        >
          <TextInput
            id="cre-image-name-input"
            isRequired
            type="text"
            data-id="cre-image-name-input"
            name="cre-image-name-input"
            value={name ?? ''}
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
              setSpecifier(sp);
              setDropdownOpen(false);
            }}
          >
            {[
              <SelectOption key={0} value="" isPlaceholder />,
              ...['==', '>=', '<=', '<', '>', '~='].map((option) => (
                <SelectOption key={option} value={option} />
              )),
            ]}
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
            value={version ?? ''}
            onChange={(value) => {
              setVersion(value);
            }}
          />
        </FormGroup>
      </Form>
    </Modal>
  );
};
