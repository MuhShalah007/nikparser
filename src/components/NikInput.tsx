import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface NikInputProps {
  onParse: (nik: string) => void;
  onClear?: () => void;
  isLoading: boolean;
}

export const NikInput = ({ onParse, onClear, isLoading }: NikInputProps) => {
  const [nik, setNik] = useState('');
  const [error, setError] = useState('');

  const handleNikChange = (value: string) => {
    const filtered = value.replace(/\D/g, '');
    setNik(filtered);
    setError('');
  };

  const handleParse = () => {
    if (!nik) {
      setError('NIK tidak boleh kosong');
      return;
    }

    if (nik.length !== 16) {
      setError('NIK harus 16 digit.');
      return;
    }

    setError('');
    onParse(nik);
  };

  const handleClear = () => {
    setNik('');
    setError('');
    onClear?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && nik.length === 16) {
      handleParse();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Input NIK</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="nik-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nomor Induk Kependudukan
          </label>
          <div className="relative">
            <input
              id="nik-input"
              type="text"
              value={nik}
              onChange={(e) => handleNikChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Masukkan 16 digit NIK"
              maxLength={16}
              className={`w-full px-4 py-3 pr-10 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isLoading}
            />
            {nik && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                type="button"
                aria-label="Clear input"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {nik.length}/16 digit - Hanya angka, tanpa spasi atau tanda baca.
          </p>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
          <button
            onClick={handleParse}
            disabled={isLoading || nik.length !== 16}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-sm"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Parse</span>
              </>
            )}
          </button>

          <button
            onClick={handleClear}
            disabled={isLoading || !nik}
            className="px-6 py-3 rounded-lg font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
