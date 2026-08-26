import React, { useState, useRef } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { InventoryItem } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { 
  SPREADSHEET_COLUMNS_SPEC, 
  SAMPLE_PRODUCTS_DATA, 
  downloadSampleExcelTemplate, 
  downloadSampleCsvTemplate,
  parseProductsSpreadsheet,
  ParsedProductRow 
} from '../../utils/excelImport';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  FileText, 
  X, 
  Sparkles, 
  Check, 
  RefreshCw, 
  ArrowRight,
  Info,
  Layers,
  FileCheck
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
  const { inventory, bulkImportItems, isSyncing } = useInventory();
  
  const [activeTab, setActiveTab] = useState<'upload' | 'format'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelected = async (selectedFile: File) => {
    setParseError(null);
    setImportSuccessCount(null);
    setFile(selectedFile);
    setIsParsing(true);

    try {
      const results = await parseProductsSpreadsheet(selectedFile, inventory);
      setParsedRows(results);
      
      // Auto-select all valid rows
      const validIndices = new Set<number>();
      results.forEach((row, idx) => {
        if (row.isValid) {
          validIndices.add(idx);
        }
      });
      setSelectedRowIndices(validIndices);
    } catch (err: any) {
      console.error('Error parsing excel spreadsheet:', err);
      setParseError(err.message || 'Failed to read spreadsheet. Please check file format.');
      setParsedRows([]);
      setSelectedRowIndices(new Set());
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const validExts = ['.xlsx', '.xls', '.csv'];
      const isExtValid = validExts.some(ext => droppedFile.name.toLowerCase().endsWith(ext));
      if (isExtValid) {
        handleFileSelected(droppedFile);
      } else {
        setParseError('Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const toggleRowSelect = (index: number) => {
    const next = new Set(selectedRowIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedRowIndices(next);
  };

  const toggleSelectAll = () => {
    if (selectedRowIndices.size === parsedRows.filter(r => r.isValid).length) {
      setSelectedRowIndices(new Set());
    } else {
      const allValid = new Set<number>();
      parsedRows.forEach((row, idx) => {
        if (row.isValid) allValid.add(idx);
      });
      setSelectedRowIndices(allValid);
    }
  };

  const handleExecuteImport = async () => {
    if (selectedRowIndices.size === 0) return;
    
    const itemsToImport: InventoryItem[] = [];
    selectedRowIndices.forEach(idx => {
      const row = parsedRows[idx];
      if (row && row.isValid) {
        itemsToImport.push(row.item);
      }
    });

    try {
      const count = await bulkImportItems(itemsToImport);
      setImportSuccessCount(count);
      setTimeout(() => {
        onClose();
        // Reset modal state
        setFile(null);
        setParsedRows([]);
        setImportSuccessCount(null);
      }, 2000);
    } catch (err: any) {
      setParseError('Failed to import items: ' + err.message);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setParseError(null);
    setImportSuccessCount(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;
  const warningCount = parsedRows.filter(r => r.warnings.length > 0).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D2DFE2] shadow-warm-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
        
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 bg-[#F6F9FA] border-b border-[#D2DFE2] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#10222B] text-[#77C7C6] flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-6 h-6 text-[#77C7C6]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[#10222B]">
                  Bulk Import Products via Spreadsheet
                </h3>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[#EBF7F7] text-[#146868] font-bold text-[11px] border border-[#A3DEDE]">
                  Excel & CSV
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Upload your product catalogue in Excel or CSV to instantly populate stock and sync across all registers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="px-6 py-3 bg-white border-b border-[#D2DFE2] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2]/70">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white text-[#10222B] shadow-2xs'
                  : 'text-stone-600 hover:text-[#10222B]'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-[#1B8585]" />
              <span>Upload & Import</span>
              {parsedRows.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#10222B] text-[#77C7C6] text-[10px] font-bold ml-1">
                  {parsedRows.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('format')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'format'
                  ? 'bg-white text-[#10222B] shadow-2xs'
                  : 'text-stone-600 hover:text-[#10222B]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>Excel Format & Guide</span>
            </button>
          </div>

          {/* Quick Template Download Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadSampleExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2F6F7] hover:bg-[#E5ECEE] text-[#10222B] text-xs font-bold transition-all border border-[#D2DFE2] cursor-pointer shadow-2xs"
              title="Download pre-formatted Excel workbook (.xlsx) with column headers and sample data"
            >
              <Download className="w-3.5 h-3.5 text-[#1B8585]" />
              <span>Download Excel Template</span>
            </button>

            <button
              type="button"
              onClick={downloadSampleCsvTemplate}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2F6F7] hover:bg-[#E5ECEE] text-stone-700 text-xs font-semibold transition-all border border-[#D2DFE2] cursor-pointer shadow-2xs"
              title="Download CSV format (.csv)"
            >
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* TAB 1: UPLOAD & IMPORT */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              
              {/* Success Notification */}
              {importSuccessCount !== null && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-fade-in">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-emerald-950">
                      Successfully imported {importSuccessCount} products!
                    </h4>
                    <p className="text-xs text-emerald-800">
                      Inventory records updated and synced in real-time to Cloud Firestore.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Notification */}
              {parseError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-3 animate-fade-in">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div className="text-xs font-medium">{parseError}</div>
                </div>
              )}

              {/* Dropzone (Shown if no file parsed yet or user wants to upload another) */}
              {!file && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#1B8585] bg-[#EBF7F7]/60 ring-4 ring-[#1B8585]/20 scale-[0.99]'
                      : 'border-[#D2DFE2] bg-[#F6F9FA] hover:border-[#1B8585]/60 hover:bg-[#F2F8F8]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-[#10222B] text-[#77C7C6] flex items-center justify-center mx-auto shadow-warm-md">
                      <Upload className="w-8 h-8" />
                    </div>

                    <div>
                      <h4 className="font-serif font-bold text-lg text-[#10222B]">
                        Click to upload or drag and drop spreadsheet
                      </h4>
                      <p className="text-xs text-stone-500 mt-1">
                        Accepts Microsoft Excel (<span className="font-mono font-semibold">.xlsx</span>, <span className="font-mono font-semibold">.xls</span>) or CSV (<span className="font-mono font-semibold">.csv</span>)
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#D2DFE2] text-xs font-bold text-[#10222B] shadow-2xs">
                      <span>Select Spreadsheet File</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#1B8585]" />
                    </div>
                  </div>
                </div>
              )}

              {/* File Selected / Parsing Summary Header */}
              {file && (
                <div className="p-4 rounded-2xl bg-[#F6F9FA] border border-[#D2DFE2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-[#10222B] truncate max-w-xs sm:max-w-sm">
                          {file.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-stone-600 font-semibold border border-stone-200">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-0.5">
                        <span>Total Rows: <strong className="text-[#10222B]">{parsedRows.length}</strong></span>
                        <span>•</span>
                        <span className="text-emerald-700">Valid: <strong>{validCount}</strong></span>
                        {invalidCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-rose-600">Errors: <strong>{invalidCount}</strong></span>
                          </>
                        )}
                        {warningCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-700">Notices: <strong>{warningCount}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-xl border border-[#D2DFE2] bg-white hover:bg-stone-50 font-bold transition-all cursor-pointer"
                  >
                    Change File
                  </button>
                </div>
              )}

              {/* Parsed Rows Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#10222B]">
                        Spreadsheet Verification & Preview ({selectedRowIndices.size} selected for import)
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Review the parsed data before saving. Rows with errors will be skipped.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-xs text-[#1B8585] hover:text-[#146868] font-bold cursor-pointer"
                    >
                      {selectedRowIndices.size === validCount ? 'Deselect All' : 'Select All Valid'}
                    </button>
                  </div>

                  <div className="border border-[#D2DFE2] rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto max-h-[380px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#F6F9FA] text-[11px] font-bold text-stone-600 uppercase tracking-wider sticky top-0 z-10 border-b border-[#D2DFE2]">
                          <tr>
                            <th className="py-3 px-3.5 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={validCount > 0 && selectedRowIndices.size === validCount}
                                onChange={toggleSelectAll}
                                className="rounded text-[#1B8585] focus:ring-[#1B8585]"
                              />
                            </th>
                            <th className="py-3 px-3 w-14 text-stone-400">Row</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3.5">Product Name</th>
                            <th className="py-3 px-3">Category</th>
                            <th className="py-3 px-3">SKU</th>
                            <th className="py-3 px-3">Stock & Unit</th>
                            <th className="py-3 px-3">Unit Cost</th>
                            <th className="py-3 px-3">Selling Price</th>
                            <th className="py-3 px-3.5">Supplier</th>
                            <th className="py-3 px-3.5">Location</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D2DFE2]/70">
                          {parsedRows.map((row, idx) => {
                            const isSelected = selectedRowIndices.has(idx);
                            const hasWarnings = row.warnings.length > 0;
                            const hasErrors = row.errors.length > 0;

                            return (
                              <tr 
                                key={idx}
                                className={`transition-colors ${
                                  !row.isValid 
                                    ? 'bg-rose-50/40 text-rose-950' 
                                    : isSelected 
                                    ? 'bg-[#F2F8F8]/60 hover:bg-[#EBF7F7]' 
                                    : 'hover:bg-[#F6F9FA]'
                                }`}
                              >
                                <td className="py-2.5 px-3.5 text-center">
                                  <input
                                    type="checkbox"
                                    disabled={!row.isValid}
                                    checked={isSelected}
                                    onChange={() => toggleRowSelect(idx)}
                                    className="rounded text-[#1B8585] focus:ring-[#1B8585] disabled:opacity-40"
                                  />
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-stone-400">
                                  #{row.rowNumber}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  {hasErrors ? (
                                    <span 
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]"
                                      title={row.errors.join('; ')}
                                    >
                                      <XCircle className="w-3 h-3 text-rose-600" />
                                      <span>Error</span>
                                    </span>
                                  ) : row.isExistingSku ? (
                                    <span 
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]"
                                      title="SKU already exists. Stock count & cost will be updated."
                                    >
                                      <RefreshCw className="w-3 h-3 text-blue-600" />
                                      <span>Update SKU</span>
                                    </span>
                                  ) : hasWarnings ? (
                                    <span 
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]"
                                      title={row.warnings.join('; ')}
                                    >
                                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                                      <span>Notice</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>New SKU</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3.5 font-medium text-[#10222B] max-w-[200px] truncate" title={row.item.name}>
                                  {row.item.name || <span className="text-rose-500 italic">Missing Name</span>}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold border border-stone-200">
                                    {row.item.category}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                                  {row.item.sku}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-[#10222B] whitespace-nowrap">
                                  {row.item.quantity} {row.item.unit}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-emerald-800 whitespace-nowrap">
                                  {formatCurrency(row.item.unitCost)}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-stone-600 whitespace-nowrap">
                                  {formatCurrency(row.item.price)}
                                </td>
                                <td className="py-2.5 px-3.5 text-stone-600 max-w-[160px] truncate" title={row.item.supplier}>
                                  {row.item.supplier}
                                </td>
                                <td className="py-2.5 px-3.5 text-stone-500 text-[11px] max-w-[140px] truncate" title={row.item.location}>
                                  {row.item.location}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: EXCEL FORMAT & COLUMN GUIDE */}
          {activeTab === 'format' && (
            <div className="space-y-6">
              
              {/* Introduction & Quick Rule Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#F6F9FA] border border-[#D2DFE2] space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#10222B]">
                    <span className="w-5 h-5 rounded-full bg-[#10222B] text-[#77C7C6] flex items-center justify-center text-[10px]">1</span>
                    <span>Row 1 is the Header</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    The top row must contain column titles (e.g. <strong className="font-mono text-[#10222B]">Name, Category, Quantity, Unit, Unit Cost</strong>).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F6F9FA] border border-[#D2DFE2] space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#10222B]">
                    <span className="w-5 h-5 rounded-full bg-[#10222B] text-[#77C7C6] flex items-center justify-center text-[10px]">2</span>
                    <span>Recognized Categories</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Use: <em>Raw Ingredients, Retail Coffee Beans, Dairy & Alt, Packaging, Bakery & Pantry</em>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F6F9FA] border border-[#D2DFE2] space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#10222B]">
                    <span className="w-5 h-5 rounded-full bg-[#10222B] text-[#77C7C6] flex items-center justify-center text-[10px]">3</span>
                    <span>Auto-Generated SKUs</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    If you leave the SKU column empty, the system automatically assigns unique codes like <code className="font-mono text-[10px] bg-stone-200 px-1 py-0.5 rounded">SKU-COF-4912</code>.
                  </p>
                </div>
              </div>

              {/* Complete Column Specification Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#10222B]">
                      Required & Supported Excel Columns
                    </h4>
                    <p className="text-xs text-stone-500">
                      Match your spreadsheet columns with the names listed below:
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={downloadSampleExcelTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10222B] text-[#77C7C6] hover:text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Ready Template (.xlsx)</span>
                  </button>
                </div>

                <div className="border border-[#D2DFE2] rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#F6F9FA] text-[11px] font-bold text-stone-600 uppercase tracking-wider border-b border-[#D2DFE2]">
                        <tr>
                          <th className="py-3 px-4">Column Header</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3">Data Type</th>
                          <th className="py-3 px-4">Description & Allowed Values</th>
                          <th className="py-3 px-4">Sample Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D2DFE2]/70">
                        {SPREADSHEET_COLUMNS_SPEC.map((col) => (
                          <tr key={col.key} className="hover:bg-[#F6F9FA]">
                            <td className="py-3 px-4 font-mono font-bold text-xs text-[#10222B]">
                              {col.name}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {col.required ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                                  REQUIRED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-semibold border border-stone-200">
                                  OPTIONAL
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-stone-600 text-[11px] font-medium whitespace-nowrap">
                              {col.type}
                            </td>
                            <td className="py-3 px-4 text-stone-600 text-xs">
                              <div>{col.description}</div>
                              {col.allowedValues && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {col.allowedValues.map(val => (
                                    <span key={val} className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 font-mono text-[10px] border border-stone-200">
                                      {val}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-stone-600 text-xs bg-stone-50/50">
                              {col.example}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sample Data Interactive Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-base text-[#10222B]">
                    Example Template Row Preview
                  </h4>
                  <span className="text-xs text-stone-500">
                    5 sample rows included in the downloadable template
                  </span>
                </div>

                <div className="border border-[#D2DFE2] rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#10222B] text-[11px] font-bold text-[#77C7C6] uppercase tracking-wider">
                        <tr>
                          {Object.keys(SAMPLE_PRODUCTS_DATA[0]).map(header => (
                            <th key={header} className="py-2.5 px-3 whitespace-nowrap">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D2DFE2]/70 font-mono text-[11px]">
                        {SAMPLE_PRODUCTS_DATA.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#F6F9FA]">
                            {Object.values(row).map((val, i) => (
                              <td key={i} className="py-2.5 px-3 text-stone-700 whitespace-nowrap">
                                {typeof val === 'number' ? val.toLocaleString() : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#F6F9FA] border-t border-[#D2DFE2] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-500 text-center sm:text-left">
            {activeTab === 'upload' && parsedRows.length > 0 ? (
              <span>
                Ready to import <strong className="text-[#10222B] font-bold">{selectedRowIndices.size}</strong> verified product{selectedRowIndices.size !== 1 ? 's' : ''} into stock.
              </span>
            ) : (
              <span>
                Need help formatting? Switch to the <button type="button" onClick={() => setActiveTab('format')} className="text-[#1B8585] font-bold hover:underline">Excel Format & Guide</button> tab.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#D2DFE2] bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>

            {activeTab === 'upload' && parsedRows.length > 0 ? (
              <button
                type="button"
                disabled={isSyncing || selectedRowIndices.size === 0 || isParsing}
                onClick={handleExecuteImport}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#77C7C6] hover:text-white text-xs font-bold transition-all shadow-warm-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#77C7C6]" />
                    <span>Syncing with Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#77C7C6]" />
                    <span>Import {selectedRowIndices.size} Product{selectedRowIndices.size !== 1 ? 's' : ''}</span>
                  </>
                )}
              </button>
            ) : activeTab === 'format' ? (
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#77C7C6] hover:text-white text-xs font-bold transition-all shadow-warm-sm active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Spreadsheet Now</span>
              </button>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
};
