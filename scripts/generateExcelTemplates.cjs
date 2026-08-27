const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 1. MENU ITEMS TEMPLATE DATA
const MENU_ITEMS_DATA = [
  {
    'Name': 'Ethiopian Yirgacheffe Pour-Over',
    'Category': 'Espresso & Specialty Coffee',
    'Price (₹)': 340,
    'Description': 'Single-origin floral and citrus microlot brewed on Hario V60.',
    'Prep Time': '4-5 mins',
    'Dietary Tags': 'VG, GF, DF',
    'Available': 'TRUE'
  },
  {
    'Name': 'Valencia Orange Peel Cortado',
    'Category': 'Espresso & Specialty Coffee',
    'Price (₹)': 280,
    'Description': 'Double ristretto extracted over organic Valencia orange zest with silky milk.',
    'Prep Time': '3-4 mins',
    'Dietary Tags': 'GF, V',
    'Available': 'TRUE'
  },
  {
    'Name': 'Kyoto 18-Hour Slow-Drip Cold Brew',
    'Category': 'Cold Brews & Teas',
    'Price (₹)': 330,
    'Description': 'Slow gravity-extracted drop-by-drop cold brew with zero bitterness.',
    'Prep Time': 'Instant',
    'Dietary Tags': 'VG, GF, DF',
    'Available': 'TRUE'
  },
  {
    'Name': 'Ceremonial Uji Matcha Latte',
    'Category': 'Cold Brews & Teas',
    'Price (₹)': 360,
    'Description': 'First-harvest Japanese tencha whisked with Califia oat milk and vanilla.',
    'Prep Time': '3-4 mins',
    'Dietary Tags': 'VG, GF, DF',
    'Available': 'TRUE'
  },
  {
    'Name': 'Artisan Butter Croissant',
    'Category': 'Artisan Bakery',
    'Price (₹)': 220,
    'Description': '72-hour fermented sourdough croissant with 27 delicate honeycomb layers.',
    'Prep Time': 'Warm on request',
    'Dietary Tags': 'V',
    'Available': 'TRUE'
  },
  {
    'Name': 'Pistachio & Rosewater Cruffin',
    'Category': 'Artisan Bakery',
    'Price (₹)': 290,
    'Description': 'Croissant pastry filled with Sicilian pistachio cream and rosewater sugar.',
    'Prep Time': 'Ready to serve',
    'Dietary Tags': 'V, N',
    'Available': 'TRUE'
  },
  {
    'Name': 'Avocado Tartine on Sourdough',
    'Category': 'All-Day Brunch',
    'Price (₹)': 420,
    'Description': 'Hass avocado mash, heirloom cherry tomatoes, Aleppo chili on seeded loaf.',
    'Prep Time': '8-10 mins',
    'Dietary Tags': 'VG, DF',
    'Available': 'TRUE'
  },
  {
    'Name': 'Shakshuka Provençale',
    'Category': 'All-Day Brunch',
    'Price (₹)': 450,
    'Description': 'Poached farm eggs in spiced San Marzano tomato ragout with French feta.',
    'Prep Time': '12-14 mins',
    'Dietary Tags': 'V, GF',
    'Available': 'TRUE'
  }
];

const MENU_INSTRUCTIONS = [
  { 'Field': 'Name', 'Required': 'YES', 'Description': 'Name of the menu dish or beverage (e.g., Flat White, Butter Croissant)' },
  { 'Field': 'Category', 'Required': 'YES', 'Description': 'Must be one of: "Espresso & Specialty Coffee", "Cold Brews & Teas", "Artisan Bakery", "All-Day Brunch"' },
  { 'Field': 'Price (₹)', 'Required': 'YES', 'Description': 'Selling price in Indian Rupees (e.g., 280)' },
  { 'Field': 'Description', 'Required': 'NO', 'Description': 'Short description of the item ingredients and flavor notes' },
  { 'Field': 'Prep Time', 'Required': 'NO', 'Description': 'Average preparation duration (e.g., "3-5 mins", "8-10 mins")' },
  { 'Field': 'Dietary Tags', 'Required': 'NO', 'Description': 'Comma-separated tags: VG (Vegan), V (Vegetarian), GF (Gluten-Free), DF (Dairy-Free), N (Contains Nuts)' },
  { 'Field': 'Available', 'Required': 'NO', 'Description': 'Set TRUE or YES if currently in stock and available on POS' }
];

// 2. INVENTORY & PRODUCTS TEMPLATE DATA (7 Simplified Essential Fields)
const INVENTORY_DATA = [
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
    'Name': 'Colombia Geisha Natural Roast',
    'Category': 'Retail Coffee Beans',
    'Quantity': 15,
    'Unit': 'kg',
    'Min Threshold': 4,
    'Unit Cost (₹)': 1400,
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
    'Name': 'Almond Milk Barista (1L)',
    'Category': 'Dairy & Alt',
    'Quantity': 36,
    'Unit': 'units',
    'Min Threshold': 10,
    'Unit Cost (₹)': 160,
    'Supplier': 'PureDairy Logistics'
  },
  {
    'Name': 'Organic Whole Milk',
    'Category': 'Dairy & Alt',
    'Quantity': 40,
    'Unit': 'L',
    'Min Threshold': 15,
    'Unit Cost (₹)': 65,
    'Supplier': 'Local Dairy Co'
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
  },
  {
    'Name': 'Organic White Flour T55',
    'Category': 'Bakery & Pantry',
    'Quantity': 50,
    'Unit': 'kg',
    'Min Threshold': 15,
    'Unit Cost (₹)': 85,
    'Supplier': 'Heritage Millers'
  }
];

const INVENTORY_INSTRUCTIONS = [
  { 'Field': 'Name', 'Required': 'YES', 'Description': 'Name of raw ingredient or product' },
  { 'Field': 'Category', 'Required': 'YES', 'Description': '"Raw Ingredients", "Retail Coffee Beans", "Dairy & Alt", "Packaging", "Bakery & Pantry"' },
  { 'Field': 'Quantity', 'Required': 'YES', 'Description': 'Initial physical stock on hand (e.g. 25, 48)' },
  { 'Field': 'Unit', 'Required': 'YES', 'Description': '"kg", "g", "L", "ml", "packs", "units", "boxes", "bags"' },
  { 'Field': 'Min Threshold', 'Required': 'YES', 'Description': 'Minimum stock level before low stock warning triggers (e.g. 5, 12)' },
  { 'Field': 'Unit Cost (₹)', 'Required': 'YES', 'Description': 'Purchase cost paid to supplier per unit in ₹ (e.g. 850, 180)' },
  { 'Field': 'Supplier', 'Required': 'NO', 'Description': 'Supplier / Vendor Company Name' }
];

// Target directories
const publicTemplatesDir = path.join(__dirname, '..', 'public', 'templates');
const rootDir = path.join(__dirname, '..');

if (!fs.existsSync(publicTemplatesDir)) {
  fs.mkdirSync(publicTemplatesDir, { recursive: true });
}

// 1. Build Menu Items Workbook (.xlsx)
const menuWb = XLSX.utils.book_new();
const menuWs = XLSX.utils.json_to_sheet(MENU_ITEMS_DATA);
menuWs['!cols'] = [
  { wch: 36 }, // Name
  { wch: 30 }, // Category
  { wch: 14 }, // Price
  { wch: 60 }, // Description
  { wch: 16 }, // Prep Time
  { wch: 18 }, // Dietary Tags
  { wch: 14 }  // Available
];
XLSX.utils.book_append_sheet(menuWb, menuWs, 'Menu Items Template');

const menuInstWs = XLSX.utils.json_to_sheet(MENU_INSTRUCTIONS);
menuInstWs['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 70 }];
XLSX.utils.book_append_sheet(menuWb, menuInstWs, 'Instructions');

// 2. Build Inventory / Products Workbook (.xlsx)
const invWb = XLSX.utils.book_new();
const invWs = XLSX.utils.json_to_sheet(INVENTORY_DATA);
invWs['!cols'] = [
  { wch: 38 }, // Name
  { wch: 24 }, // Category
  { wch: 14 }, // Quantity
  { wch: 12 }, // Unit
  { wch: 16 }, // Min Threshold
  { wch: 16 }, // Unit Cost
  { wch: 30 }  // Supplier
];
XLSX.utils.book_append_sheet(invWb, invWs, 'Products & Inventory');

const invInstWs = XLSX.utils.json_to_sheet(INVENTORY_INSTRUCTIONS);
invInstWs['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 70 }];
XLSX.utils.book_append_sheet(invWb, invInstWs, 'Instructions');

// Write Excel files
const menuFilePublic = path.join(publicTemplatesDir, 'Aura_Cafe_Menu_Items_Template.xlsx');
const menuFileRoot = path.join(rootDir, 'Aura_Cafe_Menu_Items_Template.xlsx');
XLSX.writeFile(menuWb, menuFilePublic);
XLSX.writeFile(menuWb, menuFileRoot);

const invFilePublic = path.join(publicTemplatesDir, 'Aura_Cafe_Products_Inventory_Template.xlsx');
const invFileRoot = path.join(rootDir, 'Aura_Cafe_Products_Inventory_Template.xlsx');
XLSX.writeFile(invWb, invFilePublic);
XLSX.writeFile(invWb, invFileRoot);

// Write CSV files
const menuCsv = XLSX.utils.sheet_to_csv(menuWs);
fs.writeFileSync(path.join(publicTemplatesDir, 'Aura_Cafe_Menu_Items_Template.csv'), menuCsv);
fs.writeFileSync(path.join(rootDir, 'Aura_Cafe_Menu_Items_Template.csv'), menuCsv);

const invCsv = XLSX.utils.sheet_to_csv(invWs);
fs.writeFileSync(path.join(publicTemplatesDir, 'Aura_Cafe_Products_Inventory_Template.csv'), invCsv);
fs.writeFileSync(path.join(rootDir, 'Aura_Cafe_Products_Inventory_Template.csv'), invCsv);

console.log('✅ Successfully generated Excel and CSV templates:');
console.log('1. Aura_Cafe_Menu_Items_Template.xlsx');
console.log('2. Aura_Cafe_Products_Inventory_Template.xlsx');
console.log('3. Aura_Cafe_Menu_Items_Template.csv');
console.log('4. Aura_Cafe_Products_Inventory_Template.csv');
