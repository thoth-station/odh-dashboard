import React from 'react';
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
import { CheckIcon, CubesIcon, ExclamationTriangleIcon, SearchIcon } from '@patternfly/react-icons';
import { BYONImage } from 'types';
import { relativeTime } from '../../utilities/time';
import './BYONImagesTable.scss';
import { DeleteImageModal } from './DeleteBYONImageModal';
import { updateBYONImage } from '../../services/imagesService';
import { useNavigate } from 'react-router-dom';

export type BYONImagesTableProps = {
  images: BYONImage[];
  forceUpdate: () => void;
};

type BYONImageEnabled = {
  id: string;
  visible?: boolean;
};

type BYONImageTableFilterOptions = 'user' | 'name' | 'description' | 'phase' | 'user' | 'uploaded';
type BYONImageTableFilter = {
  filter: string;
  option: BYONImageTableFilterOptions;
  count: number;
};

export const BYONImagesTable: React.FC<BYONImagesTableProps> = ({ images, forceUpdate }) => {
  const navigate = useNavigate();

  const rowActions = (image: BYONImage): IAction[] => [
    {
      title: 'Edit',
      id: `${image.name}-edit-button`,
      onClick: () => {
        navigate('edit-image', { state: { image: image } });
      },
    },
    {
      isSeparator: true,
    },
    {
      title: 'Delete',
      id: `${image.name}-delete-button`,
      onClick: () => {
        setcurrentImage(image);
        setDeleteImageModalVisible(true);
      },
    },
  ];

  const getPhase = (nb: BYONImage) => {
    if (nb.phase === 'Succeeded')
      return (
        <>
          <CheckIcon className="phase-success" /> {nb.phase}
        </>
      );
    else if (nb.phase === 'Failed')
      return (
        <Popover
          aria-label="Alert popover"
          alertSeverityVariant={'warning'}
          headerContent="Failed to load image"
          headerIcon={<ExclamationTriangleIcon/>}
          removeFindDomNode
          headerComponent="h1"
          bodyContent={
            <div>
              {nb.error?.length ? (
                <ul>
                  {nb.error.map((e) => (
                    <li key={e.message}>{e.message}</li>
                  ))}
                </ul>
              ) : (
                'An unknown error has occurred.'
              )}
            </div>
          }
        >
          <div className="phase-failed-cursor">
            <ExclamationTriangleIcon className="phase-failed" /> {nb.phase}
          </div>
        </Popover>
      );
    else
      return (
        <>
          <Spinner size="md" /> {nb.phase}
        </>
      );
  };

  React.useEffect(() => {
    setBYONImageVisible(
      images.map((image) => {
        return { id: image.id, visible: image.visible };
      }),
    );

    return () => {
      setBYONImageVisible([]); // This worked for me
    };
  }, [images]);

  const [currentImage, setcurrentImage] = React.useState<BYONImage>(images[0]);
  const [deleteImageModalVisible, setDeleteImageModalVisible] = React.useState<boolean>(false);

  const [activeSortIndex, setActiveSortIndex] = React.useState<number | undefined>(0);
  const [activeSortDirection, setActiveSortDirection] = React.useState<'asc' | 'desc' | undefined>(
    'asc',
  );

  const getFilterCount = (value: string, option): number => {
    let total = 0;
    images.forEach((image) => {
      (image[option] as string).includes(value) ? total++ : null;
    });
    return total;
  };

  const getSortableRowValues = (nb: BYONImage): string[] => {
    const { name, description = '', phase = '', visible = false, user = '', uploaded = '' } = nb;
    return [name, description, phase, visible.toString(), user, uploaded.toString()];
  };

  if (activeSortIndex !== undefined) {
    [...images].sort((a, b) => {
      const aValue = getSortableRowValues(a)[activeSortIndex];
      const bValue = getSortableRowValues(b)[activeSortIndex];

      if (activeSortDirection === 'asc') {
        return (aValue as string).localeCompare(bValue as string);
      }
      return (bValue as string).localeCompare(aValue as string);
    });
  }

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

  const [expandedBYONImageIDs, setExpandedBYONImageIDs] = React.useState<string[]>([]);
  const setBYONImageExpanded = (image: BYONImage, isExpanding = true) => {
    setExpandedBYONImageIDs((prevExpanded) => {
      const otherExpandedRepoNames = prevExpanded.filter((r) => r !== image.id);
      return isExpanding ? [...otherExpandedRepoNames, image.id] : otherExpandedRepoNames;
    });
  };
  const isBYONImageExpanded = (image: BYONImage) => {
    return expandedBYONImageIDs.includes(image.id);
  };
  const [BYONImageVisible, setBYONImageVisible] = React.useState<BYONImageEnabled[]>(
    images.map((image) => {
      return { id: image.id, visible: image.visible };
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
  const [tableFilter, setTableFilter] = React.useState<BYONImageTableFilter>({
    filter: '',
    option: 'name',
    count: images.length,
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
          aria-label="Select for image images table"
          onToggle={(isExpanded) => {
            setTableSelectIsOpen(isExpanded);
          }}
          onSelect={(_event, value) => {
            setSelected(value as string);
            const newCount = getFilterCount(tableFilter.filter, value);
            setTableFilter({
              filter: tableFilter.filter,
              option: value as BYONImageTableFilterOptions,
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
          aria-label="search input for image images table"
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
              count: images.length,
            });
          }}
        />
      </ToolbarItem>
      <ToolbarItem>
        <Button
          data-id="import-new-image"
          onClick={() => {
            navigate('add-new-image');
          }}
        >
          Add new image
        </Button>
      </ToolbarItem>
    </React.Fragment>
  );

  const applyTableFilter = (image: BYONImage): boolean => {
    if (
      tableFilter.filter !== '' &&
      image[tableFilter.option] &&
      tableFilter.option !== 'uploaded'
    ) {
      const BYONImageValue: string = image[tableFilter.option] as string;
      return !BYONImageValue.includes(tableFilter.filter);
    }
    if (
      tableFilter.filter !== '' &&
      image[tableFilter.option] &&
      tableFilter.option === 'uploaded'
    ) {
      const BYONImageValue: string = relativeTime(
        currentTimeStamp,
        new Date(image.uploaded as Date).getTime(),
      );
      return !BYONImageValue.includes(tableFilter.filter);
    }
    return false;
  };
  return (
    <React.Fragment>
      <DeleteImageModal
        image={currentImage}
        isOpen={deleteImageModalVisible}
        onDeleteHandler={forceUpdate}
        onCloseHandler={() => {
          setDeleteImageModalVisible(false);
        }}
      />
      <Toolbar data-id="toolbar-items">
        <ToolbarContent>{items}</ToolbarContent>
      </Toolbar>
      <TableComposable
        className={tableFilter.count === 0 ? 'empty-table' : ''}
        aria-label="Notebook images table"
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
          images.map((image, rowIndex) => {
            const packages: React.ReactNode[] = [];
            image.packages?.forEach((nbpackage, i) => {
              packages.push(
                <p key={nbpackage.name + i}>{`${nbpackage.name} ${nbpackage.version}`}</p>,
              );
            });
            return (
              <Tbody key={image.name + rowIndex} isExpanded={isBYONImageExpanded(image)}>
                <Tr isHidden={applyTableFilter(image)}>
                  <Td
                    expand={{
                      rowIndex,
                      isExpanded: isBYONImageExpanded(image),
                      onToggle: () => setBYONImageExpanded(image, !isBYONImageExpanded(image)),
                    }}
                  />
                  <Td dataLabel={columnNames.name}>{image.name}</Td>
                  <Td dataLabel={columnNames.description}>{image.description}</Td>
                  <Td dataLabel={columnNames.status}>{getPhase(image)}</Td>
                  <Td>
                    <Switch
                      className="enable-switch"
                      aria-label={`Enable Switch ${image.name}`}
                      data-id={`enabled-disable-${image.id}`}
                      isChecked={
                        BYONImageVisible.find((value) => {
                          return image.id === value.id;
                        })?.visible
                      }
                      onChange={() => {
                        updateBYONImage({
                          id: image.id,
                          visible: !image.visible,
                          packages: image.packages,
                        });
                        setBYONImageVisible(
                          BYONImageVisible.map((value) =>
                            image.id === value.id
                              ? { id: value.id, visible: !value.visible }
                              : value,
                          ),
                        );
                      }}
                    />
                  </Td>
                  <Td dataLabel={columnNames.user}>{image.user}</Td>
                  <Td dataLabel={columnNames.uploaded}>
                    {relativeTime(currentTimeStamp, new Date(image.uploaded as Date).getTime())}
                  </Td>
                  <Td isActionCell>
                    <ActionsColumn items={rowActions(image)} />
                  </Td>
                </Tr>
                <Tr isHidden={applyTableFilter(image)} isExpanded={isBYONImageExpanded(image)}>
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
                        <EmptyStateBody>Edit the image to add packages</EmptyStateBody>
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
                          count: images.length,
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
