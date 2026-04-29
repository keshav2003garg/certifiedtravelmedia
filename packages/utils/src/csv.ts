/**
 * Wraps a single CSV field value in double-quotes when it contains commas,
 * double-quotes, or newlines, and escapes any existing double-quotes inside.
 */
export function escapeCsv(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export interface ParsedCsvRow {
  /**
   * 1-based line number in the original CSV file where this row begins
   * (header is line 1, first data row is typically line 2). Preserved across
   * blank-line filtering so error messages can point at the real file line.
   */
  line: number;
  values: Record<string, string>;
}

/**
 * Parses CSV text into an array of row objects keyed by the header row values.
 *
 * - First non-empty row is the header.
 * - Quoted fields are RFC-4180 compliant: they may span multiple lines and
 *   contain commas, line breaks, and `""` to embed a literal quote.
 * - Trailing empty lines are ignored.
 * - Rows where every field is empty are dropped, but original line numbers
 *   are preserved on the remaining rows via the `line` field.
 */
export function parseCsvRows(text: string): ParsedCsvRow[] {
  const normalised = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const records = parseCsvRecords(normalised);
  if (records.length === 0) return [];

  const headerFields = records[0]!.fields.map((h) =>
    h.trim().replace(/^"|"$/g, ''),
  );

  return records
    .slice(1)
    .filter((rec) => rec.fields.some((f) => f.length > 0))
    .map((rec) => {
      const values: Record<string, string> = {};
      headerFields.forEach((key, idx) => {
        values[key] = (rec.fields[idx] ?? '').trim();
      });
      return { line: rec.line, values };
    });
}

interface CsvRecord {
  /** 1-based line number in the original file where this record started. */
  line: number;
  fields: string[];
}

/**
 * Tokenises a normalised CSV string into an array of records (each a list of
 * raw field values). Handles quoted fields that span multiple lines.
 *
 * The `line` field on each record tracks the 1-based original line number,
 * accounting for newlines consumed inside quoted fields.
 */
function parseCsvRecords(text: string): CsvRecord[] {
  const records: CsvRecord[] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;
  let lineNumber = 1;
  let recordStartLine = 1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (ch === '\n') lineNumber++;
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ',') {
      current.push(field);
      field = '';
      continue;
    }

    if (ch === '\n') {
      current.push(field);
      records.push({ line: recordStartLine, fields: current });
      current = [];
      field = '';
      lineNumber++;
      recordStartLine = lineNumber;
      continue;
    }

    field += ch;
  }

  // Flush trailing partial record (file without final newline)
  if (field.length > 0 || current.length > 0) {
    current.push(field);
    records.push({ line: recordStartLine, fields: current });
  }

  return records;
}
