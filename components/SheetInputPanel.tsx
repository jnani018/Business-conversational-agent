
import React from 'react';
import { SheetInfo } from '../types';
import { LoadingSpinnerIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons'; // Assuming you'll add these icons

interface SheetInputPanelProps {
  googleSheetUrl: string;
  onGoogleSheetUrlChange: (url: string) => void;
  sheetNameOrRange: string;
  onSheetNameOrRangeChange: (name: string) => void;
  onLoadSheetData: () => void;
  isLoading: boolean;
  error: string | null;
  loadedSheetInfo: SheetInfo | null;
  disabled?: boolean;
}

export const SheetInputPanel: React.FC<SheetInputPanelProps> = ({
  googleSheetUrl,
  onGoogleSheetUrlChange,
  sheetNameOrRange,
  onSheetNameOrRangeChange,
  onLoadSheetData,
  isLoading,
  error,
  loadedSheetInfo,
  disabled,
}) => {
  return (
    <div className="flex flex-col space-y-4 h-full">
      <h2 className="text-xl font-semibold text-sky-400">Sheet Data Input</h2>
      <p className="text-sm text-slate-400">
        Enter the URL of your Google Sheet and optionally specify a sheet name or range (e.g., "Sheet1" or "My Data!A1:F50").
        If no sheet name/range is provided, the AI will attempt to load the first sheet.
      </p>
      
      <div>
        <label htmlFor="googleSheetUrl" className="block text-sm font-medium text-slate-300 mb-1">
          Google Sheet URL
        </label>
        <input
          type="url"
          id="googleSheetUrl"
          value={googleSheetUrl}
          onChange={(e) => onGoogleSheetUrlChange(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/your_sheet_id/edit"
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-slate-100 placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled || isLoading}
          aria-describedby="url-help"
        />
        <p id="url-help" className="mt-1 text-xs text-slate-500">Ensure the sheet is either public or accessible with your Google Sheets API Key.</p>
      </div>

      <div>
        <label htmlFor="sheetNameOrRange" className="block text-sm font-medium text-slate-300 mb-1">
          Sheet Name or Range (Optional)
        </label>
        <input
          type="text"
          id="sheetNameOrRange"
          value={sheetNameOrRange}
          onChange={(e) => onSheetNameOrRangeChange(e.target.value)}
          placeholder="e.g., Sheet1 or SalesData!A1:G100"
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-slate-100 placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled || isLoading}
        />
      </div>

      <button
        onClick={onLoadSheetData}
        disabled={disabled || isLoading || !googleSheetUrl.trim()}
        className="w-full flex items-center justify-center p-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <LoadingSpinnerIcon className="w-5 h-5 mr-2" />
            Loading Sheet...
          </>
        ) : (
          "Load Sheet Data"
        )}
      </button>

      {disabled && !isLoading && (
         <div className="flex items-center p-3 bg-yellow-700/30 border border-yellow-600 rounded-md text-yellow-300 text-sm">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            Sheet input disabled. Check API key configuration.
        </div>
      )}

      {error && (
        <div className="flex items-center p-3 bg-red-700/30 border border-red-600 rounded-md text-red-300 text-sm" role="alert">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
          Error: {error}
        </div>
      )}
      
      {loadedSheetInfo && !error && !isLoading && (
        <div className="flex items-center p-3 bg-green-700/30 border border-green-600 rounded-md text-green-300 text-sm" role="status">
          <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
          Successfully loaded: "{loadedSheetInfo.name}" ({loadedSheetInfo.rows} rows, {loadedSheetInfo.cols} cols).
        </div>
      )}
      
      <p className="text-xs text-slate-500 mt-auto pt-2">
        Note: Very large sheets may take time to load or exceed processing limits. The analysis will be based on the data visible to the API key.
      </p>
    </div>
  );
};