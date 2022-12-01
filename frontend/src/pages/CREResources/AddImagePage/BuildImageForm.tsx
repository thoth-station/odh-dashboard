import React from 'react';
import { FormGroup, TextInput, Text, FileUpload } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import './ImageForm.scss';

export type BuildImageFormType = {
  state: {
    name: string;
    description: string;
    packageVersions: string[];
    osName: string;
    osVersion: string;
    pythonVersion: string;
  };
  valid: {
    packageVersions: boolean;
    osName: boolean;
    osVersion: boolean;
    pythonVersion: boolean;
    name: boolean;
  };
};

type BuildImageFormProps = {
  setValue: (key: string, value: unknown) => void;
} & BuildImageFormType;

export const BuildImageForm: React.FC<BuildImageFormProps> = ({ state, valid, setValue }) => {
  const [filename, setFilename] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <React.Fragment>
      <FormGroup
        label="Name"
        isRequired
        fieldId="cre-resource-name-label"
        helperTextInvalid="This field is required."
        helperTextInvalidIcon={<ExclamationCircleIcon />}
        validated={valid.name || state.name === '' ? undefined : 'error'}
      >
        <TextInput
          id="cre-resource-name-input"
          isRequired
          type="text"
          data-id="cre-resource-name-input"
          name="cre-resource-name-input"
          value={state.name}
          onChange={(value) => {
            setValue('name', value);
          }}
        />
      </FormGroup>
      <FormGroup label="Description" fieldId="cre-resource-description">
        <TextInput
          id="cre-resource-description-input"
          type="text"
          data-id="cre-resource-description-input"
          name="cre-resource-description-input"
          aria-describedby="cre-resource-description-input"
          value={state.description}
          onChange={(value) => {
            setValue('description', value);
          }}
        />
      </FormGroup>
      <FormGroup label="OS Name" fieldId="cre-resource-os-name" isRequired>
        <TextInput
          id="cre-resource-os-name-input"
          isRequired
          type="text"
          data-id="cre-resource-os-name-input"
          name="cre-resource-os-name-input"
          aria-describedby="cre-resource-os-name-input"
          value={state.osName}
          onChange={(value) => {
            setValue('osName', value);
          }}
        />
      </FormGroup>
      <FormGroup label="OS Version" fieldId="cre-resource-osVersion" isRequired>
        <TextInput
          id="cre-resource-os-version-input"
          isRequired
          type="text"
          data-id="cre-resource-os-version-input"
          name="cre-resource-os-version-input"
          aria-describedby="cre-resource-os-version-input"
          value={state.osVersion}
          onChange={(value) => {
            setValue('osVersion', value);
          }}
        />
      </FormGroup>
      <FormGroup label="Python Version" fieldId="cre-resource-pythonVersion" isRequired>
        <TextInput
          id="cre-resource-python-version-input"
          isRequired
          type="text"
          data-id="cre-resource-python-version-input"
          name="cre-resource-python-version-input"
          aria-describedby="cre-resource-python-version-input"
          value={state.pythonVersion}
          onChange={(value) => {
            setValue('pythonVersion', value);
          }}
        />
      </FormGroup>
      <FormGroup label="Add Components" fieldId="cre-resource-software-packages">
        <Text component="p" className="gutter-bottom">
          Upload a .txt file or paste its contents below
        </Text>
        <FileUpload
          id="text-file-requirements"
          type="text"
          value={state.packageVersions.join('\n')}
          isLoading={isLoading}
          filename={filename}
          filenamePlaceholder="Drag and drop a file or upload one"
          onFileInputChange={(_event, file) => setFilename(file.name)}
          onDataChange={(value) => setValue('packageVersions', value.split(/\r?\n/))}
          onTextChange={(value) => setValue('packageVersions', value.split(/\r?\n/))}
          onReadStarted={() => setIsLoading(true)}
          onReadFinished={() => setIsLoading(false)}
          onClearClick={() => {
            setFilename('');
            setValue('packageVersions', []);
          }}
          allowEditingUploadedText={true}
          browseButtonText="Upload"
          dropzoneProps={{
            accept: '.txt',
          }}
        />
      </FormGroup>
    </React.Fragment>
  );
};

export default BuildImageForm;
