import React, { useState, useCallback, useEffect } from 'react';
import { SheetInputPanel } from './components/SheetInputPanel';
import { ChatPanel } from './components/ChatPanel';
import { analyzeSheetDataWithGemini } from './services/geminiService';
import { fetchSheetDataAsCsv } from './services/googleSheetService';
import { ChatMessage, SenderType, SheetInfo } from './types';
import { LogoIcon } from './components/icons';

const App: React.FC = () => {
  const [sheetCsvData, setSheetCsvData] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const [sheetNameOrRange, setSheetNameOrRange] = useState<string>('');
  const [isSheetLoading, setIsSheetLoading] = useState<boolean>(false);
  const [sheetLoadError, setSheetLoadError] = useState<string | null>(null);
  const [loadedSheetInfo, setLoadedSheetInfo] = useState<SheetInfo | null>(null);

  const [isGeminiApiKeyMissing, setIsGeminiApiKeyMissing] = useState<boolean>(false);
  const [isGoogleSheetsApiKeyMissing, setIsGoogleSheetsApiKeyMissing] = useState<boolean>(false);

  useEffect(() => {
    // Corrected: Access VITE_ prefixed environment variables using import.meta.env
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      setIsGeminiApiKeyMissing(true);
      setAiError("Configuration error: Gemini API_KEY is missing.");
      setMessages(prev => [{
        id: 'gemini-api-key-error',
        text: "Critical Error: The Gemini API_KEY is not configured. AI features will not function. Please contact support or check your environment setup.",
        sender: SenderType.AI,
        timestamp: new Date().toISOString()
      }, ...prev]);
    }
    // Corrected: Access VITE_ prefixed environment variables using import.meta.env
    if (!import.meta.env.VITE_GOOGLE_SHEETS_API_KEY) {
      setIsGoogleSheetsApiKeyMissing(true);
      setSheetLoadError("Configuration error: GOOGLE_SHEETS_API_KEY is missing.");
      // Optionally, add an initial message about Sheets API key
    }
  }, []);

  const handleLoadSheetData = useCallback(async () => {
    if (!googleSheetUrl.trim()) {
      setSheetLoadError("Please enter a Google Sheet URL.");
      return;
    }
    if (isGoogleSheetsApiKeyMissing) {
      setSheetLoadError("Cannot load sheet: GOOGLE_SHEETS_API_KEY is missing.");
      return;
    }

    setIsSheetLoading(true);
    setSheetLoadError(null);
    setLoadedSheetInfo(null);
    setSheetCsvData(''); // Clear previous data

    try {
      const { csvData, sheetTitle, rowCount, colCount } = await fetchSheetDataAsCsv(
        googleSheetUrl,
        // Corrected: Access VITE_ prefixed environment variables using import.meta.env
        import.meta.env.VITE_GOOGLE_SHEETS_API_KEY!, // Asserting key exists due to check
        sheetNameOrRange
      );
      setSheetCsvData(csvData);
      setLoadedSheetInfo({ name: sheetTitle, rows: rowCount, cols: colCount });
      // Add a success message to chat or a dedicated status area
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now().toString() + '-sheet-load-success',
          text: `Successfully loaded data from sheet: "${sheetTitle}" (${rowCount} rows, ${colCount} columns). You can now ask questions about this data.`,
          sender: SenderType.AI,
          timestamp: new Date().toISOString(),
        }
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while loading sheet data.";
      setSheetLoadError(errorMessage);
      setLoadedSheetInfo(null); // Clear info on error
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now().toString() + '-sheet-load-error',
          text: `Failed to load sheet data: ${errorMessage}`,
          sender: SenderType.AI,
          timestamp: new Date().toISOString(),
        }
      ]);
    } finally {
      setIsSheetLoading(false);
    }
  }, [googleSheetUrl, sheetNameOrRange, isGoogleSheetsApiKeyMissing]);

  const handleSendMessage = useCallback(async (question: string) => {
    if (isGeminiApiKeyMissing) {
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now().toString() + '-user',
          text: question,
          sender: SenderType.USER,
          timestamp: new Date().toISOString()
        },
        {
          id: Date.now().toString() + '-ai-error',
          text: "Cannot process request: Gemini API_KEY is missing.",
          sender: SenderType.AI,
          timestamp: new Date().toISOString()
        }
      ]);
      return;
    }

    if (!sheetCsvData.trim()) {
      setAiError("Please load data from a Google Sheet first using the panel on the left.");
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now().toString() + '-user',
          text: question,
          sender: SenderType.USER,
          timestamp: new Date().toISOString()
        },
        {
          id: Date.now().toString() + '-ai-error',
          text: "No sheet data loaded. Please use the 'Sheet Data Input' panel to load your Google Sheet.",
          sender: SenderType.AI,
          timestamp: new Date().toISOString()
        }
      ]);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      text: question,
      sender: SenderType.USER,
      timestamp: new Date().toISOString()
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoadingAiResponse(true);
    setAiError(null);

    try {
      // Assuming analyzeSheetDataWithGemini also needs the Gemini API key,
      // you'll need to pass it here or ensure it's accessed correctly within geminiService.ts
      // For now, I'm assuming analyzeSheetDataWithGemini handles its own key access
      // and that your geminiService.ts will also use import.meta.env.VITE_GEMINI_API_KEY
      const aiResponseText = await analyzeSheetDataWithGemini(sheetCsvData, question);
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '-ai',
        text: aiResponseText,
        sender: SenderType.AI,
        timestamp: new Date().toISOString()
      };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setAiError(errorMessage);
      const aiErrorMessage: ChatMessage = {
        id: Date.now().toString() + '-ai-error',
        text: `Sorry, I encountered an error analyzing the data: ${errorMessage}`,
        sender: SenderType.AI,
        timestamp: new Date().toISOString()
      };
      setMessages(prevMessages => [...prevMessages, aiErrorMessage]);
    } finally {
      setIsLoadingAiResponse(false);
    }
  }, [sheetCsvData, isGeminiApiKeyMissing]);


  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-800 text-slate-100">
      <header className="bg-slate-900 p-4 shadow-md flex items-center space-x-3">
        <LogoIcon className="h-8 w-8 text-sky-400" />
        <h1 className="text-2xl font-semibold text-slate-100">Business Conversational Agent</h1>
      </header>

      {isGeminiApiKeyMissing && (
        <div className="p-2 bg-red-700 text-white text-center font-semibold text-sm">
          Gemini API Key is missing. AI chat functionality is disabled.
        </div>
      )}
      {isGoogleSheetsApiKeyMissing && (
        <div className="p-2 bg-orange-600 text-white text-center font-semibold text-sm">
          Google Sheets API Key is missing. Sheet loading functionality is disabled.
        </div>
      )}

      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-1/3 p-4 border-b md:border-b-0 md:border-r border-slate-700 overflow-y-auto">
          <SheetInputPanel
            googleSheetUrl={googleSheetUrl}
            onGoogleSheetUrlChange={setGoogleSheetUrl}
            sheetNameOrRange={sheetNameOrRange}
            onSheetNameOrRangeChange={setSheetNameOrRange}
            onLoadSheetData={handleLoadSheetData}
            isLoading={isSheetLoading}
            error={sheetLoadError}
            loadedSheetInfo={loadedSheetInfo}
            disabled={isGoogleSheetsApiKeyMissing || isSheetLoading}
          />
        </div>
        <div className="w-full md:w-2/3 flex flex-col h-full">
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoadingAiResponse}
            error={aiError} // Pass AI-specific error here
            disabled={isGeminiApiKeyMissing || !sheetCsvData.trim()} // Chat disabled if no Gemini key or no sheet data
          />
        </div>
      </div>
      <footer className="bg-slate-900 p-2 text-center text-xs text-slate-400">
        Powered by Gemini API & React. Requires API_KEY and GOOGLE_SHEETS_API_KEY environment variables.
      </footer>
    </div>
  );
};

export default App;

