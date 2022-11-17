import React, { useEffect } from 'react';
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
import { CREPackageAnnotation } from 'types';
import './AnnotationsTable.scss';
import { CubesIcon, TrashIcon } from '@patternfly/react-icons';

export const AnnotationsTable: React.FC<{
  annotations?: CREPackageAnnotation[];
  label: 'packages' | 'software';
  setValue: (key: string, value: CREPackageAnnotation[]) => void;
}> = ({ annotations, label, setValue }) => {
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [searchValue, setSearchValue] = React.useState('');

  const [selectedRows, setSelectedRows] = React.useState<CREPackageAnnotation[]>([]);
  const [allRows, setAllRows] = React.useState<CREPackageAnnotation[]>([]);
  const [defaultRows, setDefaultRows] = React.useState<CREPackageAnnotation[]>([]);

  useEffect(() => {
    if (annotations !== undefined) {
      setDefaultRows(annotations);
      setAllRows(annotations);
      setSelectedRows(annotations);
    }
  }, [annotations]);

  useEffect(() => {
    setValue(label === 'software' ? 'software' : 'package' + 'Annotations', selectedRows);
  }, [selectedRows, setValue, label]);

  const isSelected = (row: CREPackageAnnotation) => {
    return selectedRows.some((r) => r.name === row.name);
  };

  const selectAll = (isSelecting: boolean) => {
    setSelectedRows(isSelecting ? allRows : []);
  };

  const onSelect = (row: CREPackageAnnotation, isSelecting: boolean) => {
    if (isSelecting) {
      const rows = [...selectedRows];
      rows.push(row);
      setSelectedRows(rows);
    }
    setSelectedRows((prev) => prev.filter((r) => r.name !== row.name));
  };

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

  const columnNames = {
    name: 'Name',
    version: 'Version',
  };

  const handleDelete = (row: CREPackageAnnotation) => {
    setSelectedRows((prev) => prev.filter((r) => r.name !== row.name));
    setAllRows((prev) => prev.filter((r) => r.name !== row.name));
  };

  return (
    <div className="pf-u-box-shadow-sm">
      {allRows.length === 0 ? (
        <EmptyState variant={EmptyStateVariant.small}>
          <EmptyStateIcon icon={CubesIcon} />
          <Title headingLevel="h4" size="lg">
            No {label === 'packages' ? 'package' : 'software'} annotations detected
          </Title>
          <EmptyStateBody>
            {label === 'packages' ? 'Package' : 'Software'} annotations are either empty or have
            been removed from the ImageStream.
          </EmptyStateBody>
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
            </ToolbarContent>
          </Toolbar>
          <TableComposable aria-label="Selectable table">
            <Thead>
              <Tr>
                <Th
                  select={{
                    onSelect: (_event, isSelecting) => selectAll(isSelecting),
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
                .sort((a, b) => a.name.localeCompare(b.name))
                .filter((row) => row.name.toLowerCase().includes(searchValue))
                .slice((page - 1) * perPage, (page - 1) * perPage + perPage)
                .map((row, rowIndex) => (
                  <Tr key={row.name}>
                    <Td
                      select={{
                        rowIndex,
                        onSelect: (_event, isSelecting) => onSelect(row, isSelecting),
                        isSelected: isSelected(row),
                      }}
                    />
                    <Td dataLabel={columnNames.name}>{row.name}</Td>
                    <Td dataLabel={columnNames.version}>{row.version}</Td>
                    <Td style={{ textAlign: 'right' }}>
                      {!defaultRows.some((r) => r.name === row.name) && (
                        <Button
                          data-id="edit-package-software-button"
                          variant="plain"
                          icon={<TrashIcon />}
                          iconPosition="right"
                          onClick={() => handleDelete(row)}
                        />
                      )}
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

export default AnnotationsTable;
