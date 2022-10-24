import React, { useMemo, useReducer } from 'react';
import {
  Alert,
  AlertActionCloseButton,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  PageSection,
  PageSectionVariants,
} from '@patternfly/react-core';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../../redux/actions/actions';
import ApplicationsPage from 'pages/ApplicationsPage';
import { importBYONImage } from 'services/imagesService';
import { State } from 'redux/types';
import ImportImageForm from './ImportImageForm';
import { useNavigate } from 'react-router-dom';
import { ResponseStatus } from 'types';
import { useWatchBYONImages } from 'utilities/useWatchBYONImages';
import './AddNewImageForm.scss';

export const AddNewImageForm: React.FC = () => {
  const userName: string = useSelector<State, string>((state) => state.appState.user || '');
  const dispatch = useDispatch();

  const [imageSelectValue, setImageSelectValue] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>();

  const navigate = useNavigate();

  const { forceUpdate } = useWatchBYONImages();

  const onImageSelectValueChange = (value: string) => {
    setImageSelectValue(value);
  };

  // default state for "import image" form
  const defaultImportState = {
    state: {
      repository: '',
      name: '',
      description: '',
      software: [],
      packages: [],
    },
    valid: {
      repository: false,
      name: false,
    },
  };
  // default state for "build image" form
  const defaultBuildState = { state: {}, valid: {} };
  // default state for "create image from existing image" form
  const defaultCreateState = { state: {}, valid: {} };

  // aggregate default form state
  // is split up into current "state" and current "valid" members
  // note: not all members need validation
  const defaultFormState = {
    state: {
      ...defaultImportState.state,
      ...defaultBuildState.state,
      ...defaultCreateState.state,
    },
    valid: {
      ...defaultImportState.valid,
      ...defaultBuildState.valid,
      ...defaultCreateState.valid,
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

  // updates local validity every time state changes
  // TODO confirm this isn't causing slowdowns by validating on every change - might want to add lodash
  const isValid = useMemo(() => {
    let valid = true;

    // validate form based on which form is selected
    switch (imageSelectValue) {
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
      case 'create':
        // TODO create validator for create form
        break;
      case 'build':
        // TODO create validator for create form
        break;
      default:
        // when no option is selected
        valid = false;
    }

    return valid;
  }, [formState.state, imageSelectValue]);

  // set react component form based on selection
  const imageSelectForm = useMemo(() => {
    switch (imageSelectValue) {
      case 'import':
        return (
          <ImportImageForm
            state={formState.state}
            valid={formState.valid}
            setValue={(key, value) => formDispatch({ type: 'set', key: key, value: value })}
          />
        );
      case 'create':
        // TODO create the Create page
        return null;
      case 'build':
        // TODO create the Build page
        return null;
      default:
        return null;
    }
  }, [imageSelectValue, formState]);

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

    // submit form based on which form is selected
    switch (imageSelectValue) {
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
      case 'create':
        // TODO create validator and submitter
        break;
      case 'build':
        // TODO create the Build page
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
              className="add-image-form"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <FormSelect
                value={imageSelectValue}
                onChange={onImageSelectValueChange}
                aria-label="FormSelect Input"
              >
                <FormSelectOption isPlaceholder value={''} label={'Select...'} />
                <FormSelectOption value={'import'} label={'Import an existing image'} />
                <FormSelectOption
                  isDisabled
                  value="create"
                  label="Create from an an existing image"
                />
                <FormSelectOption isDisabled value="build" label="Build a new image from scratch" />
              </FormSelect>
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
