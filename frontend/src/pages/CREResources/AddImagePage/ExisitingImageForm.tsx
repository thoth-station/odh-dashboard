import React, { useMemo } from 'react';
import {
  FormGroup,
  TextInput,
  Text,
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
import { CREPackageAnnotation, ImageInfo } from 'types';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import './ImageForm.scss';
import { useWatchImages } from 'utilities/useWatchImages';
import PackageTable from './PackageTable';

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
    packageVersions: string[];
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
  const [sourceIsOpen, setSourceIsOpen] = React.useState<boolean>(false);
  const { images, loaded, loadError } = useWatchImages();

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
          image?.labels?.['app.kubernetes.io/part-of'] === 'meteor-operator'
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

  const packageAnnotations: CREPackageAnnotation[] = useMemo(() => {
    if (state.source && state.source.tagIndex !== undefined) {
      const content = state.source.image?.tags[state.source.tagIndex].content;

      if (content?.dependencies) {
        return content?.dependencies.map((p) => ({
          name: p.name,
          version: p.version,
        }));
      }
    }

    return [];
  }, [state.source]);

  return (
    <React.Fragment>
      <FormGroup
        label="Source image"
        isRequired
        fieldId="cre-image-source-label"
        helperTextInvalid="This field is required."
        helperTextInvalidIcon={<ExclamationCircleIcon />}
      >
        <Select
          id="cre-image-source-input"
          data-id="cre-image-source-input"
          name="cre-image-source-input"
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
        fieldId="cre-image-name-label"
        helperTextInvalid="This field is required."
        helperTextInvalidIcon={<ExclamationCircleIcon />}
        validated={valid.name || state.name === '' ? undefined : 'error'}
      >
        <TextInput
          id="cre-image-name-input"
          isRequired
          type="text"
          data-id="cre-image-name-input"
          name="cre-image-name-input"
          value={state.name}
          onChange={(value) => {
            setValue('name', value);
          }}
        />
      </FormGroup>
      <FormGroup label="Description" fieldId="cre-image-description">
        <TextInput
          id="cre-image-description-input"
          isRequired
          type="text"
          data-id="cre-image-description-input"
          name="cre-image-description-input"
          aria-describedby="cre-image-description-input"
          value={state.description}
          onChange={(value) => {
            setValue('description', value);
          }}
        />
      </FormGroup>
      <FormGroup label="Included Packages" fieldId="cre-image-software-packages">
        <Text component="p" className="gutter-bottom">
          Select the packages to be added to the base image.
        </Text>
        {state?.source?.tagIndex !== undefined &&
          !state?.source?.image?.tags?.[state.source.tagIndex].annotations?.[
            'opendatahub.io/notebook-python-dependencies'
          ] && (
            <FormAlert>
              <Alert
                isInline
                className="gutter-bottom"
                variant="warning"
                title="Annotations describing included packages are not present."
              >
                The ImageStream is missing the{' '}
                <code>opendatahub.io/notebook-python-dependencies</code> annotation.
              </Alert>
            </FormAlert>
          )}
        <PackageTable
          packageAnnotations={packageAnnotations}
          onChange={(value) => setValue('packageVersions', value)}
        />
      </FormGroup>
    </React.Fragment>
  );
};

export default ExistingImageForm;
