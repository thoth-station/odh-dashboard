import React from 'react';
import { TableComposable, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  ExpandableSectionToggle,
  Flex,
  FlexItem,
  Pagination,
  PaginationVariant,
  SearchInput,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Tooltip,
} from '@patternfly/react-core';
import { CREPackage, CREPackageAnnotation } from 'types';
import './PackageTable.scss';
import { CubesIcon, OutlinedQuestionCircleIcon, PencilAltIcon } from '@patternfly/react-icons';
import { AddPackageModal } from './AddPackageModal';

/*
  A table where users can add packages to an image.
  Optionally the table can be autofilled with default 
  packages from annotations in the imagestream. The
  default packages cannot be removed, however they 
  can have their version changed
*/
export const PackageTable: React.FC<{
  packageAnnotations?: CREPackageAnnotation[];
  onChange: (value: string[]) => void;
}> = ({ packageAnnotations, onChange }) => {
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activeRow, setActiveRow] = React.useState<CREPackage | undefined>();
  const [searchValue, setSearchValue] = React.useState('');
  const [expanded, setExpanded] = React.useState(false);

  const [addedRows, setAddedRows] = React.useState<CREPackage[]>([]);

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
    specifier: 'Specifier',
    version: 'Version',
  };

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <div className="pf-u-box-shadow-sm">
      <AddPackageModal
        existingNames={addedRows.map((r) => r.name.toLowerCase())}
        defaultName={activeRow?.name}
        defaultVersion={activeRow?.version}
        defaultSpecifier={activeRow?.specifier}
        isOpen={isModalOpen}
        handleDelete={() => {
          const editedRows = addedRows.filter((value) => value.name !== activeRow?.name);
          setAddedRows(editedRows);
          onChange(
            editedRows.map((pkg) => `${pkg.name}${pkg.specifier ?? ''}${pkg.version ?? ''}`),
          );
          handleModalToggle();
        }}
        handleToggle={handleModalToggle}
        handleSave={(name, version, specifier) => {
          const newRow = {
            name: name,
            version: version,
            specifier: specifier,
          };
          const editedRows = addedRows.filter((value) => value.name !== activeRow?.name);
          editedRows.push(newRow);
          setAddedRows(editedRows);
          onChange(
            editedRows.map((pkg) => `${pkg.name}${pkg.specifier ?? ''}${pkg.version ?? ''}`),
          );
        }}
      />
      {addedRows.length === 0 && packageAnnotations?.length === 0 ? (
        <EmptyState variant={EmptyStateVariant.small}>
          <EmptyStateIcon icon={CubesIcon} />
          <Title headingLevel="h4" size="lg">
            No packages added
          </Title>
          <EmptyStateBody>Add packages to the image.</EmptyStateBody>
          <Button
            data-id={'add-package-button'}
            variant="secondary"
            onClick={() => {
              setActiveRow(undefined);
              handleModalToggle();
            }}
          >
            Add package
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
                  data-id={'add-packages-button'}
                  variant="primary"
                  onClick={() => {
                    setActiveRow(undefined);
                    handleModalToggle();
                  }}
                >
                  Add package
                </Button>
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
          <TableComposable variant="compact" aria-label="Selectable table">
            <Thead>
              <Tr>
                <Th>{columnNames.name}</Th>
                <Th>{columnNames.specifier}</Th>
                <Th>{columnNames.version}</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              <Tr isHoverable onRowClick={() => setExpanded(!expanded)}>
                <Td colSpan={4}>
                  <Flex>
                    <FlexItem spacer={{ default: 'spacerNone' }}>
                      <ExpandableSectionToggle
                        onToggle={() => null}
                        isExpanded={expanded}
                        direction="up"
                      >
                        {expanded ? 'Hide included packages' : 'Show included packages'}
                      </ExpandableSectionToggle>
                    </FlexItem>
                    <FlexItem>
                      <Tooltip
                        removeFindDomNode
                        content="Packages included in the base image cannot be removed."
                      >
                        <OutlinedQuestionCircleIcon />
                      </Tooltip>
                    </FlexItem>
                  </Flex>
                </Td>
              </Tr>
              {packageAnnotations?.map((row) => (
                <Tr
                  key={row.name + row.version}
                  isHidden={!expanded}
                  style={{
                    borderLeft: '3px solid var(--pf-global--primary-color--100)',
                  }}
                >
                  <Td dataLabel={columnNames.name}>{row.name}</Td>
                  <Td />
                  <Td dataLabel={columnNames.version}>{row.version}</Td>
                  <Td />
                </Tr>
              ))}
              {addedRows
                .sort((a, b) => a.name.localeCompare(b.name))
                .filter((row) => row.name.toLowerCase().includes(searchValue))
                .slice((page - 1) * perPage, (page - 1) * perPage + perPage)
                .map((row) => (
                  <Tr key={row.name}>
                    <Td dataLabel={columnNames.name}>{row.name}</Td>
                    <Td dataLabel={columnNames.specifier}>{row.specifier}</Td>
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
                  itemCount={addedRows.length}
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

export default PackageTable;
