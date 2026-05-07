import {
  Document,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

type TableColumn = {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
};

type TableRow = {
  values: string[];
};

type TableSection = {
  columns: TableColumn[];
  rows: TableRow[];
};

type PdfDocument = {
  companyName?: string;
  title?: string;
  subtitle?: string;
  tables: TableSection[];
  footer?: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  header: {
    marginBottom: 18,
    alignItems: 'center',
  },
  companyName: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 400,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    color: '#4b5563',
    textAlign: 'center',
  },
  table: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeaderCell: {
    backgroundColor: '#f3f4f6',
    fontWeight: 700,
  },
  tableCell: {
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#d1d5db',
  },
  alignLeft: {
    textAlign: 'left',
  },
  alignCenter: {
    textAlign: 'center',
  },
  alignRight: {
    textAlign: 'right',
  },
  footer: {
    marginTop: 18,
    fontSize: 8,
    color: '#6b7280',
  },
});

export function createPDFDocument(): PdfDocument {
  return { tables: [] };
}

export function addHeader(
  doc: PdfDocument,
  title: string,
  subtitle?: string,
  companyName?: string,
) {
  doc.companyName = companyName;
  doc.title = title;
  doc.subtitle = subtitle;
}

export function addTable(
  doc: PdfDocument,
  columns: TableColumn[],
  rows: TableRow[],
) {
  doc.tables.push({ columns, rows });
}

export function addFooter(doc: PdfDocument, footer: string) {
  doc.footer = footer;
}

export function finalizePDF(doc: PdfDocument) {
  return renderToBuffer(<GeneratedPDF doc={doc} />);
}

function GeneratedPDF({ doc }: { doc: PdfDocument }) {
  return (
    <Document title={doc.title} author="Certified Travel Media">
      <Page size="A4" style={styles.page}>
        {(doc.companyName || doc.title || doc.subtitle) && (
          <View style={styles.header}>
            {doc.companyName && (
              <Text style={styles.companyName}>{doc.companyName}</Text>
            )}
            {doc.title && <Text style={styles.title}>{doc.title}</Text>}
            {doc.subtitle && (
              <Text style={styles.subtitle}>{doc.subtitle}</Text>
            )}
          </View>
        )}

        {doc.tables.map((table, index) => (
          <View key={index} style={styles.table} wrap>
            <View style={styles.tableRow} fixed>
              {table.columns.map((column) => (
                <Text
                  key={column.header}
                  style={[
                    styles.tableCell,
                    styles.tableHeaderCell,
                    { width: column.width },
                    getAlignStyle(column.align),
                  ]}
                >
                  {column.header}
                </Text>
              ))}
            </View>

            {table.rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.tableRow} wrap={false}>
                {table.columns.map((column, columnIndex) => (
                  <Text
                    key={`${rowIndex}-${column.header}`}
                    style={[
                      styles.tableCell,
                      { width: column.width },
                      getAlignStyle(column.align),
                    ]}
                  >
                    {row.values[columnIndex] ?? ''}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ))}

        {doc.footer && <Text style={styles.footer}>{doc.footer}</Text>}
      </Page>
    </Document>
  );
}

function getAlignStyle(align: TableColumn['align']) {
  if (align === 'center') return styles.alignCenter;
  if (align === 'right') return styles.alignRight;
  return styles.alignLeft;
}
