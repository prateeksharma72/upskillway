import React, { useState, useMemo } from 'react';
import './DataTable.scss';

const DataTable = ({ data, columns, itemsPerPage = 10, title }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const sortedData = useMemo(() => {
    if (!data) return [];
    let sortableData = [...data];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = data ? Math.ceil(data.length / itemsPerPage) : 0;

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIndicator = (columnKey) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return '';
  };

  if (!data || data.length === 0) {
    return <p className="no-data-message">{title ? `${title}: ` : ""}No data available.</p>;
  }

  return (
    <div className="data-table-container">
      {title && <h3>{title}</h3>}
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th 
                key={col.accessor} 
                onClick={() => col.sortable !== false && requestSort(col.accessor)}
                className={col.sortable !== false ? 'sortable' : ''}
              >
                {col.Header}
                {col.sortable !== false && getSortIndicator(col.accessor)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col) => {
                // Get the cell value
                const value = row[col.accessor];
                
                // If a custom Cell renderer is provided, use it
                if (col.Cell) {
                  // Pass the cell props object that react-table would normally pass
                  const cellProps = {
                    value: value,
                    row: { original: row },
                    column: col
                  };
                  return (
                    <td key={`${rowIndex}-${col.accessor}`}>
                      {col.Cell(cellProps)}
                    </td>
                  );
                }
                
                // Default rendering
                return (
                  <td key={`${rowIndex}-${col.accessor}`}>
                    {typeof value === 'number' ? 
                      (Number.isInteger(value) ? 
                        value.toLocaleString() : 
                        parseFloat(value.toFixed(4)).toLocaleString(undefined, 
                          {minimumFractionDigits: 2, maximumFractionDigits: 4})
                      ) : 
                      (value || '-')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DataTable;