import React, { useMemo, useReducer } from 'react';
import {
  Alert,
  AlertActionCloseButton,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Form,
  FormGroup,
  PageSection,
  PageSectionVariants,
  Select,
  SelectOption,
  SelectVariant,
} from '@patternfly/react-core';
import { addNotification } from '../../redux/actions/actions';
import ApplicationsPage from 'pages/ApplicationsPage';
import { importBYONImage } from 'services/imagesService';
import ImportImageForm, { ImportImageFormType } from './ImportImageForm';
import { useNavigate } from 'react-router-dom';
import { ResponseStatus } from 'types';
import { useWatchBYONImages } from 'utilities/useWatchBYONImages';
import './AddNewImageForm.scss';
import ExistingImageForm, { ExistingImageFormType } from './ExisitingImageForm';
import BuildImageForm, { BuildImageFormType } from './BuildImageForm';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';


export const AddNewImageForm: React.FC = () => {
  const userName = useAppSelector((state) => state.user || '');
  const dispatch = useAppDispatch();

  const [imageSelectValue, setImageSelectValue] = React.useState<string>();
  const [imageSelectOpen, setImageSelectOpen] = React.useState<boolean>(false);

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>();

  const navigate = useNavigate();

  const { forceUpdate } = useWatchBYONImages();

  // default state for "import image" form
  const defaultImportState: ImportImageFormType = {
    state: {
      repository: '',
      name: '',
      description: '',
    },
    valid: {
      repository: false,
      name: false,
    },
  };
  // default state for "build image" form
  const defaultBuildState: BuildImageFormType = {
    state: {
      name: '',
      description: '',
      requirements: '',
    },
    valid: {
      requirements: false,
      name: false,
    },
  };

  // default state for "existing image from existing image" form
  const defaultExistingState: ExistingImageFormType = {
    state: {
      source: undefined,
      name: '',
      description: '',
      software: [],
      packages: [],
    },
    valid: {
      source: false,
      name: false,
    },
  };

  // aggregate default form state
  // is split up into current "state" and current "valid" members
  // note: not all members need validation
  const defaultFormState = {
    state: {
      ...defaultImportState.state,
      ...defaultBuildState.state,
      ...defaultExistingState.state,
    },
    valid: {
      ...defaultImportState.valid,
      ...defaultBuildState.valid,
      ...defaultExistingState.valid,
    },
  };

  // state helper function to set, clear, and validate members
  function reducer(state, action) {
    if (action.type === 'clear') {
      return defaultFormState;
    } else if (action.type === 'set') {
      return {
        ...state,
        state: {
          ...state.state,
          [action.key]: action.value,
        },
      };
    } else if (action.type === 'validate') {
      return {
        ...state,
        valid: {
          ...state.valid,
          [action.key]: action.value,
        },
      };
    }
  }

  const [formState, formDispatch] = useReducer(reducer, defaultFormState);

  const imageSelectOptions = useMemo(
    () => [
      {
        key: 'import',
        value: 'Import an existing image',
      },
      {
        key: 'existing',
        value: 'Create from an an existing image',
      },
      {
        key: 'build',
        value: 'Build a new image from scratch',
      },
    ],
    [],
  );

  // updates local validity every time state changes
  // TODO confirm this isn't causing slowdowns by validating on every change - might want to add lodash
  const isValid = useMemo(() => {
    let valid = true;

    const selectedOption = imageSelectOptions.find(
      (option) => option.value === imageSelectValue,
    )?.key;

    // validate form based on which form is selected
    switch (selectedOption) {
      case 'import':
        if (formState.state.name.length > 0) {
          formDispatch({ type: 'validate', key: 'name', value: true });
        } else {
          formDispatch({ type: 'validate', key: 'name', value: false });
          valid = false;
        }

        if (formState.state.repository.length > 0) {
          formDispatch({ type: 'validate', key: 'repository', value: true });
        } else {
          formDispatch({ type: 'validate', key: 'repository', value: false });
          valid = false;
        }
        break;
      case 'existing':
        if (formState.state.name.length > 0) {
          formDispatch({ type: 'validate', key: 'name', value: true });
        } else {
          formDispatch({ type: 'validate', key: 'name', value: false });
          valid = false;
        }

        if (formState.state.source) {
          formDispatch({ type: 'validate', key: 'source', value: true });
        } else {
          formDispatch({ type: 'validate', key: 'source', value: false });
          valid = false;
        }
        break;
      case 'build':
        if (formState.state.name.length > 0) {
          formDispatch({ type: 'validate', key: 'name', value: true });
        } else {
          formDispatch({ type: 'validate', key: 'name', value: false });
          valid = false;
        }

        if (formState.state.requirements.length > 0) {
          formDispatch({ type: 'validate', key: 'requirements', value: true });
        } else {
          formDispatch({ type: 'validate', key: 'requirements', value: false });
          valid = false;
        }
        break;
      default:
        // when no option is selected
        valid = false;
    }

    return valid;
  }, [formState.state, imageSelectValue, imageSelectOptions]);

  const setValue = React.useCallback(
    (key, value) => formDispatch({ type: 'set', key: key, value: value }),
    [],
  );

  // set react component form based on selection
  const imageSelectForm = useMemo(() => {
    const selectedOption = imageSelectOptions.find(
      (option) => option.value === imageSelectValue,
    )?.key;

    switch (selectedOption) {
      case 'import':
        return (
          <ImportImageForm state={formState.state} valid={formState.valid} setValue={setValue} />
        );
      case 'existing':
        return (
          <ExistingImageForm state={formState.state} valid={formState.valid} setValue={setValue} />
        );
      case 'build':
        return (
          <BuildImageForm state={formState.state} valid={formState.valid} setValue={setValue} />
        );
      default:
        return null;
    }
  }, [imageSelectValue, formState, imageSelectOptions, setValue]);

  // when canceling the form
  const closeHandler = () => {
    navigate('/notebookImages');
  };

  // when the form is submitted, send data to api
  const onSubmit = () => {
    // TODO add support for remote validation
    // this currently only runs a local validation
    // i.e. let the user submit after local validation,
    // but hold the api call until remote validation is successful

    // do not submit if not valid
    if (!isValid) {
      return;
    }

    setIsLoading(true);

    const selectedOption = imageSelectOptions.find(
      (option) => option.value === imageSelectValue,
    )?.key;

    // submit form based on which form is selected
    switch (selectedOption) {
      case 'import':
        importBYONImage({
          name: formState.state.name,
          url: formState.state.repository,
          description: formState.state.description,
          user: userName,
          software: formState.state.software,
          packages: formState.state.packages,
        })
          .then((value: ResponseStatus) => {
            if (value.success === false) {
              dispatch(
                addNotification({
                  status: 'danger',
                  title: 'Error',
                  message: `Unable to add notebook image ${name}`,
                  timestamp: new Date(),
                }),
              );
            }
            forceUpdate();
            closeHandler();
          })
          .catch((error) => {
            setIsLoading(false);
            setError(error.toString());
          });
        break;
      case 'existing':
        // TODO create submitter
        closeHandler();
        break;
      case 'build':
        // TODO create submitter
        closeHandler();
        break;
    }
  };

  return (
    <React.Fragment>
      <Breadcrumb className="breadcrumb">
        <BreadcrumbItem>Settings</BreadcrumbItem>
        <BreadcrumbItem to="/notebookImages">Notebook image settings</BreadcrumbItem>
        <BreadcrumbItem>Add new image</BreadcrumbItem>
      </Breadcrumb>
      <ApplicationsPage
        loaded
        empty={false}
        title="Add new image"
        description="Add a new image to Open Data Hub
                    by importing an existing image, creating a new image
                    based on an existing one, or by building one from scratch"
      >
        <div className="odh-cluster-settings">
          <PageSection variant={PageSectionVariants.light} padding={{ default: 'noPadding' }}>
            {error && (
              <Alert
                className="alert"
                isInline
                isExpandable
                variant="danger"
                title="Failed to submit"
                actionClose={<AlertActionCloseButton onClose={() => setError(undefined)} />}
              >
                <p>{error}</p>
              </Alert>
            )}
            <Form
              maxWidth="800px"
              className="add-image-form"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <Select
                selections={imageSelectValue}
                variant={SelectVariant.single}
                isOpen={imageSelectOpen}
                placeholderText="Select..."
                onToggle={() => setImageSelectOpen(!imageSelectOpen)}
                onSelect={(e, newValue) => {
                  if (newValue) {
                    setImageSelectValue(newValue.toString());
                    setImageSelectOpen(false);
                    formDispatch({ type: 'clear' });
                  }
                }}
              >
                {imageSelectOptions.map((option) => {
                  return <SelectOption key={option.key} value={option.value} />;
                })}
              </Select>
              {imageSelectForm}
              <FormGroup>
                <Button
                  data-id="import-confirm-button"
                  key="confirm"
                  variant="primary"
                  isDisabled={!isValid}
                  isLoading={isLoading}
                  onClick={onSubmit}
                >
                  Save
                </Button>
                <Button
                  data-id="import-cancel-button"
                  key="cancel"
                  variant="link"
                  onClick={closeHandler}
                >
                  Cancel
                </Button>
              </FormGroup>
            </Form>
          </PageSection>
        </div>
      </ApplicationsPage>
    </React.Fragment>
  );
};

export default AddNewImageForm;
