import { Product, ProductCondition, ImportTemplate, ImportDraftProduct, DuplicateMatchInfo, ImportJob, ImportMode } from '../../src/types';
import { GoogleGenAI } from '@google/genai';

// Canonical brand normalizer map
const CANONICAL_BRANDS: Record<string, string> = {
  'milwaukee': 'Milwaukee',
  'milwaukie': 'Milwaukee',
  'milwaukee tools': 'Milwaukee',
  'milwaukee electric tool': 'Milwaukee',
  'makita': 'Makita',
  'makita tools': 'Makita',
  'dewalt': 'DeWalt',
  'de walt': 'DeWalt',
  'bosch': 'Bosch',
  'bosch professional': 'Bosch',
  'ryobi': 'Ryobi',
  'stanley': 'Stanley',
  'kincrome': 'Kincrome',
  'sidchrome': 'Sidchrome',
  'sony': 'Sony',
  'apple': 'Apple',
  'samsung': 'Samsung',
  'nintendo': 'Nintendo',
  'universal': 'Universal Pictures',
  'warner bros': 'Warner Bros',
  'disney': 'Disney',
  'nissan': 'Nissan Genuine',
  'toyota': 'Toyota Genuine',
  'ford': 'Ford Genuine',
  'holden': 'Holden Genuine',
  'narva': 'Narva',
  'gme': 'GME'
};

export function normaliseBrand(raw: string): string {
  if (!raw || typeof raw !== 'string') return 'CheapLoot';
  const clean = raw.trim();
  const lower = clean.toLowerCase();
  if (CANONICAL_BRANDS[lower]) return CANONICAL_BRANDS[lower];
  // Title case fallback
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

// Standard header mapping dictionary
export const STANDARD_FIELD_MAPPINGS: Record<string, string[]> = {
  title: ['product', 'product name', 'item', 'item name', 'title', 'listing title', 'description', 'name', 'product_name', 'item_title'],
  sku: ['sku', 'stock code', 'item code', 'internal code', 'part no', 'custom label', 'product code', 'inventory id'],
  barcode: ['upc', 'ean', 'gtin', 'barcode', 'isbn', 'upc code', 'ean code'],
  mpn: ['mpn', 'part number', 'manufacturer number', 'mfg part number', 'mfg_part_no', 'model number', 'model no', 'oem', 'oem number'],
  costPrice: ['cost', 'buy price', 'purchase price', 'cogs', 'unit cost', 'cost price', 'acq cost', 'buy_price'],
  price: ['price', 'retail', 'sale price', 'sell price', 'our price', 'listing price', 'unit price', 'rrp', 'selling_price'],
  stock: ['qty', 'quantity', 'stock', 'on hand', 'available', 'stock level', 'count', 'inventory'],
  condition: ['condition', 'item condition', 'state', 'grade', 'status'],
  conditionDescription: ['condition description', 'condition notes', 'damage notes', 'wear', 'notes'],
  category: ['category', 'department', 'cat', 'dept', 'product category', 'type'],
  brand: ['brand', 'manufacturer', 'make', 'mfg', 'brand name'],
  warehouseLocation: ['warehouse', 'location', 'bin', 'rack', 'shelf', 'aisle', 'depot', 'storage location', 'bin location'],
  weightKg: ['weight', 'weight kg', 'weight (kg)', 'weight_kg', 'mass'],
  images: ['image', 'images', 'image url', 'photo', 'photos', 'picture', 'picture url', 'image_1', 'main_image']
};

export function detectColumnMappings(headers: string[]): Record<string, string> {
  const result: Record<string, string> = {};

  headers.forEach(header => {
    const cleanHeader = header.trim().toLowerCase().replace(/[_\-]/g, ' ');
    let matchedField = '';

    for (const [field, aliases] of Object.entries(STANDARD_FIELD_MAPPINGS)) {
      if (cleanHeader === field.toLowerCase() || aliases.some(alias => cleanHeader === alias || cleanHeader.includes(alias))) {
        matchedField = field;
        break;
      }
    }

    if (matchedField) {
      result[header] = matchedField;
    }
  });

  return result;
}

export function toSafeString(val: any, fallback = ''): string {
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val);
  if (val && typeof val === 'object') {
    if (typeof val.name === 'string') return val.name.trim();
    if (typeof val.title === 'string') return val.title.trim();
    if (typeof val.label === 'string') return val.label.trim();
    if (typeof val.value === 'string') return val.value.trim();
    if (Array.isArray(val)) return val.map(v => toSafeString(v)).filter(Boolean).join(', ');
  }
  return fallback;
}

// Generate intelligent SKU according to category format
export function generateUniqueSku(category: any, department: any, existingSkus: Set<string>): string {
  let prefix = 'CL';
  const cat = toSafeString(category || department, '').toLowerCase();
  if (cat.includes('tool') || cat.includes('hardware') || cat.includes('drill')) prefix = 'TOOL';
  else if (cat.includes('auto') || cat.includes('car') || cat.includes('vehicle')) prefix = 'AUTO';
  else if (cat.includes('dvd') || cat.includes('movie') || cat.includes('media')) prefix = 'DVD';
  else if (cat.includes('book')) prefix = 'BOOK';
  else if (cat.includes('elect') || cat.includes('phone') || cat.includes('audio')) prefix = 'ELEC';
  else if (cat.includes('sport') || cat.includes('camp') || cat.includes('outdoor')) prefix = 'OUTD';
  else if (cat.includes('toy') || cat.includes('game') || cat.includes('hobbies')) prefix = 'TOY';

  let num = Math.floor(10000 + Math.random() * 90000);
  let candidate = `${prefix}-${num}`;
  let attempts = 0;
  while (existingSkus.has(candidate) && attempts < 100) {
    num = Math.floor(10000 + Math.random() * 90000);
    candidate = `${prefix}-${num}`;
    attempts++;
  }
  return candidate;
}

// String similarity using Levenshtein / Dice coefficient
function calculateFuzzySimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1.0;

  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  let intersection = 0;
  words1.forEach(w => {
    if (w.length > 2 && words2.has(w)) intersection++;
  });

  const union = words1.size + words2.size - intersection;
  return union > 0 ? (intersection * 2) / (words1.size + words2.size) : 0;
}

// Duplicate Detection
export function findDuplicates(candidate: Partial<Product>, existingProducts: Product[]): DuplicateMatchInfo[] {
  const matches: DuplicateMatchInfo[] = [];

  const candidateSku = candidate.sku?.trim().toUpperCase();
  const candidateBarcode = candidate.barcode?.trim();
  const candidateMpn = candidate.mpn?.trim().toUpperCase();
  const candidateTitle = candidate.title?.trim();

  for (const existing of existingProducts) {
    // 1. Exact SKU match
    if (candidateSku && existing.sku && existing.sku.toUpperCase() === candidateSku) {
      matches.push({
        existingProductId: existing.id,
        existingSku: existing.sku,
        existingTitle: existing.title,
        existingPrice: existing.price,
        existingStock: existing.stock,
        existingImage: existing.images?.[0],
        matchReason: 'exact_sku',
        similarity: 1.0
      });
      continue;
    }

    // 2. Barcode match
    if (candidateBarcode && existing.barcode && existing.barcode === candidateBarcode && candidateBarcode.length >= 6) {
      matches.push({
        existingProductId: existing.id,
        existingSku: existing.sku,
        existingTitle: existing.title,
        existingPrice: existing.price,
        existingStock: existing.stock,
        existingImage: existing.images?.[0],
        matchReason: 'barcode',
        similarity: 0.98
      });
      continue;
    }

    // 3. MPN match + Brand
    if (candidateMpn && existing.mpn && candidateMpn.length > 3 && existing.mpn.toUpperCase() === candidateMpn) {
      matches.push({
        existingProductId: existing.id,
        existingSku: existing.sku,
        existingTitle: existing.title,
        existingPrice: existing.price,
        existingStock: existing.stock,
        existingImage: existing.images?.[0],
        matchReason: 'mpn',
        similarity: 0.95
      });
      continue;
    }

    // 4. Fuzzy Title & Model match
    if (candidateTitle && existing.title) {
      const similarity = calculateFuzzySimilarity(candidateTitle, existing.title);
      if (similarity >= 0.75) {
        matches.push({
          existingProductId: existing.id,
          existingSku: existing.sku,
          existingTitle: existing.title,
          existingPrice: existing.price,
          existingStock: existing.stock,
          existingImage: existing.images?.[0],
          matchReason: 'fuzzy_title',
          similarity
        });
      }
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}

// Calculate Landed Cost
export function calculateLandedCost(costPrice: number, freight = 0, repair = 0, other = 0): number {
  return Number(((costPrice || 0) + (freight || 0) + (repair || 0) + (other || 0)).toFixed(2));
}

// Calculate Quality Completeness Score (0-100%)
export function calculateCompletenessScore(item: Partial<ImportDraftProduct>): number {
  let score = 0;
  if (item.title && item.title.trim().length >= 10) score += 20;
  if (item.price && item.price > 0) score += 20;
  if (item.sku && item.sku.trim().length >= 3) score += 15;
  if (item.condition) score += 10;
  if (item.category && item.category !== 'Uncategorised') score += 10;
  if (item.images && item.images.length > 0) score += 10;
  if (item.description && item.description.length >= 30) score += 5;
  if (item.warehouseLocation && item.warehouseLocation.length >= 2) score += 5;
  if (item.barcode || item.mpn) score += 5;
  return Math.min(100, score);
}

// Validation Engine
export function validateImportDraft(draft: Partial<ImportDraftProduct>, mode: ImportMode, existingSkus: Set<string>): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!draft.title || draft.title.trim().length < 4) {
    errors.push('Product title is required (minimum 4 characters)');
  }
  if (draft.price === undefined || draft.price === null || isNaN(draft.price) || draft.price <= 0) {
    errors.push('Selling price must be greater than $0.00');
  }
  if (!draft.condition) {
    errors.push('Condition is required');
  }
  if (!draft.sku || draft.sku.trim() === '') {
    errors.push('SKU is required');
  } else if (mode === 'CREATE_ONLY' && existingSkus.has(draft.sku.trim().toUpperCase())) {
    errors.push(`SKU ${draft.sku} already exists in database (Create Only mode)`);
  }

  if (draft.stock === undefined || draft.stock < 0) {
    errors.push('Quantity cannot be negative');
  }

  // Warnings
  if (!draft.images || draft.images.length === 0) {
    warnings.push('No product photos attached (recommended before publishing)');
  }
  if (!draft.warehouseLocation || draft.warehouseLocation.trim() === '') {
    warnings.push('Storage location is unassigned');
  }
  if (draft.costPrice !== undefined && draft.price !== undefined && draft.costPrice > draft.price) {
    warnings.push(`Warning: Cost ($${draft.costPrice.toFixed(2)}) is higher than Selling Price ($${draft.price.toFixed(2)})`);
  }
  if (draft.title && draft.title === draft.title.toUpperCase() && draft.title.length > 8) {
    warnings.push('Title is in ALL CAPS (will be cleaned for readability)');
  }

  return { errors, warnings };
}

// Clean and format Title following CheapLoot rules
export function cleanProductTitle(rawTitle: string, brand?: string, model?: string, condition?: string): string {
  if (!rawTitle) return '';
  let title = rawTitle.trim();

  // Fix all caps
  if (title === title.toUpperCase() && title.length > 8) {
    title = title
      .toLowerCase()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // Strip excessive punctuation
  title = title.replace(/!{2,}/g, '!').replace(/\?{2,}/g, '?').replace(/\*{2,}/g, '');

  return title;
}
