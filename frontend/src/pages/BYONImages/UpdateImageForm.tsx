import React, { useMemo } from 'react';
import {
  FormGroup,
  Tab,
  Tabs,
  Text,
  TabTitleText,
  TextInput,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Form,
  PageSection,
  PageSectionVariants,
  AlertActionCloseButton,
  Alert,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import './ImageForm.scss';
import { ComponentsTable } from './ComponentsTable';
import ApplicationsPage from 'pages/ApplicationsPage';
import { useNavigate, useLocation } from 'react-router-dom';
import { BYONImage } from 'types';
import { addNotification } from 'redux/actions/actions';
import { updateBYONImage } from 'services/imagesService';
import { useWatchBYONImages } from 'utilities/useWatchBYONImages';
import { useAppDispatch } from '../../redux/hooks';


export const UpdateImageForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTabKey, setActiveTabKey] = React.useState<number | string>('software');
  const { forceUpdate } = useWatchBYONImages();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>();
  const dispatch = useAppDispatch();

  const defaultFormState = useMemo(() => {
    const image: BYONImage = location.state?.image;
    if (!image) {
      navigate('notebookImages');
      return;
    }

    return {
      state: {
        name: image.name,
        description: image.description,
        software: image.software,
        packages: image.packages,
      },
      valid: {
        name: false,
      },
    };
  }, [location.state, navigate]);

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

  const [formState, formDispatch] = React.useReducer(reducer, defaultFormState);

  // updates local validity every time state changes
  // TODO confirm this isn't causing slowdowns by validating on every change - might want to add lodash
  const isValid = React.useMemo(() => {
    if (formState.state.name.length > 0) {
      formDispatch({ type: 'validate', key: 'name', value: true });
      return true;
    } else {
      formDispatch({ type: 'validate', key: 'name', value: false });
      return false;
    }
  }, [formState.state]);

  const setValue = React.useCallback(
    (key, value) => formDispatch({ type: 'set', key: key, value: value }),
    [],
  );

  // when canceling the form
  const closeHandler = () => {
    navigate('/notebookImages');
  };

  // when the form is submitted, send data to api
  const onSubmit = () => {
    if (!isValid) {
      return;
    }

    const image: BYONImage = location.state?.image;
    setIsLoading(true);

    updateBYONImage({
      id: image.id,
      name: formState.state.name,
      description: formState.state.description,
      packages: formState.state.packages,
      software: formState.state.software,
    })
      .then((value) => {
        if (value.success === false) {
          dispatch(
            addNotification({
              status: 'danger',
              title: 'Error',
              message: `Unable to update image ${image.name}`,
              timestamp: new Date(),
            }),
          );
        }
        forceUpdate();
        navigate('/notebookImages');
        return;
      })
      .catch((error) => {
        setIsLoading(false);
        setError(error.toString());
      });
  };

  return (
    <React.Fragment>
      <Breadcrumb className="breadcrumb">
        <BreadcrumbItem>Settings</BreadcrumbItem>
        <BreadcrumbItem to="/notebookImages">Notebook image settings</BreadcrumbItem>
        <BreadcrumbItem>Update image</BreadcrumbItem>
      </Breadcrumb>
      <ApplicationsPage
        loaded
        empty={false}
        title="Update image"
        description="Update an existing CNBI image by changing the image name, description, packages, or software."
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
              <FormGroup
                label="Name"
                isRequired
                fieldId="byon-image-name-label"
                helperTextInvalid="This field is required."
                helperTextInvalidIcon={<ExclamationCircleIcon />}
                validated={
                  formState.valid.name || formState.state.name === '' ? undefined : 'error'
                }
              >
                <TextInput
                  id="byon-image-name-input"
                  isRequired
                  type="text"
                  data-id="byon-image-name-input"
                  name="byon-image-name-input"
                  value={formState.state.name}
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
                  value={formState.state.description}
                  onChange={(value) => {
                    setValue('description', value);
                  }}
                />
              </FormGroup>
              <FormGroup label="Included Components" fieldId="byon-image-software-packages">
                <Text component="p" className="gutter-bottom">
                  Change the advertised {activeTabKey} shown with this notebook image. Modifying the
                  {activeTabKey} here does not effect the contents of the notebook image.
                </Text>
                <Tabs
                  activeKey={activeTabKey}
                  onSelect={(_event, tabIndex) => setActiveTabKey(tabIndex)}
                  role="region"
                >
                  <Tab eventKey="software" title={<TabTitleText>Software</TabTitleText>}>
                    <ComponentsTable
                      defaultRows={defaultFormState?.state.software}
                      selectedRows={formState.state.software}
                      label="software"
                      setValue={setValue}
                    />
                  </Tab>
                  <Tab eventKey="package" title={<TabTitleText>Packages</TabTitleText>}>
                    <ComponentsTable
                      defaultRows={defaultFormState?.state.packages}
                      selectedRows={formState.state.packages}
                      label="packages"
                      setValue={setValue}
                    />
                  </Tab>
                </Tabs>
              </FormGroup>
              <FormGroup>
                <Button
                  data-id="import-confirm-button"
                  key="confirm"
                  variant="primary"
                  isDisabled={!isValid}
                  onClick={onSubmit}
                  isLoading={isLoading}
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
