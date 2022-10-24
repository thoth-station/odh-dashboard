import React from 'react';
import { FormGroup, TextInput, Radio, FileUpload } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import './ImageForm.scss';

export type BuildImageFormType = {
  state: {
    name: string;
    description: string;
    requirements: string;
  };
  valid: {
    requirements: boolean;
    name: boolean;
  };
};

type BuildImageFormProps = {
  setValue: (key: string, value: unknown) => void;
} & BuildImageFormType;

export const BuildImageForm: React.FC<BuildImageFormProps> = ({ state, valid, setValue }) => {
  const [activeRadio, setActiveRadio] = React.useState<number | string>('text');
  const [filename, setFilename] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <React.Fragment>
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
      <FormGroup label="Add Components" fieldId="byon-image-software-packages">
        <Radio
          onChange={(checked) => checked && setActiveRadio('binary')}
          isChecked={activeRadio === 'binary'}
          name="binary"
          label="Upload a notebook binary file from your machine"
          id="binary"
          className="gutter-bottom-sm"
          body={
            activeRadio === 'binary' && (
              <FileUpload
                isDisabled
                id="text-file-requirements"
                type="dataURL"
                isLoading={isLoading}
                value={state.requirements}
                filename={filename}
                filenamePlaceholder="Drag and drop a file or upload one"
                onFileInputChange={(_event, file) => setFilename(file.name)}
                onDataChange={(value) => setValue('requirements', value)}
                onTextChange={(value) => setValue('requirements', value)}
                onReadStarted={() => setIsLoading(true)}
                onReadFinished={() => setIsLoading(false)}
                onClearClick={() => {
                  setFilename('');
                  setValue('requirements', '');
                }}
                browseButtonText="Upload"
                dropzoneProps={{
                  accept: '.bin',
                }}
              />
            )
          }
        />
        <Radio
          onChange={(checked) => checked && setActiveRadio('text')}
          isChecked={activeRadio === 'text'}
          name="text"
          label="Upload a text file containing a list of components"
          id="text"
          body={
            activeRadio === 'text' && (
              <FormGroup label="Upload a .txt file or paste its contents below">
                <FileUpload
                  id="text-file-requirements"
                  type="text"
                  isLoading={isLoading}
                  value={state.requirements}
                  filename={filename}
                  filenamePlaceholder="Drag and drop a file or upload one"
                  onFileInputChange={(_event, file) => setFilename(file.name)}
                  onDataChange={(value) => setValue('requirements', value)}
                  onTextChange={(value) => setValue('requirements', value)}
                  onReadStarted={() => setIsLoading(true)}
                  onReadFinished={() => setIsLoading(false)}
                  onClearClick={() => {
                    setFilename('');
                    setValue('requirements', '');
                  }}
                  allowEditingUploadedText={true}
                  browseButtonText="Upload"
                  dropzoneProps={{
                    accept: '.txt',
                  }}
                />
              </FormGroup>
            )
          }
        />
      </FormGroup>
    </React.Fragment>
  );
};

export default BuildImageForm;
