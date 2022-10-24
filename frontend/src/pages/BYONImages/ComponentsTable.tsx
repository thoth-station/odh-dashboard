import React from 'react';
import { TableComposable, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Pagination,
  PaginationVariant,
  SearchInput,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { BYONImagePackage } from 'types';
import './ComponentTable.scss';
import { CubesIcon, PencilAltIcon } from '@patternfly/react-icons';
import { AddComponentModal } from './AddComponentModal';

export const ComponentsTable: React.FC<{
  selectedRows: BYONImagePackage[];
  defaultRows?: BYONImagePackage[];
  label: 'software' | 'packages';
  setValue: (key: string, value: unknown) => void;
}> = ({ selectedRows, defaultRows, label, setValue }) => {
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  const [allRows, setAllRows] = React.useState<BYONImagePackage[]>([]);

  React.useEffect(() => {
    if (defaultRows) {
      setAllRows(defaultRows);
    }
  }, [defaultRows]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const [activeRow, setActiveRow] = React.useState<BYONImagePackage | undefined>();

  const [searchValue, setSearchValue] = React.useState('');

  const onSetPage = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const onPerPageSelect = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPerPage: number,
    newPage: number,
  ) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const setRowSelected = (row: BYONImagePackage, isSelecting = true) => {
    if (isSelecting) {
      // add to state
      setValue(label, [...selectedRows, row]);
    } else {
      // remove from state
      setValue(
        label,
        selectedRows.filter((r) => r.name !== row.name),
      );
    }
  };

  const selectAllRows = (isSelecting = true) => setValue(label, isSelecting ? allRows : []);

  const isRowSelected = (row: BYONImagePackage) => selectedRows.some((r) => r.name === row.name);

  const columnNames = {
    name: 'Name',
    version: 'Version',
  };

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <div className="pf-u-box-shadow-sm">
      <AddComponentModal
        existingNames={allRows.map((r) => r.name.toLowerCase())}
        defaultName={activeRow?.name}
        defaultVersion={activeRow?.version}
        isOpen={isModalOpen}
        label={label}
        handleDelete={() => {
          // remove from selected rows state
          if (activeRow && isRowSelected(activeRow)) {
            setValue(
              label,
              selectedRows.filter((value) => value.name !== activeRow?.name),
            );
          }

          // remove from all rows as it no longer exists
          setAllRows((prevRows) => prevRows.filter((value) => value.name !== activeRow?.name));
          handleModalToggle();
        }}
        handleToggle={handleModalToggle}
        handleSave={(name, version, key) => {
          const newRow = {
            name: name,
            version: version,
            visible: true,
          };
          // remove existing if exists
          const index = allRows.findIndex((value) => value.name === key);
          const allEditedRows = allRows.filter((value) => value.name !== key);
          const selectedEditedRows = selectedRows.filter((value) => value.name !== key);

          // add new row to each list
          allEditedRows.splice(index === -1 ? 0 : index, 0, newRow);
          setAllRows(allEditedRows);

          selectedEditedRows.splice(0, 0, newRow);
          setValue(label, selectedEditedRows);
        }}
      />
      {allRows.length === 0 ? (
        <EmptyState variant={EmptyStateVariant.small}>
          <EmptyStateIcon icon={CubesIcon} />
          <Title headingLevel="h4" size="lg">
            No {label} added
          </Title>
          <EmptyStateBody>Select the {label} to be included in the new image.</EmptyStateBody>
          <Button
            data-id={'add-' + label + '-button'}
            variant="secondary"
            onClick={() => {
              setActiveRow(undefined);
              handleModalToggle();
            }}
          >
            Add {label === 'packages' ? 'package' : 'software'}
          </Button>
        </EmptyState>
      ) : (
        <React.Fragment>
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem variant="search-filter">
                <SearchInput
                  placeholder="Filter by name"
                  value={searchValue}
                  onChange={(value) => {
                    setSearchValue(value);
                    setPage(1);
                  }}
                  onClear={() => setSearchValue('')}
                />
              </ToolbarItem>
              <ToolbarItem variant="separator" />
              <ToolbarItem>
                <Button
                  data-id={'add-' + label + '-button'}
                  variant="primary"
                  onClick={() => {
                    setActiveRow(undefined);
                    handleModalToggle();
                  }}
                >
                  Add {label === 'packages' ? 'package' : 'software'}
                </Button>
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
          <TableComposable aria-label="Selectable table">
            <Thead>
              <Tr>
                <Th
                  select={{
                    onSelect: (_event, isSelecting) => selectAllRows(isSelecting),
                    isSelected: selectedRows.length === allRows.length,
                  }}
                />
                <Th>{columnNames.name}</Th>
                <Th>{columnNames.version}</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {allRows
                .filter((row) => row.name.toLowerCase().includes(searchValue))
                .slice((page - 1) * perPage, (page - 1) * perPage + perPage)
                .map((row, rowIndex) => (
                  <Tr key={row.name}>
                    <Td
                      select={{
                        rowIndex,
                        onSelect: (_event, isSelecting) => setRowSelected(row, isSelecting),
                        isSelected: isRowSelected(row),
                      }}
                    />
                    <Td dataLabel={columnNames.name}>{row.name}</Td>
                    <Td dataLabel={columnNames.version}>{row.version}</Td>
                    <Td style={{ textAlign: 'right' }}>
                      <Button
                        data-id="edit-package-software-button"
                        variant="plain"
                        icon={<PencilAltIcon />}
                        iconPosition="right"
                        onClick={() => {
                          setActiveRow(row);
                          handleModalToggle();
                        }}
                      />
                    </Td>
                  </Tr>
                ))}
            </Tbody>
          </TableComposable>
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem variant="pagination">
                <Pagination
                  perPageComponent="button"
                  itemCount={allRows.length}
                  perPage={perPage}
                  page={page}
                  onSetPage={onSetPage}
                  widgetId="pagination-options-menu-top"
                  onPerPageSelect={onPerPageSelect}
                  variant={PaginationVariant.bottom}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
        </React.Fragment>
      )}
    </div>
  );
};
