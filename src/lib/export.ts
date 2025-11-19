import Papa from 'papaparse';

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T | string; label: string }[]
) {
  // Prepare data for export
  const exportData = data.map((record) => {
    const row: Record<string, any> = {};
    
    if (columns) {
      // Use specified columns
      columns.forEach((column) => {
        const key = String(column.key);
        const value = record[key];
        row[column.label] = formatValueForCSV(value);
      });
    } else {
      // Export all fields
      Object.keys(record).forEach((key) => {
        row[key] = formatValueForCSV(record[key]);
      });
    }
    
    return row;
  });

  // Convert to CSV
  const csv = Papa.unparse(exportData);

  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

function formatValueForCSV(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  return String(value);
}
