import React from 'react';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  FormGroup,
  TextInput,
  Title,
  Tabs,
  Tab,
  TabTitleText,
} from '@patternfly/react-core';
import { Caption, TableComposable, Tbody, Thead, Th, Tr } from '@patternfly/react-table';
import { BYONImagePackage } from 'types';
import { EditStepTableRow } from './EditStepTableRow';
import { CubesIcon, ExclamationCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import './ImportImageForm.scss';

interface IImportImageModal {
  state: {
    repository: string;
    name: string;
    description: string;
    software: BYONImagePackage[];
    packages: BYONImagePackage[];
  };
  valid: {
    name: boolean;
    repository: boolean;
  };
  setValue: (key: string, value: unknown) => void;
}

export const ImportImageForm: React.FC<IImportImageModal> = ({ state, valid, setValue }) => {
  const [activeTabKey, setActiveTabKey] = React.useState<number>(0);

  return (
    <React.Fragment>
      <FormGroup
        label="Repository"
        isRequired
        fieldId="byon-image-repository-label"
        helperText="Repo where notebook images are stored."
        helperTextInvalid="This field is required."
        helperTextInvalidIcon={<ExclamationCircleIcon />}
        validated={valid.repository || state.repository === '' ? undefined : 'error'}
      >
        <TextInput
          id="byon-image-repository-input"
          isRequired
          type="text"
          data-id="byon-image-repository-input"
          name="byon-image-repository-input"
          aria-describedby="byon-image-repository-input"
          value={state.repository}
          onChange={(value) => {
            setValue('repository', value);
          }}
        />
      </FormGroup>
      <FormGroup
        label="Name"
        isRequired
        fieldId="byon-image-name-label"
        helperTextInvalid="This field is required."
        helperTextInvalidIcon={<ExclamationCircleIcon />}
        validated={valid.name || state.name === '' ? undefined : 'error'}
      >
        <TextInput
          id="byon-image-name-input"
          isRequired
          type="text"
          data-id="byon-image-name-input"
          name="byon-image-name-input"
          value={state.name}
          onChange={(value) => {
            setValue('name', value);
          }}
        />
      </FormGroup>
      <FormGroup label="Description" fieldId="byon-image-description">
        <TextInput
          id="byon-image-description-input"
          isRequired
          type="text"
          data-id="byon-image-description-input"
          name="byon-image-description-input"
          aria-describedby="byon-image-description-input"
          value={state.description}
          onChange={(value) => {
            setValue('description', value);
          }}
        />
      </FormGroup>
      <FormGroup fieldId="byon-image-software-packages">
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_event, indexKey) => {
            setActiveTabKey(indexKey as number);
          }}
        >
          <Tab data-id="software-tab" eventKey={0} title={<TabTitleText>Software</TabTitleText>}>
            {state.software.length > 0 ? (
              <>
                <TableComposable aria-label="Simple table" variant="compact">
                  <Caption>
                    Add the advertised software shown with this notebook image. Modifying the
                    software here does not effect the contents of the notebook image.
                  </Caption>
                  <Thead>
                    <Tr>
                      <Th>Software</Th>
                      <Th>Version</Th>
                      <Th />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {state.software.map((value, currentIndex) => (
                      <EditStepTableRow
                        key={`${value.name}-${currentIndex}`}
                        imagePackage={value}
                        setEditedValues={(values) => {
                          const updatedPackages = [...state.software];
                          updatedPackages[currentIndex] = values;
                          setValue('software', updatedPackages);
                        }}
                        onDeleteHandler={() => {
                          setValue(
                            'software',
                            state.software.filter((_value, index) => index !== currentIndex),
                          );
                        }}
                      />
                    ))}
                  </Tbody>
                </TableComposable>
                <Button
                  data-id="add-software-secondary-button"
                  variant="link"
                  icon={<PlusCircleIcon />}
                  onClick={() => {
                    setValue('software', [
                      ...state.software,
                      {
                        name: '',
                        version: '',
                        visible: true,
                      },
                    ]);
                  }}
                >
                  Add Software
                </Button>
              </>
            ) : (
              <EmptyState variant={EmptyStateVariant.small}>
                <EmptyStateIcon icon={CubesIcon} />
                <Title headingLevel="h4" size="lg">
                  No software added
                </Title>
                <EmptyStateBody>
                  Add software to be advertised with your notebook image. Making changes here won’t
                  affect the contents of the image.{' '}
                </EmptyStateBody>
                <Button
                  data-id="add-software-button"
                  className="empty-button"
                  variant="secondary"
                  onClick={() => {
                    setValue('software', [
                      ...state.software,
                      {
                        name: '',
                        version: '',
                        visible: true,
                      },
                    ]);
                  }}
                >
                  Add software
                </Button>
              </EmptyState>
            )}
          </Tab>
          <Tab data-id="packages-tab" eventKey={1} title={<TabTitleText>Packages</TabTitleText>}>
            {state.packages.length > 0 ? (
              <>
                <TableComposable aria-label="Simple table" variant="compact" isStickyHeader>
                  <Caption>
                    Add the advertised packages shown with this notebook image. Modifying the
                    packages here does not effect the contents of the notebook image.
                  </Caption>
                  <Thead>
                    <Tr>
                      <Th>Package</Th>
                      <Th>Version</Th>
                      <Th />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {state.packages.map((value, currentIndex) => (
                      <EditStepTableRow
                        key={`${value.name}-${currentIndex}`}
                        imagePackage={value}
                        setEditedValues={(values) => {
                          const updatedPackages = [...state.packages];
                          updatedPackages[currentIndex] = values;
                          setValue('packages', updatedPackages);
                        }}
                        onDeleteHandler={() => {
                          setValue(
                            'packages',
                            state.packages.filter((_value, index) => index !== currentIndex),
                          );
                        }}
                      />
                    ))}
                  </Tbody>
                </TableComposable>
                <Button
                  data-id="add-package-secondary-button"
                  variant="link"
                  icon={<PlusCircleIcon />}
                  onClick={() => {
                    setValue('packages', [
                      ...state.packages,
                      {
                        name: '',
                        version: '',
                        visible: true,
                      },
                    ]);
                  }}
                >
                  Add Package
                </Button>
              </>
            ) : (
              <EmptyState variant={EmptyStateVariant.small}>
                <EmptyStateIcon icon={CubesIcon} />
                <Title headingLevel="h4" size="lg">
                  No packages added
                </Title>
                <EmptyStateBody>
                  Add packages to be advertised with your notebook image. Making changes here won’t
                  affect the contents of the image.{' '}
                </EmptyStateBody>
                <Button
                  data-id="add-package-button"
                  className="empty-button"
                  variant="secondary"
                  onClick={() => {
                    setValue('packages', [
                      ...state.packages,
                      {
                        name: '',
                        version: '',
                        visible: true,
                      },
                    ]);
                  }}
                >
                  Add package
                </Button>
              </EmptyState>
            )}
          </Tab>
        </Tabs>
      </FormGroup>
    </React.Fragment>
  );
};

export default ImportImageForm;
