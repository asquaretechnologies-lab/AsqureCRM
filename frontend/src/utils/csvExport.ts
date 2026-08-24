export interface CSVColumn<T = any> {
  key: keyof T | string;
  label: string;
  formatter?: (val: any, item: T) => string;
}

export function exportToCSV<T extends Record<string, any>>(
  filename: string,
  columns: CSVColumn<T>[],
  data: T[]
) {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Header row
  const headers = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');

  // Data rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        let val: any = undefined;
        if (col.formatter) {
          val = col.formatter(item[col.key], item);
        } else {
          val = item[col.key];
        }

        if (val === null || val === undefined) {
          val = '';
        } else if (typeof val === 'object') {
          val = JSON.stringify(val);
        } else {
          val = String(val);
        }

        // Escape double quotes and wrap in quotes
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(',');
  });

  const csvContent = [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
