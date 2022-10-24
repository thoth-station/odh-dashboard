import React, { useEffect, useMemo } from 'react';
import {
  FormGroup,
  TextInput,
  Text,
  Tabs,
  Tab,
  TabTitleText,
  Select,
  SelectVariant,
  SelectOption,
  SelectGroup,
  Divider,
  Spinner,
  Bullseye,
  Split,
  SplitItem,
  Tooltip,
  Alert,
  FormAlert,
} from '@patternfly/react-core';
import { BYONImagePackage, ImageInfo } from 'types';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import './ImageForm.scss';
import { useWatchImages } from 'utilities/useWatchImages';
import { ComponentsTable } from './ComponentsTable';

export type ExistingImageFormType = {
  state: {
    source?: {
      value: string;
      key: number;
      tagIndex?: number;
      isDisabled?: boolean;
      group: string;
      description?: string;
      image?: ImageInfo;
    };
    name: string;
    description: string;
    software: BYONImagePackage[];
    packages: BYONImagePackage[];
  };
  valid: {
    source: boolean;
    name: boolean;
  };
};

type ExistingImageFormProps = {
  setValue: (key: string, value: unknown) => void;
} & ExistingImageFormType;

export const ExistingImageForm: React.FC<ExistingImageFormProps> = ({ state, valid, setValue }) => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>('software');
  const [sourceIsOpen, setSourceIsOpen] = React.useState<boolean>(false);

  const { images, loaded, loadError } = useWatchImages();

  const [defaultPackages, setDefaultPackages] = React.useState<BYONImagePackage[]>([]);
  const [defaultSoftware, setDefaultSoftware] = React.useState<BYONImagePackage[]>([]);

  useEffect(() => {
    if (state.source && state.source.tagIndex !== undefined) {
      const content = state.source.image?.tags[state.source.tagIndex].content;

      if (content?.dependencies) {
        const packages = content?.dependencies.map((p) => ({
          visible: true,
          ...p,
        }));
        setDefaultPackages(packages);
        setValue('packages', packages);
      }
      if (content?.software) {
        const software = content?.software.map((p) => ({
          visible: true,
          ...p,
        }));
        setDefaultSoftware(software);
        setValue('software', software);
      }
    }
  }, [state.source, setValue]);

  const sourceOptions = useMemo(() => {
    const options: {
      value: string;
      key: number;
      tagIndex?: number;
      isDisabled?: boolean;
      group: string;
      description?: string;
    }[] = [];

    if (images) {
      images.forEach((image, i) => {
        // TODO verify if this is correct way for grouping
        const group =
          image?.labels?.['app.kubernetes.io/created-by'] === 'byon'
            ? 'custom'
            : image?.labels?.['opendatahub.io/component'] === 'true'
            ? 'core'
            : 'imported';

        let data;
        if (!image.tags || image.tags.length === 0) {
          data = [
            {
              toString: () => image.display_name ?? image.name,
              compareTo: (selectOption) => selectOption.key === i,
              value: image.display_name ?? image.name,
              key: i,
              isDisabled: true,
              group: group,
              image: image,
            },
          ];
        } else {
          data = image.tags.map((tag, j) => {
            return {
              toString: () => image.display_name ?? image.name,
              compareTo: (selectOption) => selectOption.key === i,
              value: image.display_name ?? image.name,
              key: i,
              tagIndex: j,
              description: tag.name,
              group: group,
              image: image,
            };
          });
        }

        options.push(...data);
      });
    }

    return options;
  }, [images]);

  const optionGroups = useMemo(() => {
    if (!loaded) {
      return [
        <SelectOption isDisabled key="spinnerOption">
          <Bullseye>
            <Spinner size="md" />
          </Bullseye>
        </SelectOption>,
      ];
    } else if (loadError) {
      return [
        <SelectOption
          key="loadError"
          value="Error fetching images"
          description={loadError.name + ' - ' + loadError.message}
          isDisabled
        />,
      ];
    } else if (sourceOptions.length === 0) {
      return [<SelectOption key="not_found" value="No images available" isDisabled />];
    } else {
      const options: React.ReactElement[] = [];
      const core = sourceOptions.filter((option) => option.group === 'core');
      const imported = sourceOptions.filter((option) => option.group === 'imported');
      const custom = sourceOptions.filter((option) => option.group === 'custom');

      const optionElement = (option) => {
        if (option.tagIndex === undefined) {
          return (
            <Tooltip
              removeFindDomNode
              key={option.key + option.value}
              content="This image contains no imagestream tags, so its content cannot be seen."
            >
              <SelectOption
                value={option}
                description={option.description}
                isDisabled={option.isDisabled}
              >
                {option.tagIndex === undefined && (
                  <Split>
                    <SplitItem>{option.value}</SplitItem>
                    <SplitItem isFilled />
                    <SplitItem>
                      <ExclamationCircleIcon className="icon" />
                    </SplitItem>
                  </Split>
                )}
              </SelectOption>
            </Tooltip>
          );
        } else {
          return (
            <SelectOption
              key={option.key + option.value}
              value={option}
              description={option.description}
              isDisabled={option.isDisabled}
            />
          );
        }
      };

      if (core.length > 0) {
        options.push(
          <SelectGroup label="Core images" key="core">
            {core.map((option) => optionElement(option))}
          </SelectGroup>,
        );
      }

      if (imported.length > 0) {
        options.push(<Divider key="divider1" />);
        options.push(
          <SelectGroup label="Imported images" key="imported">
            {imported.map((option) => optionElement(option))}
          </SelectGroup>,
        );
      }

      if (custom.length > 0) {
        options.push(<Divider key="divider2" />);
        options.push(
          <SelectGroup label="Custom built images" key="custom">
            {custom.map((option) => optionElement(option))}
          </SelectGroup>,
        );
      }
      return options;
    }
  }, [sourceOptions, loadError, loaded]);

  return (
    <React.Fragment>
      <FormGroup
        label="Source image"
        isRequired
        fieldId="byon-image-source-label"
        helperTextInvalid="This field is required."
        helperTextInvalidIcon={<ExclamationCircleIcon />}
      >
        <Select
          id="byon-image-source-input"
          data-id="byon-image-source-input"
          name="byon-image-source-input"
          selections={state.source}
          variant={SelectVariant.single}
          isOpen={sourceIsOpen}
          isGrouped
          placeholderText="Select an image"
          onToggle={() => setSourceIsOpen(!sourceIsOpen)}
          onSelect={(e, newValue, isPlaceholder) => {
            if (isPlaceholder) {
              setValue('source', undefined);
            } else {
              setValue('source', newValue);
            }
            setSourceIsOpen(false);
          }}
        >
          {optionGroups}
        </Select>
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
      <FormGroup label="Included Components" fieldId="byon-image-software-packages">
        <Text component="p" className="gutter-bottom">
          Select the {activeTabKey} and packages to be included in the new image.
        </Text>
        {state?.source?.tagIndex !== undefined &&
          (!state?.source?.image?.tags?.[state.source.tagIndex].annotations?.[
            'opendatahub.io/notebook-software'
          ] ||
            !state?.source?.image?.tags?.[state.source.tagIndex].annotations?.[
              'opendatahub.io/notebook-python-dependencies'
            ]) && (
            <FormAlert>
              <Alert
                isInline
                className="gutter-bottom"
                variant="warning"
                title="Annotations on the imagestream are not present: can not see the contents of the image."
              >
                <p>Missing the following annotations:</p>
                <ul>
                  {!state?.source?.image?.tags?.[state.source.tagIndex].annotations?.[
                    'opendatahub.io/notebook-software'
                  ] && (
                    <li>
                      <code>opendatahub.io/notebook-python-dependencies</code>
                    </li>
                  )}
                  {!state?.source?.image?.tags?.[state.source.tagIndex].annotations?.[
                    'opendatahub.io/notebook-python-dependencies'
                  ] && (
                    <li>
                      <code>opendatahub.io/notebook-software</code>
                    </li>
                  )}
                </ul>
              </Alert>
            </FormAlert>
          )}
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_event, tabIndex) => setActiveTabKey(tabIndex)}
          role="region"
        >
          <Tab eventKey="software" title={<TabTitleText>Software</TabTitleText>}>
            <ComponentsTable
              defaultRows={defaultSoftware}
              selectedRows={state.software}
              label="software"
              setValue={setValue}
            />
          </Tab>
          <Tab eventKey="package" title={<TabTitleText>Packages</TabTitleText>}>
            <ComponentsTable
              defaultRows={defaultPackages}
              selectedRows={state.packages}
              label="packages"
              setValue={setValue}
            />
          </Tab>
        </Tabs>
      </FormGroup>
    </React.Fragment>
  );
};

export default ExistingImageForm;
