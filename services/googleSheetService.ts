
// Helper function to convert 2D array to CSV string
function arrayToCsv(data: any[][]): string {
  if (!data || data.length === 0) {
    return '';
  }
  return data.map(row => 
    row.map(cell => {
      const cellStr = String(cell == null ? '' : cell); // handle null/undefined
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n') || cellStr.includes('\r')) {
        return `"${cellStr.replace(/"/g, '""')}"`; // Escape existing double quotes
      }
      return cellStr;
    }).join(',')
  ).join('\n');
}

// Helper to extract Spreadsheet ID from various Goolge Sheet URL formats
function extractSpreadsheetIdFromUrl(url: string): string | null {
  const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

interface SheetProperties {
  title: string;
}

interface Spreadsheet {
  properties: {
    title: string;
  };
  sheets: { properties: SheetProperties }[];
}

interface ValueRange {
  values?: any[][];
  range?: string; // e.g., 'Sheet1!A1:D5'
}

/**
 * Fetches data from a Google Sheet and returns it as a CSV string.
 * @param sheetUrl The full URL of the Google Sheet.
 * @param apiKey The Google Sheets API key.
 * @param sheetNameOrRange Optional specific sheet name (e.g., "Sheet1") or A1 notation range (e.g., "Sheet1!A1:Z100").
 *                         If not provided, attempts to fetch the first visible sheet.
 * @returns A promise that resolves to an object containing the CSV data, sheet title, row count, and column count.
 */
export const fetchSheetDataAsCsv = async (
  sheetUrl: string,
  apiKey: string,
  sheetNameOrRange?: string
): Promise<{ csvData: string; sheetTitle: string; rowCount: number; colCount: number; }> => {
  const spreadsheetId = extractSpreadsheetIdFromUrl(sheetUrl);
  if (!spreadsheetId) {
    throw new Error("Invalid Google Sheet URL. Could not extract Spreadsheet ID.");
  }

  if (!apiKey) {
    throw new Error("Google Sheets API key is required.");
  }

  let rangeToFetch = sheetNameOrRange?.trim() || '';

  try {
    // If no specific range/sheet name is given, fetch the first sheet's name
    if (!rangeToFetch) {
      const spreadsheetMetaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title&key=${apiKey}`;
      const metaResponse = await fetch(spreadsheetMetaUrl);
      if (!metaResponse.ok) {
        const errorData = await metaResponse.json().catch(() => ({}));
        throw new Error(`Failed to fetch sheet metadata: ${metaResponse.status} ${metaResponse.statusText}. ${errorData.error?.message || ''}`);
      }
      const spreadsheet: Spreadsheet = await metaResponse.json();
      if (spreadsheet.sheets && spreadsheet.sheets.length > 0) {
        rangeToFetch = spreadsheet.sheets[0].properties.title; // Use the title of the first sheet
         if (!rangeToFetch.includes('!')) { // If it's just a sheet name, append a large default range
            // This is a heuristic. For truly unbounded sheets, this might not get everything.
            // A more robust way might be to get dimensions, but this is simpler for now.
            // rangeToFetch += '!A1:Z1000'; // Or rely on API to return full sheet if only name is given
        }
      } else {
        throw new Error("No sheets found in the spreadsheet.");
      }
    }
    
    // Ensure range is URL encoded
    const encodedRange = encodeURIComponent(rangeToFetch);
    const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?key=${apiKey}`;
    
    const dataResponse = await fetch(dataUrl);
    if (!dataResponse.ok) {
      const errorData = await dataResponse.json().catch(() => ({}));
      throw new Error(`Failed to fetch sheet data for range "${rangeToFetch}": ${dataResponse.status} ${dataResponse.statusText}. ${errorData.error?.message || ''}`);
    }

    const result: ValueRange = await dataResponse.json();
    const values = result.values;

    if (!values || values.length === 0) {
      return { csvData: '', sheetTitle: rangeToFetch.split('!')[0] || 'Sheet', rowCount: 0, colCount: 0 };
    }

    const csvData = arrayToCsv(values);
    const rowCount = values.length;
    const colCount = values[0]?.length || 0;
    
    // The actual range returned by API might be more specific (e.g. 'Sheet1!A1:C50')
    // We can use the initially requested/derived sheet name for title if result.range is too complex
    const titleFromRange = result.range?.split('!')[0] || rangeToFetch.split('!')[0] || 'Loaded Sheet';

    return { csvData, sheetTitle: titleFromRange, rowCount, colCount };

  } catch (error) {
    console.error("Error fetching Google Sheet data:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred while fetching sheet data.");
  }
};