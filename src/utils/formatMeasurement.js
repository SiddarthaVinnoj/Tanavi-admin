/**
 * Format property measurements (Acres/Guntas) for display.
 *
 * Rules:
 *  - Don't show a unit if its value is 0
 *  - 0 Acres 20 Guntas  →  20 Guntas
 *  - 2 Acres 0 Guntas   →  2 Acres
 *  - 2 Acres 2 Guntas   →  2 Acres 2 Guntas
 */

const buildAcresGuntasString = (acres, guntas) => {
  const a = Number(acres) || 0;
  const g = Number(guntas) || 0;
  const parts = [];
  if (a > 0) parts.push(`${a} Acre${a !== 1 ? 's' : ''}`);
  if (g > 0) parts.push(`${g} Gunta${g !== 1 ? 's' : ''}`);
  return parts.join(' ');
};

const parseAcresGuntasString = (areaStr) => {
  const acresMatch = areaStr.match(/(\d+(?:\.\d+)?)\s*Acres?/i);
  const guntasMatch = areaStr.match(/(\d+(?:\.\d+)?)\s*Guntas?/i);
  const acres = acresMatch ? Number(acresMatch[1]) : 0;
  const guntas = guntasMatch ? Number(guntasMatch[1]) : 0;
  return buildAcresGuntasString(acres, guntas);
};

/**
 * Main display formatter — works for both admin-added and user-submitted properties.
 * @param {Object} property
 * @returns {string}
 */
export const formatAreaDisplay = (property) => {
  // 1. Dedicated acres/guntas numeric fields
  if (property.acres !== undefined || property.guntas !== undefined) {
    const result = buildAcresGuntasString(property.acres, property.guntas);
    if (result) return result;
  }

  // 2. Farmhouse uses farmhouseAreaAcres + guntas
  if (property.farmhouseAreaAcres !== undefined) {
    const result = buildAcresGuntasString(property.farmhouseAreaAcres, property.guntas);
    if (result) return result;
  }

  // 3. Area string that contains Acres/Guntas text
  if (property.area && typeof property.area === 'string' && /acre|gunta/i.test(property.area)) {
    const result = parseAcresGuntasString(property.area);
    if (result) return result;
  }

  // 4. Plain area string
  return property.area || 'N/A';
};

export const getAreaUnit = (type) => {
  if (type === 'Agricultural Land' || type === 'Farmhouse') return 'Acres/Guntas';
  if (type === 'Open Plot') return 'Sq Yards';
  if (['Independent House', 'Apartment', 'Office / Commercial Space', 'Office Space'].includes(type)) return 'SFT';
  return '';
};
