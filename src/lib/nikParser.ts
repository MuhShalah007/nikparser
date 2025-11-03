import nikParseCode from './nik_parse.js?raw';

export interface NikParseResult {
  status: 'success' | 'error';
  pesan: string;
  data?: {
    nik: string;
    kelamin: string;
    lahir: string;
    provinsi: string;
    kotakab: string;
    kecamatan: string;
    uniqcode: string;
    tambahan: {
      kodepos: string;
      pasaran: string;
      usia: string;
      ultah: string;
      zodiak: string;
    };
  };
}

let nikParseFunction: ((nik: string, callback: (result: NikParseResult) => void) => void) | null = null;
let isLoading = false;
let loadError: string | null = null;

export const loadNikParser = async (): Promise<void> => {
  if (nikParseFunction) return;
  if (isLoading) {
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  isLoading = true;
  try {
    const wrappedCode = `
      ${nikParseCode}
      return nikParse;
    `;

    nikParseFunction = new Function(wrappedCode)();
    loadError = null;
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Failed to load NIK parser';
    throw new Error(loadError);
  } finally {
    isLoading = false;
  }
};

export const parseNik = async (nik: string): Promise<NikParseResult> => {
  await loadNikParser();

  if (!nikParseFunction) {
    return {
      status: 'error',
      pesan: loadError || 'Parser tidak tersedia'
    };
  }

  return new Promise((resolve) => {
    nikParseFunction!(nik, (result) => {
      resolve(result);
    });
  });
};

export const generateNik = (params: {
  provinsiCode: string;
  kabkotaCode: string;
  kecamatanCode: string;
  birthDate: Date;
  gender: 'L' | 'P';
  uniqcode: string;
}): string => {
  const { provinsiCode, kabkotaCode, kecamatanCode, birthDate, gender, uniqcode } = params;

  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;
  const year = birthDate.getFullYear();

  const adjustedDay = gender === 'P' ? day + 40 : day;

  const dayStr = adjustedDay.toString().padStart(2, '0');
  const monthStr = month.toString().padStart(2, '0');
  const yearStr = year.toString().slice(-2);

  // Extract only the additional digits for each level
  // provinsiCode: "33" (2 digits)
  // kabkotaCode: "3310" (province + kabkota), so we only need last 2: "10"
  // kecamatanCode: "331011" (province + kabkota + kecamatan), so we only need last 2: "11"
  const provincePart = provinsiCode.substring(0, 2);
  const cityPart = kabkotaCode.substring(2, 4);  // Last 2 digits of kabkotaCode
  const districtPart = kecamatanCode.substring(4, 6);  // Last 2 digits of kecamatanCode

  const nik = `${provincePart}${cityPart}${districtPart}${dayStr}${monthStr}${yearStr}${uniqcode}`;

  return nik;
};

export const validateNikFormat = (nik: string): { valid: boolean; error?: string } => {
  if (!nik) {
    return { valid: false, error: 'NIK tidak boleh kosong' };
  }

  if (!/^\d+$/.test(nik)) {
    return { valid: false, error: 'Hanya angka yang diperbolehkan.' };
  }

  if (nik.length !== 16) {
    return { valid: false, error: 'NIK harus 16 digit.' };
  }

  return { valid: true };
};
