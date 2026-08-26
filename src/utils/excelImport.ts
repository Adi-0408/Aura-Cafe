import * as XLSX from 'xlsx';
import { InventoryItem, InventoryCategory, InventoryUnit } from '../types';

export interface ColumnSpec {
  name: string;
  key: string;
  required: boolean;
  type: string;
  description: string;
  example: string;
  allowedValues?: string[];
}

export const SPREADSHEET_COLUMNS_SPEC: ColumnSpec[] = [
  {
    name: 'Name',
    key: 'name',
    required: true,
    type: 'Text',
    description: 'Product or ingredient name',
    example: 'Ethiopian Yirgacheffe Whole Beans'
  },
  {
    name: 'Category',
    key: 'category',
    required: true,
    type: 'Text',
    description: 'Raw Ingredients, Retail Coffee Beans, Dairy & Alt, Packaging, Bakery & Pantry',
    example: 'Retail Coffee Beans',
    allowedValues: ['Raw Ingredients', 'Retail Coffee Beans', 'Dairy & Alt', 'Packaging', 'Bakery & Pantry']
  },
  {
    name: 'Quantity',
    key: 'quantity',
    required: true,
    type: 'Number',
    description: 'Current physical on-hand stock',
    example: '25'
  },
  {
    name: 'Unit',
    key: 'unit',
    required: true,
    type: 'Text',
    description: 'kg, g, L, ml, packs, units, boxes, bags',
    example: 'kg',
    allowedValues: ['kg', 'g', 'L', 'ml', 'packs', 'units', 'boxes', 'bags']
  },
  {
    name: 'Min Threshold',
    key: 'minThreshold',
    required: true,
    type: 'Number',
    description: 'Low stock warning alert level',
    example: '5'
  },
  {
    name: 'Unit Cost (₹)',
    key: 'unitCost',
    required: true,
    type: 'Number',
    description: 'Purchase cost per unit in ₹',
    example: '850.00'
  },
  {
    name: 'Supplier',
    key: 'supplier',
    required: false,
    type: 'Text',
    description: 'Vendor or supplier name (Optional)',
    example: 'Direct Origin Importers Ltd'
  }
];

export const SAMPLE_PRODUCTS_DATA = [
  {
    'Name': 'Ethiopian Yirgacheffe Whole Beans',
    'Category': 'Retail Coffee Beans',
    'Quantity': 25,
    'Unit': 'kg',
    'Min Threshold': 5,
    'Unit Cost (₹)': 850,
    'Supplier': 'Direct Origin Importers Ltd'
  },
  {
    'Name': 'Oat Milk Barista Edition (1L)',
    'Category': 'Dairy & Alt',
    'Quantity': 48,
    'Unit': 'units',
    'Min Threshold': 12,
    'Unit Cost (₹)': 180,
    'Supplier': 'PureDairy Logistics'
  },
  {
    'Name': '100% Recyclable Hot Cups (12oz)',
    'Category': 'Packaging',
    'Quantity': 500,
    'Unit': 'units',
    'Min Threshold': 150,
    'Unit Cost (₹)': 6.50,
    'Supplier': 'EcoPack Solutions'
  },
  {
    'Name': 'Madagascar Bourbon Vanilla Syrup',
    'Category': 'Raw Ingredients',
    'Quantity': 8,
    'Unit': 'L',
    'Min Threshold': 2,
    'Unit Cost (₹)': 920,
    'Supplier': 'Direct Origin Importers Ltd'
  },
  {
    'Name': 'Unsalted Artisan Butter (500g)',
    'Category': 'Bakery & Pantry',
    'Quantity': 30,
    'Unit': 'packs',
    'Min Threshold': 8,
    'Unit Cost (₹)': 240,
    'Supplier': 'PureDairy Logistics'
  }
];

export const downloadSampleExcelTemplate = () => {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_PRODUCTS_DATA);
  worksheet['!cols'] = [
    { wch: 38 }, // Name
    { wch: 24 }, // Category
    { wch: 14 }, // Quantity
    { wch: 12 }, // Unit
    { wch: 16 }, // Min Threshold
    { wch: 16 }, // Unit Cost (₹)
    { wch: 30 }  // Supplier
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  XLSX.writeFile(workbook, 'Aura_Cafe_Products_Template.xlsx');
};

export const downloadSampleCsvTemplate = () => {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_PRODUCTS_DATA);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Aura_Cafe_Products_Template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export interface ParsedProductRow {
  rowNumber: number;
  item: InventoryItem;
  isValid: boolean;
  isExistingSku: boolean;
  errors: string[];
  warnings: string[];
  raw: Record<string, any>;
}

const CATEGORY_MAP: Record<string, InventoryCategory> = {
  'raw': 'Raw Ingredients',
  'raw ingredients': 'Raw Ingredients',
  'ingredient': 'Raw Ingredients',
  'ingredients': 'Raw Ingredients',
  'coffee': 'Retail Coffee Beans',
  'retail coffee': 'Retail Coffee Beans',
  'retail coffee beans': 'Retail Coffee Beans',
  'beans': 'Retail Coffee Beans',
  'dairy': 'Dairy & Alt',
  'dairy & alt': 'Dairy & Alt',
  'milk': 'Dairy & Alt',
  'packaging': 'Packaging',
  'pack': 'Packaging',
  'cups': 'Packaging',
  'bakery': 'Bakery & Pantry',
  'bakery & pantry': 'Bakery & Pantry',
  'pantry': 'Bakery & Pantry',
  'food': 'Bakery & Pantry'
};

const DEFAULT_CATEGORY_IMAGES: Record<InventoryCategory, string> = {
  'Raw Ingredients': 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&auto=format&fit=crop&q=80',
  'Retail Coffee Beans': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80',
  'Dairy & Alt': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  'Packaging': 'https://images.unsplash.com/photo-1589365278144-c9e705f843ba?w=600&auto=format&fit=crop&q=80',
  'Bakery & Pantry': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80'
};

export const parseProductsSpreadsheet = async (
  file: File, 
  existingInventory: InventoryItem[]
): Promise<ParsedProductRow[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Spreadsheet has no readable sheets.');
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Spreadsheet is empty. Please add product rows.');
  }

  const existingNames = new Map(existingInventory.map(i => [i.name.trim().toLowerCase(), i]));
  const existingSkus = new Map(existingInventory.map(i => [i.sku.trim().toLowerCase(), i]));

  const parsedResults: ParsedProductRow[] = rawRows.map((row, index) => {
    const rowNumber = index + 2; // 1-based index including header
    const errors: string[] = [];
    const warnings: string[] = [];

    // Case-insensitive key lookup helper
    const getValue = (aliases: string[]): any => {
      for (const [key, val] of Object.entries(row)) {
        const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const alias of aliases) {
          const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanKey === cleanAlias) {
            return typeof val === 'string' ? val.trim() : val;
          }
        }
      }
      return '';
    };

    // 1. Name (Required)
    const nameVal = getValue(['name', 'product name', 'item name', 'title', 'product']);
    const name = String(nameVal || '').trim();
    if (!name) {
      errors.push('Product name is required.');
    }

    // 2. Category (Required)
    const catVal = getValue(['category', 'category name', 'type', 'group']);
    const rawCat = String(catVal || '').trim();
    let category: InventoryCategory = 'Raw Ingredients';
    if (rawCat) {
      const normalized = CATEGORY_MAP[rawCat.toLowerCase()];
      if (normalized) {
        category = normalized;
      } else {
        warnings.push(`Unknown category "${rawCat}". Defaulted to "Raw Ingredients".`);
      }
    } else {
      warnings.push('Category missing. Defaulted to "Raw Ingredients".');
    }

    // 3. Quantity (Required)
    const qtyVal = getValue(['quantity', 'qty', 'stock', 'current stock', 'units on hand']);
    let quantity = Number(qtyVal);
    if (qtyVal === '' || isNaN(quantity)) {
      errors.push('Quantity must be a valid number.');
      quantity = 0;
    } else if (quantity < 0) {
      errors.push('Quantity cannot be negative.');
    }

    // 4. Unit (Required)
    const unitVal = getValue(['unit', 'unit of measure', 'uom', 'measure']);
    let unit: InventoryUnit = 'units';
    const rawUnit = String(unitVal || '').trim().toLowerCase();
    const VALID_UNITS: InventoryUnit[] = ['kg', 'g', 'L', 'ml', 'packs', 'units', 'boxes', 'bags'];
    if (VALID_UNITS.includes(rawUnit as InventoryUnit)) {
      unit = rawUnit as InventoryUnit;
    } else if (rawUnit === 'liter' || rawUnit === 'litres' || rawUnit === 'liters') {
      unit = 'L';
    } else if (rawUnit === 'kilogram' || rawUnit === 'kgs' || rawUnit === 'kilo') {
      unit = 'kg';
    } else if (rawUnit === 'gram' || rawUnit === 'grams' || rawUnit === 'gm') {
      unit = 'g';
    } else if (rawUnit === 'pack' || rawUnit === 'packet' || rawUnit === 'packets') {
      unit = 'packs';
    } else if (rawUnit === 'box') {
      unit = 'boxes';
    } else if (rawUnit === 'bag') {
      unit = 'bags';
    } else if (rawUnit) {
      unit = 'units';
    }

    // 5. Min Threshold (Required)
    const threshVal = getValue(['min threshold', 'min stock', 'threshold', 'par level', 'reorder level']);
    let minThreshold = Number(threshVal);
    if (threshVal === '' || isNaN(minThreshold)) {
      minThreshold = 5;
    } else if (minThreshold < 0) {
      errors.push('Min threshold cannot be negative.');
    }

    // 6. Unit Cost (Required)
    const costVal = getValue(['unit cost', 'unit cost (₹)', 'cost', 'unit cost (rs)', 'purchase price', 'price cost']);
    let unitCost = Number(costVal);
    if (costVal === '' || isNaN(unitCost)) {
      errors.push('Unit Cost is required and must be a valid number.');
      unitCost = 0;
    } else if (unitCost < 0) {
      errors.push('Unit Cost cannot be negative.');
    }

    // 7. Supplier (Optional)
    const supplierVal = getValue(['supplier', 'supplier name', 'vendor', 'distributor']);
    const supplier = String(supplierVal || 'Direct Origin Importers Ltd').trim();

    // Auto-calculate selling price (Unit Cost * 1.4)
    const price = Number((unitCost * 1.4).toFixed(2)) || unitCost || 50;

    // Check if item already exists by Name or SKU
    const existingByName = existingNames.get(name.toLowerCase());
    const skuVal = getValue(['sku', 'product sku', 'code', 'item code']);
    let sku = String(skuVal || '').trim();
    
    let matchedExisting: InventoryItem | undefined = existingByName;
    if (sku) {
      const existingBySku = existingSkus.get(sku.toLowerCase());
      if (existingBySku) matchedExisting = existingBySku;
    }

    if (!sku) {
      if (matchedExisting) {
        sku = matchedExisting.sku;
      } else {
        const prefix = category.substring(0, 3).toUpperCase();
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        sku = `SKU-${prefix}-${randomSuffix}`;
      }
    }

    const isExistingSku = Boolean(matchedExisting);
    if (isExistingSku) {
      warnings.push(`Existing item detected (${matchedExisting?.name}). Stock and cost will be updated.`);
    }

    const id = matchedExisting ? matchedExisting.id : `inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const imageUrl = matchedExisting?.imageUrl || DEFAULT_CATEGORY_IMAGES[category] || DEFAULT_CATEGORY_IMAGES['Raw Ingredients'];

    const item: InventoryItem = {
      id,
      name,
      sku,
      category,
      unit,
      quantity,
      minThreshold,
      optimalParLevel: Number((minThreshold * 2.5).toFixed(0)),
      unitCost,
      price,
      supplier,
      location: matchedExisting?.location || 'Main Kitchen Storage',
      imageUrl,
      isArchived: false,
      isPerishable: category === 'Dairy & Alt' || category === 'Bakery & Pantry',
      updatedAt: Date.now()
    };

    return {
      rowNumber,
      item,
      isValid: errors.length === 0,
      isExistingSku,
      errors,
      warnings,
      raw: row
    };
  });

  return parsedResults;
};
