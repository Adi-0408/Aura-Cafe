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
    description: 'Product or ingredient title',
    example: 'Ethiopian Yirgacheffe Whole Beans'
  },
  {
    name: 'Category',
    key: 'category',
    required: true,
    type: 'Dropdown / Text',
    description: 'Product classification category',
    example: 'Retail Coffee Beans',
    allowedValues: ['Raw Ingredients', 'Retail Coffee Beans', 'Dairy & Alt', 'Packaging', 'Bakery & Pantry']
  },
  {
    name: 'Quantity',
    key: 'quantity',
    required: true,
    type: 'Number',
    description: 'Current physical on-hand stock count',
    example: '25'
  },
  {
    name: 'Unit',
    key: 'unit',
    required: true,
    type: 'Text',
    description: 'Unit of measure',
    example: 'kg',
    allowedValues: ['kg', 'g', 'L', 'ml', 'packs', 'units', 'boxes', 'bags']
  },
  {
    name: 'Min Threshold',
    key: 'minThreshold',
    required: true,
    type: 'Number',
    description: 'Warning threshold for low stock alert',
    example: '5'
  },
  {
    name: 'Unit Cost (₹)',
    key: 'unitCost',
    required: true,
    type: 'Number',
    description: 'Supplier purchase cost per unit in ₹',
    example: '850.00'
  },
  {
    name: 'Selling Price (₹)',
    key: 'price',
    required: false,
    type: 'Number',
    description: 'Menu / retail sale price (defaults to cost * 1.4)',
    example: '1200.00'
  },
  {
    name: 'SKU',
    key: 'sku',
    required: false,
    type: 'Text',
    description: 'Unique Stock Keeping Unit (auto-generated if empty)',
    example: 'SKU-COF-ETH-01'
  },
  {
    name: 'Supplier',
    key: 'supplier',
    required: false,
    type: 'Text',
    description: 'Primary vendor or distributor company name',
    example: 'Direct Origin Importers Ltd'
  },
  {
    name: 'Supplier Email',
    key: 'supplierEmail',
    required: false,
    type: 'Email',
    description: 'Direct procurement contact email',
    example: 'orders@directorigin.com'
  },
  {
    name: 'Supplier Phone',
    key: 'supplierPhone',
    required: false,
    type: 'Text',
    description: 'Supplier contact phone or WhatsApp',
    example: '+91 98765 43210'
  },
  {
    name: 'Location',
    key: 'location',
    required: false,
    type: 'Text',
    description: 'Storage area inside cafe or cold walk-in',
    example: 'Dry Storage - Shelf A'
  },
  {
    name: 'Barcode',
    key: 'barcode',
    required: false,
    type: 'Text / Digits',
    description: 'EAN-13, UPC, or custom barcode string',
    example: '8901234567891'
  },
  {
    name: 'Is Perishable',
    key: 'isPerishable',
    required: false,
    type: 'YES / NO',
    description: 'Whether the item has a fast expiration lifecycle',
    example: 'NO'
  },
  {
    name: 'Notes',
    key: 'notes',
    required: false,
    type: 'Text',
    description: 'Handling instructions, tasting notes, or origins',
    example: 'High altitude washed arabica beans'
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
    'Selling Price (₹)': 1200,
    'SKU': 'SKU-COF-ETH-01',
    'Supplier': 'Direct Origin Importers Ltd',
    'Supplier Email': 'orders@directorigin.com',
    'Supplier Phone': '+91 98765 43210',
    'Location': 'Dry Storage - Shelf A',
    'Barcode': '8901234567891',
    'Is Perishable': 'NO',
    'Notes': 'High altitude washed arabica beans'
  },
  {
    'Name': 'Oat Milk Barista Edition (1L)',
    'Category': 'Dairy & Alt',
    'Quantity': 48,
    'Unit': 'units',
    'Min Threshold': 12,
    'Unit Cost (₹)': 180,
    'Selling Price (₹)': 260,
    'SKU': 'SKU-MILK-OAT-01',
    'Supplier': 'PureDairy Logistics',
    'Supplier Email': 'sales@puredairy.com',
    'Supplier Phone': '+91 98765 43211',
    'Location': 'Cold Walk-in Refrigerator',
    'Barcode': '8901234567892',
    'Is Perishable': 'YES',
    'Notes': 'Keep chilled below 4°C'
  },
  {
    'Name': '100% Recyclable Hot Cups (12oz)',
    'Category': 'Packaging',
    'Quantity': 500,
    'Unit': 'units',
    'Min Threshold': 150,
    'Unit Cost (₹)': 6.50,
    'Selling Price (₹)': 10.00,
    'SKU': 'SKU-PACK-CUP-12',
    'Supplier': 'EcoPack Solutions',
    'Supplier Email': 'orders@ecopack.com',
    'Supplier Phone': '+91 98765 43212',
    'Location': 'Packaging Rack #2',
    'Barcode': '8901234567893',
    'Is Perishable': 'NO',
    'Notes': 'Double-walled kraft paper'
  },
  {
    'Name': 'Madagascar Bourbon Vanilla Syrup',
    'Category': 'Raw Ingredients',
    'Quantity': 8,
    'Unit': 'L',
    'Min Threshold': 2,
    'Unit Cost (₹)': 920,
    'Selling Price (₹)': 1350,
    'SKU': 'SKU-ING-VAN-01',
    'Supplier': 'Direct Origin Importers Ltd',
    'Supplier Email': 'orders@directorigin.com',
    'Supplier Phone': '+91 98765 43210',
    'Location': 'Syrup Storage Rack',
    'Barcode': '8901234567894',
    'Is Perishable': 'NO',
    'Notes': 'Natural extract, no artificial preservatives'
  },
  {
    'Name': 'Unsalted Artisan Butter (500g)',
    'Category': 'Bakery & Pantry',
    'Quantity': 30,
    'Unit': 'packs',
    'Min Threshold': 8,
    'Unit Cost (₹)': 240,
    'Selling Price (₹)': 320,
    'SKU': 'SKU-BAKE-BUT-01',
    'Supplier': 'PureDairy Logistics',
    'Supplier Email': 'sales@puredairy.com',
    'Supplier Phone': '+91 98765 43211',
    'Location': 'Cold Walk-in Refrigerator',
    'Barcode': '8901234567895',
    'Is Perishable': 'YES',
    'Notes': 'For fresh croissants and artisan brioche'
  }
];

export const downloadSampleExcelTemplate = () => {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_PRODUCTS_DATA);
  worksheet['!cols'] = [
    { wch: 36 }, // Name
    { wch: 22 }, // Category
    { wch: 12 }, // Quantity
    { wch: 10 }, // Unit
    { wch: 15 }, // Min Threshold
    { wch: 16 }, // Unit Cost (₹)
    { wch: 17 }, // Selling Price (₹)
    { wch: 18 }, // SKU
    { wch: 28 }, // Supplier
    { wch: 26 }, // Supplier Email
    { wch: 18 }, // Supplier Phone
    { wch: 26 }, // Location
    { wch: 18 }, // Barcode
    { wch: 15 }, // Is Perishable
    { wch: 38 }  // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  XLSX.writeFile(workbook, 'Aura_Cafe_Products_Import_Template.xlsx');
};

export const downloadSampleCsvTemplate = () => {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_PRODUCTS_DATA);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Aura_Cafe_Products_Import_Template.csv';
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

  const existingSkus = new Set(existingInventory.map(i => i.sku.trim().toLowerCase()));

  const parsedResults: ParsedProductRow[] = rawRows.map((row, index) => {
    const rowNumber = index + 2; // Accounting for 1-based index and header row
    const errors: string[] = [];
    const warnings: string[] = [];

    // Helper: case-insensitive key lookup
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

    // 1. Name
    const nameVal = getValue(['name', 'product name', 'item name', 'title', 'product']);
    const name = String(nameVal || '').trim();
    if (!name) {
      errors.push('Product name is required.');
    }

    // 2. Category
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

    // 3. Quantity
    const qtyVal = getValue(['quantity', 'qty', 'stock', 'current stock', 'units on hand']);
    let quantity = Number(qtyVal);
    if (qtyVal === '' || isNaN(quantity)) {
      errors.push('Quantity must be a valid number.');
      quantity = 0;
    } else if (quantity < 0) {
      errors.push('Quantity cannot be negative.');
    }

    // 4. Unit
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
      warnings.push(`Unrecognized unit "${rawUnit}". Defaulted to "units".`);
      unit = 'units';
    }

    // 5. Min Threshold
    const threshVal = getValue(['min threshold', 'min stock', 'threshold', 'par level', 'reorder level']);
    let minThreshold = Number(threshVal);
    if (threshVal === '' || isNaN(minThreshold)) {
      minThreshold = 5;
      warnings.push('Min Threshold missing. Defaulted to 5.');
    } else if (minThreshold < 0) {
      errors.push('Min threshold cannot be negative.');
    }

    // 6. Unit Cost
    const costVal = getValue(['unit cost', 'unit cost (₹)', 'cost', 'unit cost (rs)', 'purchase price', 'price cost']);
    let unitCost = Number(costVal);
    if (costVal === '' || isNaN(unitCost)) {
      errors.push('Unit Cost is required and must be a valid number.');
      unitCost = 0;
    } else if (unitCost < 0) {
      errors.push('Unit Cost cannot be negative.');
    }

    // 7. Selling Price
    const priceVal = getValue(['selling price', 'selling price (₹)', 'price', 'sale price', 'retail price']);
    let price = Number(priceVal);
    if (priceVal === '' || isNaN(price) || price <= 0) {
      price = Number((unitCost * 1.4).toFixed(2)) || unitCost || 50;
    }

    // 8. SKU
    const skuVal = getValue(['sku', 'product sku', 'code', 'item code', 'barcode sku']);
    let sku = String(skuVal || '').trim();
    if (!sku) {
      const prefix = category.substring(0, 3).toUpperCase();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      sku = `SKU-${prefix}-${randomSuffix}`;
    }

    const isExistingSku = existingSkus.has(sku.toLowerCase());
    if (isExistingSku) {
      warnings.push(`SKU "${sku}" already exists. Importing will update this existing item.`);
    }

    // 9. Supplier
    const supplierVal = getValue(['supplier', 'supplier name', 'vendor', 'distributor']);
    const supplier = String(supplierVal || 'Direct Origin Importers Ltd').trim();

    // 10. Supplier Contact
    const supplierEmail = String(getValue(['supplier email', 'vendor email', 'email']) || '').trim();
    const supplierPhone = String(getValue(['supplier phone', 'vendor phone', 'phone', 'contact']) || '').trim();

    // 11. Location
    const location = String(getValue(['location', 'storage location', 'storage', 'shelf', 'warehouse']) || 'Main Kitchen Storage').trim();

    // 12. Barcode
    const barcode = String(getValue(['barcode', 'upc', 'ean', 'barcode number']) || '').trim() || undefined;

    // 13. Is Perishable
    const perishVal = String(getValue(['is perishable', 'perishable', 'isperishable']) || '').toLowerCase();
    const isPerishable = perishVal === 'yes' || perishVal === 'true' || perishVal === '1' || perishVal === 'y';

    // 14. Notes
    const notes = String(getValue(['notes', 'description', 'remarks', 'comment']) || '').trim();

    const matchedExisting = existingInventory.find(i => i.sku.toLowerCase() === sku.toLowerCase());
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
      supplierPhone: supplierPhone || undefined,
      supplierEmail: supplierEmail || undefined,
      location,
      imageUrl,
      isArchived: false,
      isPerishable,
      notes: notes || undefined,
      barcode,
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
