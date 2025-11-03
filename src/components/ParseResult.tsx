import { CheckCircle, XCircle, ChevronDown, ChevronUp, Database, AlertCircle, Edit3, Save, RotateCcw, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { generateNik, type NikParseResult } from '../lib/nikParser';
import { getProvinces, getCitiesByProvince, getDistrictsByCity, type Province, type City, type District } from '../lib/regionData';
import { saveToHistory } from '../lib/storage';

interface ParseResultProps {
  result: NikParseResult | null;
  onHistoryChange?: () => void;
}

export const ParseResult = ({ result, onHistoryChange }: ParseResultProps) => {
  const [showAdditional, setShowAdditional] = useState(false);
  const [showJson, setShowJson] = useState(false);
  
  // State for direct editing
  const [isEditing, setIsEditing] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  // Editing state - directly tied to the NIK components
  const [provinsiCode, setProvinsiCode] = useState('');
  const [kabkotaCode, setKabkotaCode] = useState('');
  const [kecamatanCode, setKecamatanCode] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [uniqcode, setUniqcode] = useState('');
  
  // Preview state
  const [previewNik, setPreviewNik] = useState('');
  const [previewResult, setPreviewResult] = useState<NikParseResult | null>(null);
  const [currentNikData, setCurrentNikData] = useState(result?.data || null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Track the original NIK to know when it changes
  const [originalNik, setOriginalNik] = useState<string | null>(null);

  useEffect(() => {
    if (result?.status === 'success' && result.data) {
      const nik = result.data.nik;
      
      // Check if this is a new NIK (different from the original we were showing)
      const isDifferentNik = originalNik && originalNik !== nik;
      
      const provCode = nik.substring(0, 2);
      const cityCode = nik.substring(0, 4);
      const districtCode = nik.substring(0, 6);

      // Set the direct editing values
      setProvinsiCode(provCode);
      setKabkotaCode(cityCode);
      setKecamatanCode(districtCode);

      const [day, month, year] = result.data.lahir.split('/');
      const fullYear = parseInt(year) < 100 ? (parseInt(year) > 50 ? `19${year}` : `20${year}`) : year;
      setBirthDate(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);

      setGender(result.data.kelamin === 'LAKI-LAKI' ? 'L' : 'P');
      setUniqcode(result.data.uniqcode);
      
      // Update the original NIK
      setOriginalNik(nik);
      
      // If this is a new NIK (not just initial load), exit edit mode and reset
      if (isDifferentNik) {
        setIsEditing(false);
        
        // Reset preview and current data to original
        setPreviewNik('');
        setPreviewResult(null);
        setCurrentNikData(null);
      }
      
      // Auto-save to history whenever a new result comes in (not in editing mode)
      if (!isEditing || isDifferentNik) {
        saveToHistory(nik, result);
        onHistoryChange?.();
      }
    }
  }, [result, isEditing, originalNik, onHistoryChange]);

  const loadProvinces = useCallback(async () => {
    if (isEditing) {
      const prov = await getProvinces();
      setProvinces(prov);
    }
  }, [isEditing]);

  // Load provinces when editing mode is enabled
  useEffect(() => {
    if (isEditing) {
      loadProvinces();
    }
  }, [isEditing, loadProvinces]);

  // Load cities when province code changes (only in edit mode)
  useEffect(() => {
    if (isEditing && provinsiCode) {
      const loadCities = async () => {
        const kabkotaList = await getCitiesByProvince(provinsiCode);
        setCities(kabkotaList);
      };
      loadCities();
    }
  }, [isEditing, provinsiCode]);

  // Load districts when city code changes (only in edit mode)
  useEffect(() => {
    if (isEditing && kabkotaCode) {
      const loadDistricts = async () => {
        const kecamatanList = await getDistrictsByCity(kabkotaCode);
        setDistricts(kecamatanList);
      };
      loadDistricts();
    }
  }, [isEditing, kabkotaCode]);

  const handleProvinceChange = async (code: string) => {
    setProvinsiCode(code);
    setKabkotaCode('');
    setKecamatanCode('');
    setCities([]);
    setDistricts([]);
    setMessage(null);

    if (code) {
      const kabkotaList = await getCitiesByProvince(code);
      setCities(kabkotaList);
    }
  };

  const handleCityChange = async (code: string) => {
    setKabkotaCode(code);
    setKecamatanCode('');
    setDistricts([]);
    setMessage(null);

    if (code) {
      const kecamatanList = await getDistrictsByCity(code);
      setDistricts(kecamatanList);
    }
  };

  const handleDistrictChange = (code: string) => {
    setKecamatanCode(code);
    setMessage(null);
  };

  // Auto-update preview when editing fields change (only when in edit mode)
  useEffect(() => {
    if (isEditing && provinsiCode && kabkotaCode && kecamatanCode && birthDate && uniqcode) {
      const autoUpdatePreview = async () => {
        try {
          const nik = generateNik({
            provinsiCode,
            kabkotaCode,
            kecamatanCode,
            birthDate: new Date(birthDate),
            gender,
            uniqcode: uniqcode.padStart(4, '0')
          });

          setPreviewNik(nik);

          // Parse the new NIK to get the updated information
          try {
            const parser = await import('../lib/nikParser');
            const parseResult = await parser.parseNik(nik);
            setPreviewResult(parseResult);
            setCurrentNikData(parseResult.data || null);

            if (parseResult.status === 'success') {
              setMessage({ type: 'info', text: 'NIK valid dan siap disimpan' });
            }
          } catch {
            setPreviewResult({ status: 'error', pesan: 'NIK tidak valid' });
            setCurrentNikData(null);
            setMessage({ type: 'error', text: 'NIK tidak valid' });
          }
        } catch (error) {
          console.error('Auto update error:', error);
          setPreviewNik('');
          setPreviewResult(null);
          setCurrentNikData(null);
          setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Gagal memperbarui NIK' });
        }
      };

      // Use a timeout to avoid excessive updates while user is typing/interacting
      const timeoutId = setTimeout(autoUpdatePreview, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isEditing, provinsiCode, kabkotaCode, kecamatanCode, birthDate, gender, uniqcode]);

  const handleSave = () => {
    if (previewResult?.status === 'success' && previewResult.data) {
      saveToHistory(previewNik, previewResult);
      setMessage({ type: 'success', text: 'NIK berhasil disimpan ke history!' });
      onHistoryChange?.();
      // Stay in editing mode to allow further changes if needed
    }
  };

  const handleReset = () => {
    if (result?.status === 'success' && result.data) {
      const nik = result.data.nik;
      setProvinsiCode(nik.substring(0, 2));
      setKabkotaCode(nik.substring(0, 4));
      setKecamatanCode(nik.substring(0, 6));

      const [day, month, year] = result.data.lahir.split('/');
      const fullYear = parseInt(year) < 100 ? (parseInt(year) > 50 ? `19${year}` : `20${year}`) : year;
      setBirthDate(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);

      setGender(result.data.kelamin === 'LAKI-LAKI' ? 'L' : 'P');
      setUniqcode(result.data.uniqcode);
      
      setPreviewNik('');
      setPreviewResult(null);
      setMessage(null);
    }
  };

  if (!result) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Masukkan NIK untuk melihat hasil parsing</p>
        </div>
      </div>
    );
  }

  const isValid = result.status === 'success';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Hasil Parse</h2>
        {isValid && (
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleReset}
                  className="text-sm bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-all font-medium flex items-center space-x-1"
                  title="Reset to original values"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={!previewResult || previewResult.status !== 'success'}
                  className="text-sm bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium flex items-center space-x-1"
                  title="Save generated NIK to history"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-sm bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-all font-medium flex items-center space-x-1"
                  title="Cancel editing"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={async () => {
                    if (previewResult?.status === 'success' && previewNik && currentNikData) {
                      saveToHistory(previewNik, previewResult);
                      setMessage({ type: 'success', text: 'NIK berhasil disimpan ke history!' });
                      onHistoryChange?.();
                      // Wait a bit to show the message before changing mode
                      setTimeout(() => {
                        setIsEditing(false);
                        setCurrentNikData(result?.data || null); // Reset to original after saving
                      }, 1000);
                    } else {
                      setIsEditing(false);
                    }
                  }}
                  className="text-sm bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-all font-medium"
                >
                  Done
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all font-medium flex items-center space-x-1"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className={`flex items-center space-x-3 p-4 rounded-lg ${
        isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        {isValid ? (
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
        ) : (
          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
        )}
        <div className="flex-1">
          <p className={`font-semibold ${isValid ? 'text-green-800' : 'text-red-800'}`}>
            {result.pesan}
          </p>
        </div>
      </div>

      {isValid && result.data && (
        <div className="space-y-4">
          {/* NIK Display - Always visible */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">NIK</p>
              <p className="text-lg font-mono font-semibold text-gray-900">{previewNik || result.data.nik}</p>
            </div>
            
            {/* Gender - Editable when in edit mode */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Jenis Kelamin</p>
              {isEditing ? (
                <div className="flex space-x-2">
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="gender-edit"
                      value="L"
                      checked={gender === 'L'}
                      onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-semibold text-gray-900">L</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="gender-edit"
                      value="P"
                      checked={gender === 'P'}
                      onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-semibold text-gray-900">P</span>
                  </label>
                </div>
              ) : (
                <p className="text-lg font-semibold text-gray-900">{currentNikData?.kelamin || result.data.kelamin}</p>
              )}
            </div>
          </div>

          {/* Birth Date - Editable when in edit mode */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Tanggal Lahir</p>
            {isEditing ? (
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-lg font-semibold text-gray-900">{currentNikData?.lahir || result.data.lahir}</p>
            )}
          </div>

          {/* Location Information - Editable when in edit mode */}
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="text-xs text-gray-500">Provinsi</p>
              {isEditing ? (
                <select
                  value={provinsiCode}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full mt-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Pilih Provinsi</option>
                  {provinces.map(prov => (
                    <option key={prov.code} value={prov.code}>
                      {prov.code} - {prov.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="font-semibold text-gray-900">{currentNikData?.provinsi || result.data.provinsi}</p>
              )}
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="text-xs text-gray-500">Kabupaten/Kota</p>
              {isEditing ? (
                <select
                  value={kabkotaCode}
                  onChange={(e) => handleCityChange(e.target.value)}
                  disabled={!provinsiCode}
                  className="w-full mt-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Pilih Kab/Kota</option>
                  {cities.map(city => (
                    <option key={city.code} value={city.code}>
                      {city.code} - {city.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="font-semibold text-gray-900">{currentNikData?.kotakab || result.data.kotakab}</p>
              )}
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="text-xs text-gray-500">Kecamatan</p>
              {isEditing ? (
                <select
                  value={kecamatanCode}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={!kabkotaCode}
                  className="w-full mt-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Pilih Kecamatan</option>
                  {districts.map(district => (
                    <option key={district.code} value={district.code}>
                      {district.code} - {district.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="font-semibold text-gray-900">{currentNikData?.kecamatan || result.data.kecamatan}</p>
              )}
            </div>
          </div>

          {/* Unique Code - Editable when in edit mode */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Unique Code</p>
            {isEditing ? (
              <input
                type="text"
                value={uniqcode}
                onChange={(e) => setUniqcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0001"
                maxLength={4}
                className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-lg font-mono font-semibold text-gray-900">{currentNikData?.uniqcode || result.data.uniqcode}</p>
            )}
          </div>

          {/* Generated NIK Preview when editing */}  
          {isEditing && previewNik && (
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-600 mb-2">NIK yang dihasilkan:</p>
              <p className="text-2xl font-mono font-bold text-purple-900 break-all">{previewNik}</p>
              <div className="mt-2 flex items-center space-x-2">
                {previewResult?.status === 'success' ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Diprediksi valid
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Format tidak valid
                  </span>
                )}
              </div>
              
              {previewResult?.status === 'success' && previewResult.data && (
                <div className="mt-3 bg-white p-3 rounded border grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600 text-xs">Provinsi</span>
                    <span className="block font-medium">{previewResult.data.provinsi}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 text-xs">Kab/Kota</span>
                    <span className="block font-medium">{previewResult.data.kotakab}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 text-xs">Kecamatan</span>
                    <span className="block font-medium">{previewResult.data.kecamatan}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 text-xs">Tgl Lahir</span>
                    <span className="block font-medium">{previewResult.data.lahir}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {message && isEditing && (
            <div className={`flex items-center space-x-3 p-3 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 border border-green-200' :
              message.type === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                message.type === 'success' ? 'text-green-600' :
                message.type === 'error' ? 'text-red-600' :
                'text-blue-600'
              }`} />
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' :
                message.type === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {result.data.tambahan && (
            <div className="border-t pt-4">
              <button
                onClick={() => setShowAdditional(!showAdditional)}
                className="flex items-center justify-between w-full text-left font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <span>Informasi Tambahan</span>
                {showAdditional ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {showAdditional && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-500 mb-1">Kode Pos</p>
                    <p className="font-semibold text-gray-900">{currentNikData?.tambahan?.kodepos || result.data.tambahan.kodepos}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-500 mb-1">Usia</p>
                    <p className="font-semibold text-gray-900">{currentNikData?.tambahan?.usia || result.data.tambahan.usia}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-500 mb-1">Zodiak</p>
                    <p className="font-semibold text-gray-900">{currentNikData?.tambahan?.zodiak || result.data.tambahan.zodiak}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-500 mb-1">Ulang Tahun</p>
                    <p className="font-semibold text-gray-900">{currentNikData?.tambahan?.ultah || result.data.tambahan.ultah}</p>
                  </div>
                  <div className="bg-white p-3 rounded border col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Pasaran Jawa</p>
                    <p className="font-semibold text-gray-900">{currentNikData?.tambahan?.pasaran || result.data.tambahan.pasaran}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <button
              onClick={() => setShowJson(!showJson)}
              className="flex items-center justify-between w-full text-left font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span>JSON Data</span>
              {showJson ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {showJson && (
              <pre className="mt-4 bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(
                  isEditing && currentNikData 
                    ? { 
                        status: 'success', 
                        pesan: 'Hasil edit', 
                        data: currentNikData 
                      } 
                    : result, 
                  null, 2
                )}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};