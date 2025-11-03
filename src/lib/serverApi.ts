// Server-side API implementation for NIK parsing
// This uses the same parsing logic but is designed for server-side usage

// Import the local NIK parser code
import nikParseCode from './nik_parse.js?raw';

interface NikParseResult {
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

// This function mimics the client-side parsing behavior for the API
async function parseNikForApi(nik: string): Promise<NikParseResult> {
  try {
    // Basic format validation first
    if (!nik || !/^\d+$/.test(nik) || nik.length !== 16) {
      return {
        status: 'error',
        pesan: 'Format NIK tidak valid. NIK harus 16 digit angka.'
      };
    }

    // Use the local parser code
    const wrappedCode = `
      ${nikParseCode}
      return nikParse;
    `;

    // Create a function that can parse the NIK
    const nikParseFunction = new Function(wrappedCode)() as (nik: string, callback: (result: NikParseResult) => void) => void;

    return new Promise((resolve) => {
      nikParseFunction(nik, (result) => {
        resolve(result);
      });
    });
  } catch (error) {
    return {
      status: 'error',
      pesan: 'Gagal memproses NIK: ' + (error instanceof Error ? error.message : 'Unknown error')
    };
  }
}

export { parseNikForApi };