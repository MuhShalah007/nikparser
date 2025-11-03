import { useState, useEffect } from 'react';
import { Database, FileText, History, Trash2, Sun, Moon } from 'lucide-react';
import { useTheme } from './contexts/ThemeContext';
import { NikInput } from './components/NikInput';
import { ParseResult } from './components/ParseResult';
import { parseNik, type NikParseResult } from './lib/nikParser';
import { getHistory, removeFromHistory, clearHistory, type HistoryItem } from './lib/storage';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [parseResult, setParseResult] = useState<NikParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    setHistory(getHistory());
  };

  const handleParse = async (nik: string) => {
    setIsLoading(true);
    // Switch to result view when parsing
    setShowHistory(false);

    try {
      const result = await parseNik(nik);
      setParseResult(result);
    } catch (error) {
      console.error('Parse error:', error);
      setParseResult({
        status: 'error',
        pesan: 'Terjadi kesalahan saat parsing NIK: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromHistory = (nik: string) => {
    removeFromHistory(nik);
    loadHistory();
  };

  const handleClearHistory = () => {
    if (confirm('Hapus semua history?')) {
      clearHistory();
      loadHistory();
    }
  };

  const handleLoadFromHistory = (item: HistoryItem) => {
    setParseResult(item.result);
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">NikParser</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Parse & Validasi NIK Indonesia</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center space-x-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                  showHistory 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <History className="w-4 h-4" />
                <span>History ({history.length})</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <NikInput onParse={handleParse} onClear={() => setParseResult(null)} isLoading={isLoading} />
          </div>

          <div className="lg:col-span-2">
            {showHistory && history.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">History ({history.length})</h2>
                  <button
                    onClick={handleClearHistory}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center space-x-1 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Semua</span>
                  </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {history.map((item) => (
                    <div
                      key={item.nik}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                      onClick={() => handleLoadFromHistory(item)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-mono font-semibold text-gray-900 dark:text-gray-100 truncate">{item.nik}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.result.data?.provinsi} • {new Date(item.timestamp).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromHistory(item.nik);
                        }}
                        className="ml-2 p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ParseResult
                result={parseResult}
                onHistoryChange={loadHistory}
              />
            )}
          </div>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tentang NikParser</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                NikParser adalah aplikasi web untuk parsing dan validasi Nomor Induk Kependudukan (NIK) Indonesia.
                Aplikasi ini dapat mengekstrak informasi provinsi, kabupaten/kota, kecamatan, tanggal lahir, jenis kelamin,
                dan informasi tambahan lainnya dari NIK 16 digit.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white mb-1">Parse NIK</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Ekstrak informasi dari NIK 16 digit</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white mb-1">Cek Database</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Validasi keberadaan NIK di database</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white mb-1">Generate Varian</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Buat NIK baru dengan modifikasi wilayah</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-8 sm:mt-12 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            NikParser menggunakan{' '}
            <a
              href="https://github.com/bachors/nik_parse.js"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              nik_parse.js
            </a>
            {' '}untuk parsing NIK
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
