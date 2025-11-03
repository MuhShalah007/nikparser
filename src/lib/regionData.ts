export interface Province {
  code: string;
  name: string;
}

export interface City {
  code: string;
  name: string;
}

export interface District {
  code: string;
  name: string;
  postalCode: string;
}

let regionData: {
  provinces: Map<string, Province>;
  cities: Map<string, City>;
  districts: Map<string, District>;
} | null = null;

export const loadRegionData = async (): Promise<void> => {
  if (regionData) return;

  try {
    const response = await fetch('https://raw.githubusercontent.com/bachors/nik_parse.js/refs/heads/master/src/nik_parse.js');
    const code = await response.text();

    const provMatch = code.match(/"provinsi":(\{[^}]+\})/);
    const cityMatch = code.match(/"kabkot":(\{[^}]+\})/);
    const districtMatch = code.match(/"kecamatan":(\{[^}]+\})/);

    const provObj = JSON.parse(provMatch?.[1] || '{}');
    const cityObj = JSON.parse(cityMatch?.[1] || '{}');
    const districtObj = JSON.parse(districtMatch?.[1] || '{}');

    const provinces = new Map<string, Province>();
    Object.entries(provObj).forEach(([code, name]) => {
      provinces.set(code, { code, name: name as string });
    });

    const cities = new Map<string, City>();
    Object.entries(cityObj).forEach(([code, name]) => {
      cities.set(code, { code, name: name as string });
    });

    const districts = new Map<string, District>();
    Object.entries(districtObj).forEach(([code, value]) => {
      const str = value as string;
      const parts = str.split(' -- ');
      const name = parts[0]?.trim() || '';
      const postalCode = parts[1]?.trim() || '';
      districts.set(code, { code, name, postalCode });
    });

    regionData = { provinces, cities, districts };
  } catch (error) {
    console.error('Failed to load region data:', error);
    throw error;
  }
};

export const getProvinces = async (): Promise<Province[]> => {
  await loadRegionData();
  if (!regionData) return [];
  return Array.from(regionData.provinces.values()).sort((a, b) => a.code.localeCompare(b.code));
};

export const getCitiesByProvince = async (provinceCode: string): Promise<City[]> => {
  await loadRegionData();
  if (!regionData) return [];

  const provincePart = provinceCode.padStart(2, '0');
  return Array.from(regionData.cities.values())
    .filter(city => city.code.startsWith(provincePart))
    .sort((a, b) => a.code.localeCompare(b.code));
};

export const getDistrictsByCity = async (cityCode: string): Promise<District[]> => {
  await loadRegionData();
  if (!regionData) return [];

  const cityPart = cityCode.padStart(4, '0');
  return Array.from(regionData.districts.values())
    .filter(district => district.code.startsWith(cityPart))
    .sort((a, b) => a.code.localeCompare(b.code));
};

export const getProvinceName = async (code: string): Promise<string | null> => {
  await loadRegionData();
  if (!regionData) return null;
  return regionData.provinces.get(code)?.name || null;
};

export const getCityName = async (code: string): Promise<string | null> => {
  await loadRegionData();
  if (!regionData) return null;
  return regionData.cities.get(code)?.name || null;
};

export const getDistrictInfo = async (code: string): Promise<District | null> => {
  await loadRegionData();
  if (!regionData) return null;
  return regionData.districts.get(code) || null;
};
