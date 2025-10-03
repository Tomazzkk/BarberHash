import * as XLSX from 'xlsx';

export const exportToCsv = (filename: string, rows: Record<string, any>[], headers: string[]) => {
  if (!rows || !rows.length) {
    return;
  }
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    headers.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        const rawValue = row[k];
        let cell: string;

        if (rawValue === null || rawValue === undefined) {
          cell = '';
        } else if (rawValue instanceof Date) {
          cell = rawValue.toLocaleString('pt-BR');
        } else {
          cell = String(rawValue).replace(/"/g, '""');
        }
        
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for BOM
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToXlsx = (filename: string, rows: Record<string, any>[], headers: string[]) => {
    if (!rows || !rows.length) {
        return;
    }
    const worksheet = XLSX.utils.json_to_sheet(rows, { skipHeader: true });
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
    XLSX.writeFile(workbook, filename);
};