import React from 'react';
import { FormGroup, TextInput } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import './ImageForm.scss';

export type GitImageFormType = {
  state: {
    repository: string;
    name: string;
    description: string;
    gitRef: string
  };
  valid: {
    repository: boolean;
    name: boolean;
    gitRef: boolean;
  };
};

type GitImageFormProps = {
  setValue: (key: string, value: unknown) => void;
} & GitImageFormType;

export const GitImageForm: React.FC<GitImageFormProps> = ({ state, valid, setValue }) => {
  return (
    <React.Fragment>
      <FormGroup
        label="Repository"
        isRequired
        fieldId="byon-image-repository-label"
        helperText="Git repo where notebook images are stored."
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
        label="Git Reference"
        isRequired
        fieldId="git-ref-image-repository-label"
        helperText="Git reference of selected git repo."
        helperTextInvalid="This field is required."
        helperTextInvalidIcon={<ExclamationCircleIcon />}
        validated={valid.gitRef || state.gitRef === '' ? undefined : 'error'}
      >
        <TextInput
          id="byon-image-git-ref-input"
          isRequired
          type="text"
          data-id="byon-image-git-ref-input"
          name="byon-image-git-ref-input"
          aria-describedby="byon-image-git-ref-input"
          value={state.gitRef}
          onChange={(value) => {
            setValue('gitRef', value);
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
    </React.Fragment>
  );
};

export default GitImageForm;
