import * as XLSX from 'xlsx';
import { InventoryItem, InventoryCategory, InventoryUnit, MenuItem, MenuCategory, DietaryTag, RecipeIngredient } from '../types';

export interface ColumnSpec {
  name: string;
  key: string;
  required: boolean;
  type: string;
  description: string;
  example: string;
  allowedValues?: string[];
}

// -------------------------------------------------------------
// 1. INVENTORY / RAW PRODUCTS COLUMNS SPECIFICATION (7 FIELDS)
// -------------------------------------------------------------
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
    example: 'Direct Origin Roasters Ltd'
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
    'Supplier': 'Direct Origin Roasters Ltd'
  },
  {
    'Name': 'Oat Milk Barista Edition (1L)',
    'Category': 'Dairy & Alt',
    'Quantity': 48,
    'Unit': 'units',
    'Min Threshold': 12,
    'Unit Cost (₹)': 180,
    'Supplier': 'Califia Farms'
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
    'Supplier': 'Monin Specialty Syrups'
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

// -------------------------------------------------------------
// 2. MENU ITEMS / DISHES COLUMNS SPECIFICATION
// -------------------------------------------------------------
export const MENU_COLUMNS_SPEC: ColumnSpec[] = [
  {
    name: 'Name',
    key: 'name',
    required: true,
    type: 'Text',
    description: 'Name of the dish or beverage',
    example: 'Flat White (Oat Milk)'
  },
  {
    name: 'Category',
    key: 'category',
    required: true,
    type: 'Text',
    description: '"Espresso & Specialty Coffee", "Cold Brews & Teas", "Artisan Bakery", "All-Day Brunch"',
    example: 'Espresso & Specialty Coffee',
    allowedValues: ['Espresso & Specialty Coffee', 'Cold Brews & Teas', 'Artisan Bakery', 'All-Day Brunch']
  },
  {
    name: 'Price (₹)',
    key: 'price',
    required: true,
    type: 'Number',
    description: 'Selling price charged to customer in ₹',
    example: '280.00'
  },
  {
    name: 'Description',
    key: 'description',
    required: false,
    type: 'Text',
    description: 'Flavor notes and recipe summary',
    example: 'Double ristretto extracted over Califia oat milk with microfoam'
  },
  {
    name: 'Prep Time',
    key: 'prepTime',
    required: false,
    type: 'Text',
    description: 'Preparation duration (e.g. "3-5 mins")',
    example: '3-5 mins'
  },
  {
    name: 'Dietary Tags',
    key: 'dietaryTags',
    required: false,
    type: 'Text',
    description: 'Comma-separated tags: VG (Vegan), V (Vegetarian), GF (Gluten-Free), DF (Dairy-Free), N (Nuts)',
    example: 'VG, GF'
  },
  {
    name: 'Required Ingredients',
    key: 'recipe',
    required: false,
    type: 'Text',
    description: 'Format: "ItemName:Qty, ItemName:Qty" (e.g. "Coffee Beans:0.02, Oat Milk:0.25, 12oz Cup:1")',
    example: 'Ethiopian Yirgacheffe Beans:0.02, Califia Farms Oat Milk:0.2, Eco Craft Paper Cup 12oz:1'
  },
  {
    name: 'Available',
    key: 'isAvailable',
    required: false,
    type: 'Text',
    description: 'TRUE or YES if available for ordering',
    example: 'TRUE'
  }
];

export const SAMPLE_MENU_DATA = [
  {
    'Name': 'Ethiopian Yirgacheffe Pour-Over',
    'Category': 'Espresso & Specialty Coffee',
    'Price (₹)': 340,
    'Description': 'Single-origin floral and citrus microlot brewed on Hario V60.',
    'Prep Time': '4-5 mins',
    'Dietary Tags': 'VG, GF, DF',
    'Required Ingredients': 'Ethiopian Yirgacheffe Beans:0.02, Eco Craft Paper Cup 12oz:1',
    'Available': 'TRUE'
  },
  {
    'Name': 'Valencia Orange Peel Cortado',
    'Category': 'Espresso & Specialty Coffee',
    'Price (₹)': 280,
    'Description': 'Double ristretto extracted over organic Valencia orange zest with silky milk.',
    'Prep Time': '3-4 mins',
    'Dietary Tags': 'GF, V',
    'Required Ingredients': 'Ethiopian Yirgacheffe Beans:0.02, Califia Farms Barista Blend Oat Milk:0.15, Eco Craft Paper Cup 12oz:1',
    'Available': 'TRUE'
  },
  {
    'Name': 'Kyoto 18-Hour Slow-Drip Cold Brew',
    'Category': 'Cold Brews & Teas',
    'Price (₹)': 330,
    'Description': 'Slow gravity-extracted drop-by-drop cold brew with zero bitterness.',
    'Prep Time': 'Instant',
    'Dietary Tags': 'VG, GF, DF',
    'Required Ingredients': 'Ethiopian Yirgacheffe Beans:0.035, Eco Craft Paper Cup 12oz:1',
    'Available': 'TRUE'
  },
  {
    'Name': 'Ceremonial Uji Matcha Latte',
    'Category': 'Cold Brews & Teas',
    'Price (₹)': 360,
    'Description': 'First-harvest Japanese tencha whisked with Califia oat milk and vanilla.',
    'Prep Time': '3-4 mins',
    'Dietary Tags': 'VG, GF, DF',
    'Required Ingredients': 'Califia Farms Barista Blend Oat Milk:0.25, Eco Craft Paper Cup 12oz:1',
    'Available': 'TRUE'
  },
  {
    'Name': 'Artisan Butter Croissant',
    'Category': 'Artisan Bakery',
    'Price (₹)': 220,
    'Description': '72-hour fermented sourdough croissant with 27 delicate honeycomb layers.',
    'Prep Time': 'Warm on request',
    'Dietary Tags': 'V',
    'Required Ingredients': 'French Cultured Butter (AOP):0.05',
    'Available': 'TRUE'
  },
  {
    'Name': 'Avocado Tartine on Sourdough',
    'Category': 'All-Day Brunch',
    'Price (₹)': 420,
    'Description': 'Hass avocado mash, heirloom cherry tomatoes, Aleppo chili on seeded loaf.',
    'Prep Time': '8-10 mins',
    'Dietary Tags': 'VG, DF',
    'Required Ingredients': 'Artisan Sourdough Loaf:1',
    'Available': 'TRUE'
  }
];

export const downloadMenuItemsExcelTemplate = () => {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_MENU_DATA);
  worksheet['!cols'] = [
    { wch: 36 }, // Name
    { wch: 30 }, // Category
    { wch: 14 }, // Price (₹)
    { wch: 60 }, // Description
    { wch: 16 }, // Prep Time
    { wch: 18 }, // Dietary Tags
    { wch: 45 }, // Required Ingredients
    { wch: 14 }  // Available
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Menu Items Template');
  XLSX.writeFile(workbook, 'Aura_Cafe_Menu_Items_Template.xlsx');
};

export const downloadMenuItemsCsvTemplate = () => {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_MENU_DATA);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Aura_Cafe_Menu_Items_Template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// -------------------------------------------------------------
// 3. PRODUCT / INVENTORY PARSER
// -------------------------------------------------------------
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
    throw new Error('Spreadsheet has no sheets.');
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('Spreadsheet contains no rows or data.');
  }

  const parsedRows: ParsedProductRow[] = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // header is row 1
    const errors: string[] = [];
    const warnings: string[] = [];

    const getVal = (possibleKeys: string[]): any => {
      for (const k of possibleKeys) {
        const foundKey = Object.keys(row).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
          return row[foundKey];
        }
      }
      return '';
    };

    const name = String(getVal(['name', 'product name', 'item name', 'product', 'item'])).trim();
    const rawCategory = String(getVal(['category', 'type', 'dept'])).trim();
    const rawQty = getVal(['quantity', 'qty', 'stock', 'on hand', 'amount']);
    const rawUnit = String(getVal(['unit', 'uom', 'measurement'])).trim().toLowerCase();
    const rawMinThreshold = getVal(['min threshold', 'min_threshold', 'threshold', 'min', 'par level', 'reorder level']);
    const rawUnitCost = getVal(['unit cost (₹)', 'unit cost', 'unit_cost', 'cost', 'cost price', 'purchase price', 'price']);
    const supplier = String(getVal(['supplier', 'vendor', 'distributor'])).trim();

    if (!name) errors.push('Name is required');

    let category: InventoryCategory = 'Raw Ingredients';
    if (!rawCategory) {
      errors.push('Category is required');
    } else {
      const match = CATEGORY_MAP[rawCategory.toLowerCase()];
      if (match) {
        category = match;
      } else {
        warnings.push(`Unrecognized category "${rawCategory}", defaulted to "Raw Ingredients"`);
      }
    }

    let quantity = 0;
    if (rawQty === '' || isNaN(Number(rawQty))) {
      errors.push('Quantity must be a valid number');
    } else {
      quantity = Math.max(0, Number(rawQty));
    }

    let unit: InventoryUnit = 'kg';
    const validUnits: InventoryUnit[] = ['kg', 'g', 'L', 'ml', 'packs', 'units', 'boxes', 'bags'];
    const matchedUnit = validUnits.find(u => u.toLowerCase() === rawUnit);
    if (matchedUnit) {
      unit = matchedUnit;
    } else if (rawUnit) {
      warnings.push(`Unit "${rawUnit}" standardizing to "units"`);
      unit = 'units';
    }

    let minThreshold = 5;
    if (rawMinThreshold !== '' && !isNaN(Number(rawMinThreshold))) {
      minThreshold = Math.max(0, Number(rawMinThreshold));
    }

    let unitCost = 0;
    if (rawUnitCost === '' || isNaN(Number(rawUnitCost))) {
      errors.push('Unit Cost (₹) must be a valid number');
    } else {
      unitCost = Math.max(0, Number(rawUnitCost));
    }

    const cleanSku = `INV-${name.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const existing = existingInventory.find(i => 
      i.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      warnings.push(`Matches existing product "${existing.name}". Will update stock to ${quantity}${unit}.`);
    }

    const item: InventoryItem = {
      id: existing ? existing.id : `inv-${Date.now().toString(36)}-${index}`,
      name,
      sku: existing?.sku || cleanSku,
      category,
      unit,
      quantity,
      minThreshold,
      unitCost,
      price: existing?.price || Number((unitCost * 1.6).toFixed(2)),
      supplier: supplier || existing?.supplier || 'Standard Roaster Co.',
      location: existing?.location || 'Main Storage',
      isArchived: false,
      updatedAt: Date.now(),
      imageUrl: existing?.imageUrl || DEFAULT_CATEGORY_IMAGES[category]
    };

    parsedRows.push({
      rowNumber,
      item,
      isValid: errors.length === 0,
      isExistingSku: !!existing,
      errors,
      warnings,
      raw: row
    });
  });

  return parsedRows;
};

// -------------------------------------------------------------
// 4. MENU ITEMS PARSER
// -------------------------------------------------------------
export interface ParsedMenuItemRow {
  rowNumber: number;
  item: MenuItem;
  isValid: boolean;
  isExisting: boolean;
  errors: string[];
  warnings: string[];
  raw: Record<string, any>;
}

const MENU_CATEGORY_MAP: Record<string, MenuCategory> = {
  'espresso & specialty coffee': 'Espresso & Specialty Coffee',
  'espresso': 'Espresso & Specialty Coffee',
  'specialty coffee': 'Espresso & Specialty Coffee',
  'coffee': 'Espresso & Specialty Coffee',
  'cold brews & teas': 'Cold Brews & Teas',
  'cold brew': 'Cold Brews & Teas',
  'tea': 'Cold Brews & Teas',
  'teas': 'Cold Brews & Teas',
  'artisan bakery': 'Artisan Bakery',
  'bakery': 'Artisan Bakery',
  'pastry': 'Artisan Bakery',
  'all-day brunch': 'All-Day Brunch',
  'brunch': 'All-Day Brunch',
  'food': 'All-Day Brunch'
};

const DEFAULT_MENU_IMAGES: Record<MenuCategory, string> = {
  'Espresso & Specialty Coffee': 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80',
  'Cold Brews & Teas': 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
  'Artisan Bakery': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
  'All-Day Brunch': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80'
};

export const parseMenuItemsSpreadsheet = async (
  file: File,
  existingMenu: MenuItem[],
  inventory?: InventoryItem[]
): Promise<ParsedMenuItemRow[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Spreadsheet has no sheets.');
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('Spreadsheet contains no rows or data.');
  }

  const parsedRows: ParsedMenuItemRow[] = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const errors: string[] = [];
    const warnings: string[] = [];

    const getVal = (possibleKeys: string[]): any => {
      for (const k of possibleKeys) {
        const foundKey = Object.keys(row).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
          return row[foundKey];
        }
      }
      return '';
    };

    const name = String(getVal(['name', 'dish name', 'item name', 'item', 'title'])).trim();
    const rawCategory = String(getVal(['category', 'type', 'menu category'])).trim();
    const rawPrice = getVal(['price (₹)', 'price', 'selling price', 'mrp', 'rate']);
    const description = String(getVal(['description', 'desc', 'details', 'notes'])).trim();
    const prepTime = String(getVal(['prep time', 'prep_time', 'time', 'duration'])).trim() || '3-5 mins';
    const rawTags = String(getVal(['dietary tags', 'dietary', 'tags', 'diet'])).trim();
    const rawRecipe = String(getVal(['required ingredients', 'ingredients', 'recipe', 'ingredient', 'raw ingredients'])).trim();
    const rawAvailable = String(getVal(['available', 'is available', 'isavailable', 'in stock'])).trim().toLowerCase();

    if (!name) errors.push('Name is required');

    let category: MenuCategory = 'Espresso & Specialty Coffee';
    if (!rawCategory) {
      errors.push('Category is required');
    } else {
      const match = MENU_CATEGORY_MAP[rawCategory.toLowerCase()];
      if (match) {
        category = match;
      } else {
        warnings.push(`Unrecognized category "${rawCategory}", defaulted to "Espresso & Specialty Coffee"`);
      }
    }

    let price = 0;
    if (rawPrice === '' || isNaN(Number(rawPrice))) {
      errors.push('Price (₹) must be a valid number');
    } else {
      price = Math.max(0, Number(rawPrice));
    }

    const dietaryTags: DietaryTag[] = [];
    if (rawTags) {
      const tagsSplit = rawTags.split(/[,/| ]+/).map(t => t.trim().toUpperCase());
      const validDietary: DietaryTag[] = ['VG', 'V', 'GF', 'DF', 'N'];
      tagsSplit.forEach(t => {
        if (validDietary.includes(t as DietaryTag)) {
          if (!dietaryTags.includes(t as DietaryTag)) dietaryTags.push(t as DietaryTag);
        }
      });
    }

    // Parse recipe ingredients
    const parsedRecipe: RecipeIngredient[] = [];
    if (rawRecipe) {
      const tokens = rawRecipe.split(/[,;]+/).map(t => t.trim()).filter(Boolean);
      tokens.forEach(token => {
        let ingName = token;
        let reqQty = 1;

        if (token.includes(':')) {
          const s = token.split(':');
          ingName = s[0].trim();
          const q = parseFloat(s[1]);
          if (!isNaN(q) && q > 0) reqQty = q;
        } else if (token.includes('=')) {
          const s = token.split('=');
          ingName = s[0].trim();
          const q = parseFloat(s[1]);
          if (!isNaN(q) && q > 0) reqQty = q;
        }

        const matchedInv = inventory?.find(i => 
          i.id.toLowerCase() === ingName.toLowerCase() ||
          i.name.toLowerCase() === ingName.toLowerCase() ||
          i.sku.toLowerCase() === ingName.toLowerCase() ||
          i.name.toLowerCase().includes(ingName.toLowerCase())
        );

        parsedRecipe.push({
          inventoryItemId: matchedInv ? matchedInv.id : `inv-${ingName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: matchedInv ? matchedInv.name : ingName,
          quantityRequired: reqQty,
          unit: matchedInv ? matchedInv.unit : 'units'
        });
      });
    }

    const isAvailable = rawAvailable === '' || rawAvailable === 'true' || rawAvailable === 'yes' || rawAvailable === '1' || rawAvailable === 'y';

    const existing = existingMenu.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      warnings.push(`Matches existing menu item "${existing.name}". Will update price to ₹${price}.`);
    }

    const item: MenuItem = {
      id: existing ? existing.id : `menu-${Date.now().toString(36)}-${index}`,
      name,
      category,
      price,
      description: description || existing?.description || `Freshly crafted ${name} prepared by our baristas.`,
      dietaryTags: dietaryTags.length > 0 ? dietaryTags : (existing?.dietaryTags || ['V']),
      isAvailable,
      imageUrl: existing?.imageUrl || DEFAULT_MENU_IMAGES[category],
      prepTime: prepTime || existing?.prepTime || '3-5 mins',
      tastingNotes: existing?.tastingNotes || ['Fresh Roast', 'Balanced Body'],
      featured: existing?.featured || false,
      recipe: parsedRecipe.length > 0 ? parsedRecipe : (existing?.recipe || [])
    };

    parsedRows.push({
      rowNumber,
      item,
      isValid: errors.length === 0,
      isExisting: !!existing,
      errors,
      warnings,
      raw: row
    });
  });

  return parsedRows;
};
