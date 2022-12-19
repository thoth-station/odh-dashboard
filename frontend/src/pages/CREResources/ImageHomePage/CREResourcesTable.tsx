import React, { useMemo } from 'react';
import {
  Button,
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Flex,
  FlexItem,
  Select,
  SelectOption,
  SelectVariant,
  SearchInput,
  Switch,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Popover,
  Spinner,
} from '@patternfly/react-core';
import {
  ActionsColumn,
  TableComposable,
  Thead,
  Tr,
  Th,
  ThProps,
  Tbody,
  Td,
  ExpandableRowContent,
  IAction,
} from '@patternfly/react-table';
import {
  CheckIcon,
  CubesIcon,
  ExclamationTriangleIcon,
  SearchIcon,
  UnknownIcon,
} from '@patternfly/react-icons';
import { CREDetails } from 'types';
import { relativeTime } from '../../../utilities/time';
import './CREResourcesTable.scss';
import { DeleteCREResourceModal } from './DeleteCREResourceModal';
import { updateCREImage } from '../../../services/imagesService';
import { useNavigate } from 'react-router-dom';

export type CREResourcesTableProps = {
  resources: CREDetails[];
  forceUpdate: () => void;
};

type CREResourceEnabled = {
  id: string;
  visible?: boolean;
};

type CREResourceTableFilterOptions = 'user' | 'name' | 'description' | 'phase' | 'uploaded';
type CREResourceTableFilter = {
  filter: string;
  option: CREResourceTableFilterOptions;
  count: number;
};

export const CREResourcesTable: React.FC<CREResourcesTableProps> = ({ resources, forceUpdate }) => {
  const navigate = useNavigate();

  const rowActions = (resource: CREDetails): IAction[] => [
    {
      title: 'Edit',
      id: `${resource.name}-edit-button`,
      disabled: !resource.hasImage,
      onClick: () => {
        if (resource.hasImage) {
          navigate('edit-resource', { state: { resource: resource } });
        }
      },
    },
    {
      isSeparator: true,
    },
    {
      title: 'Delete',
      id: `${resource.name}-delete-button`,
      onClick: () => {
        setCurrentResource(resource);
        setDeleteResourceModalVisible(true);
      },
    },
  ];

  const getPhase = (nb: CREDetails) => {
    if (!nb.phase) {
      return (
        <>
          <UnknownIcon />
        </>
      );
    } else if (nb.phase === 'Succeeded')
      return (
        <>
          <CheckIcon className="phase-success" /> {nb.phase}
        </>
      );
    else if (nb.phase === 'Failed')
      return (
        <Popover
          aria-label="Alert popover"
          alertSeverityVariant={'danger'}
          headerContent="Failed to load resource"
          headerIcon={<ExclamationTriangleIcon />}
          removeFindDomNode
          headerComponent="h1"
          bodyContent={<div>{nb?.lastCondition?.message ?? 'An unknown error has occurred.'}</div>}
        >
          <div className="phase-failed-cursor">
            <ExclamationTriangleIcon className="phase-failed" /> {nb.phase}
          </div>
        </Popover>
      );
    else {
      return (
        <>
          <Spinner size="md" /> {nb.phase}
        </>
      );
    }
  };

  React.useEffect(() => {
    setCREResourceVisible(
      resources.map((resource) => {
        return { id: resource.id, visible: resource.visible };
      }),
    );

    return () => {
      setCREResourceVisible([]); // This worked for me
    };
  }, [resources]);

  const [currentResource, setCurrentResource] = React.useState<CREDetails>(resources[0]);
  const [deleteResourceModalVisible, setDeleteResourceModalVisible] =
    React.useState<boolean>(false);

  const [activeSortIndex, setActiveSortIndex] = React.useState<number | undefined>(0);
  const [activeSortDirection, setActiveSortDirection] = React.useState<'asc' | 'desc' | undefined>(
    'asc',
  );

  const getFilterCount = (value: string, option): number => {
    let total = 0;
    resources.forEach((resource) => {
      (resource[option] as string).includes(value) ? total++ : null;
    });
    return total;
  };

  const getSortableRowValues = (nb: CREDetails): string[] => {
    const { name, description = '', phase = '', visible = false, user = '', uploaded = '' } = nb;
    return [name, description, phase, visible.toString(), user, uploaded.toString()];
  };

  const sortedRows = useMemo(() => {
    if (activeSortIndex !== undefined) {
      return [...resources].sort((a, b) => {
        const aValue = getSortableRowValues(a)[activeSortIndex];
        const bValue = getSortableRowValues(b)[activeSortIndex];
  
        if (activeSortDirection === 'asc') {
          return (aValue as string).localeCompare(bValue as string);
        }
        return (bValue as string).localeCompare(aValue as string);
      });
    }
    else return resources
  }, [activeSortIndex, resources, activeSortDirection])

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
      defaultDirection: 'asc',
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
    },
    columnIndex,
  });

  const columnNames = {
    name: 'Name',
    description: 'Description',
    status: 'Status',
    enabled: 'Enabled',
    user: 'User',
    uploaded: 'Updated',
  };

  const currentTimeStamp: number = Date.now();

  const [expandedCREResourceIDs, setExpandedCREResourceIDs] = React.useState<string[]>([]);
  const setCREResourceExpanded = (resource: CREDetails, isExpanding = true) => {
    setExpandedCREResourceIDs((prevExpanded) => {
      const otherExpandedRepoNames = prevExpanded.filter((r) => r !== resource.id);
      return isExpanding ? [...otherExpandedRepoNames, resource.id] : otherExpandedRepoNames;
    });
  };
  const isCREResourceExpanded = (resource: CREDetails) => {
    return expandedCREResourceIDs.includes(resource.id);
  };
  const [CREResourceVisible, setCREResourceVisible] = React.useState<CREResourceEnabled[]>(
    resources.map((resource) => {
      return { id: resource.id, visible: resource.visible };
    }),
  );

  const selectOptions = [
    <SelectOption data-id="search-filter-name" key={1} value="name">
      Name
    </SelectOption>,
    <SelectOption data-id="search-filter-desc" key={2} value="description">
      Description
    </SelectOption>,
    <SelectOption data-id="search-filter-phase" key={3} value="phase">
      Status
    </SelectOption>,
    <SelectOption data-id="search-filter-user" key={4} value="user">
      User
    </SelectOption>,
    <SelectOption data-id="search-filter-uploaded" key={5} value="uploaded">
      Updated
    </SelectOption>,
  ];
  const [tableFilter, setTableFilter] = React.useState<CREResourceTableFilter>({
    filter: '',
    option: 'name',
    count: resources.length,
  });
  const [selected, setSelected] = React.useState('name');
  const [tableSelectIsOpen, setTableSelectIsOpen] = React.useState(false);

  const items = (
    <React.Fragment>
      <ToolbarItem variant="search-filter" className="filter-select">
        <Select
          removeFindDomNode
          data-id="search-filter-select"
          variant={SelectVariant.single}
          aria-label="Select for resource resources table"
          onToggle={(isExpanded) => {
            setTableSelectIsOpen(isExpanded);
          }}
          onSelect={(_event, value) => {
            setSelected(value as string);
            const newCount = getFilterCount(tableFilter.filter, value);
            setTableFilter({
              filter: tableFilter.filter,
              option: value as CREResourceTableFilterOptions,
              count: newCount,
            });
          }}
          selections={selected}
          isOpen={tableSelectIsOpen}
        >
          {selectOptions}
        </Select>
      </ToolbarItem>
      <ToolbarItem variant="search-filter">
        <SearchInput
          removeFindDomNode
          data-id="search-filter-input"
          className="filter-search"
          aria-label="search input for resource resources table"
          value={tableFilter.filter}
          onChange={(value) => {
            const newCount = getFilterCount(value, tableFilter.option);
            setTableFilter({
              filter: value,
              option: tableFilter.option,
              count: newCount,
            });
          }}
          onClear={() => {
            setTableFilter({
              filter: '',
              option: tableFilter.option,
              count: resources.length,
            });
          }}
        />
      </ToolbarItem>
      <ToolbarItem>
        <Button
          data-id="import-new-resource"
          onClick={() => {
            navigate('add-new-resource');
          }}
        >
          Add new resource
        </Button>
      </ToolbarItem>
    </React.Fragment>
  );

  const applyTableFilter = (resource: CREDetails): boolean => {
    if (
      tableFilter.filter !== '' &&
      resource[tableFilter.option] &&
      tableFilter.option !== 'uploaded'
    ) {
      const CREResourceValue: string = resource[tableFilter.option] as string;
      return !CREResourceValue.includes(tableFilter.filter);
    }
    if (
      tableFilter.filter !== '' &&
      resource[tableFilter.option] &&
      tableFilter.option === 'uploaded'
    ) {
      const CREResourceValue: string = relativeTime(
        currentTimeStamp,
        new Date(resource.uploaded as Date).getTime(),
      );
      return !CREResourceValue.includes(tableFilter.filter);
    }
    return false;
  };
  return (
    <React.Fragment>
      <DeleteCREResourceModal
        resource={currentResource}
        isOpen={deleteResourceModalVisible}
        onDeleteHandler={forceUpdate}
        onCloseHandler={() => {
          setDeleteResourceModalVisible(false);
        }}
      />
      <Toolbar data-id="toolbar-items">
        <ToolbarContent>{items}</ToolbarContent>
      </Toolbar>
      <TableComposable
        className={tableFilter.count === 0 ? 'empty-table' : ''}
        aria-label="Notebook resources table"
        variant="compact"
      >
        <Thead>
          <Tr>
            <Th />
            {Object.values(columnNames).map((name, index) => (
              <Th key={name} sort={getSortParams(index)}>
                {name}
              </Th>
            ))}
            <Th />
          </Tr>
        </Thead>
        {tableFilter.count > 0 ? (
          sortedRows.map((resource, rowIndex) => {
            const packages: React.ReactNode[] = [];
            resource.packageAnnotations?.forEach((nbpackage, i) => {
              packages.push(
                <p key={nbpackage.name + i}>{`${nbpackage.name} ${nbpackage.version}`}</p>,
              );
            });
            return (
              <Tbody key={resource.name + rowIndex} isExpanded={isCREResourceExpanded(resource)}>
                <Tr isHidden={applyTableFilter(resource)}>
                  <Td
                    expand={{
                      rowIndex,
                      isExpanded: isCREResourceExpanded(resource),
                      onToggle: () =>
                        setCREResourceExpanded(resource, !isCREResourceExpanded(resource)),
                    }}
                  />
                  <Td dataLabel={columnNames.name}>{resource.name}</Td>
                  <Td dataLabel={columnNames.description}>{resource.description}</Td>
                  <Td dataLabel={columnNames.status}>{getPhase(resource)}</Td>
                  <Td>
                    <Switch
                      isDisabled={!resource.hasImage}
                      className="enable-switch"
                      aria-label={`Enable Switch ${resource.name}`}
                      data-id={`enabled-disable-${resource.id}`}
                      isChecked={
                        CREResourceVisible.find((value) => {
                          return resource.id === value.id;
                        })?.visible
                      }
                      onChange={() => {
                        updateCREImage({
                          id: resource.id,
                          visible: !resource.visible,
                        });
                        setCREResourceVisible(
                          CREResourceVisible.map((value) =>
                            resource.id === value.id
                              ? { id: value.id, visible: !value.visible }
                              : value,
                          ),
                        );
                      }}
                    />
                  </Td>
                  <Td dataLabel={columnNames.user}>{resource.user}</Td>
                  <Td dataLabel={columnNames.uploaded}>
                    {relativeTime(currentTimeStamp, new Date(resource.uploaded as Date).getTime())}
                  </Td>
                  <Td isActionCell>
                    <ActionsColumn items={rowActions(resource)} />
                  </Td>
                </Tr>
                <Tr
                  isHidden={applyTableFilter(resource)}
                  isExpanded={isCREResourceExpanded(resource)}
                >
                  <Td dataLabel="Package Details" colSpan={Object.entries(columnNames).length}>
                    {packages.length > 0 ? (
                      <ExpandableRowContent>
                        <Flex className="included-packages">
                          <FlexItem>Packages Include</FlexItem>
                          <FlexItem className="included-packages-font">{packages}</FlexItem>
                        </Flex>
                      </ExpandableRowContent>
                    ) : (
                      <EmptyState variant={EmptyStateVariant.small}>
                        <EmptyStateIcon icon={CubesIcon} />
                        <Title headingLevel="h4" size="lg">
                          No packages detected
                        </Title>
                        <EmptyStateBody>Edit the resource to add packages</EmptyStateBody>
                      </EmptyState>
                    )}
                  </Td>
                </Tr>
              </Tbody>
            );
          })
        ) : (
          <Tbody>
            <Tr>
              <Td colSpan={8}>
                <Bullseye>
                  <EmptyState variant={EmptyStateVariant.small}>
                    <EmptyStateIcon icon={SearchIcon} />
                    <Title headingLevel="h2" size="lg">
                      No results found
                    </Title>
                    <EmptyStateBody>Clear all filters and try again.</EmptyStateBody>
                    <Button
                      variant="link"
                      onClick={() => {
                        setTableFilter({
                          filter: '',
                          option: tableFilter.option,
                          count: resources.length,
                        });
                      }}
                    >
                      Clear all filters
                    </Button>
                  </EmptyState>
                </Bullseye>
              </Td>
            </Tr>
          </Tbody>
        )}
      </TableComposable>
    </React.Fragment>
  );
};
