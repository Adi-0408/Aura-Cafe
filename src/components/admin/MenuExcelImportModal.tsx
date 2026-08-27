import React, { useState, useRef } from 'react';
import { useMenu } from '../../context/MenuContext';
import { MenuItem } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { 
  MENU_COLUMNS_SPEC, 
  SAMPLE_MENU_DATA, 
  downloadMenuItemsExcelTemplate, 
  downloadMenuItemsCsvTemplate,
  parseMenuItemsSpreadsheet,
  ParsedMenuItemRow 
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
  UtensilsCrossed,
  Clock,
  Layers
} from 'lucide-react';

interface MenuExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MenuExcelImportModal: React.FC<MenuExcelImportModalProps> = ({ isOpen, onClose }) => {
  const { menuItems, bulkImportMenuItems, isSyncing } = useMenu();
  
  const [activeTab, setActiveTab] = useState<'upload' | 'format'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedMenuItemRow[]>([]);
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
      const results = await parseMenuItemsSpreadsheet(selectedFile, menuItems);
      setParsedRows(results);
      
      const validIndices = new Set<number>();
      results.forEach((row, idx) => {
        if (row.isValid) {
          validIndices.add(idx);
        }
      });
      setSelectedRowIndices(validIndices);
    } catch (err: any) {
      console.error('Error parsing menu items excel:', err);
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

  const handleToggleSelectRow = (index: number) => {
    setSelectedRowIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSelectAllValid = () => {
    const validIndices = new Set<number>();
    parsedRows.forEach((row, idx) => {
      if (row.isValid) validIndices.add(idx);
    });
    setSelectedRowIndices(validIndices);
  };

  const handleDeselectAll = () => {
    setSelectedRowIndices(new Set());
  };

  const handleConfirmImport = async () => {
    if (selectedRowIndices.size === 0) return;

    const itemsToImport: MenuItem[] = [];
    selectedRowIndices.forEach(idx => {
      const row = parsedRows[idx];
      if (row && row.isValid) {
        itemsToImport.push(row.item);
      }
    });

    try {
      await bulkImportMenuItems(itemsToImport);
      setImportSuccessCount(itemsToImport.length);
      setParsedRows([]);
      setFile(null);
      setSelectedRowIndices(new Set());
    } catch (err: any) {
      setParseError('Failed to import items to menu: ' + err.message);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D2DFE2] shadow-warm-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="p-6 bg-[#10222B] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#1E3A47] text-[#77C7C6] flex items-center justify-center shadow-inner ring-2 ring-[#77C7C6]/20">
              <FileSpreadsheet className="w-6 h-6 text-[#77C7C6]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-xl text-white">
                  Import Menu Items from Excel
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#1B8585]/30 text-[#77C7C6] text-[10px] font-bold border border-[#77C7C6]/30">
                  Bulk Catalog
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Add beverages, dishes, and pastries from an Excel (.xlsx) or CSV spreadsheet.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-[#D2DFE2] bg-[#F6F9FA] shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-[#1B8585] text-[#10222B]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload & Import</span>
              {parsedRows.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-[#10222B] text-white text-[10px] font-mono">
                  {parsedRows.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('format')}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'format'
                  ? 'border-[#1B8585] text-[#10222B]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-[#1B8585]" />
              <span>Excel Format & Template</span>
            </button>
          </div>

          {/* Quick Template Download Links */}
          <div className="flex items-center gap-2 py-2">
            <button
              type="button"
              onClick={downloadMenuItemsExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-[#10222B] border border-[#D2DFE2] text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Download Excel Template with Sample Dishes"
            >
              <Download className="w-3.5 h-3.5 text-[#1B8585]" />
              <span>Download Excel Template</span>
            </button>
            <button
              type="button"
              onClick={downloadMenuItemsCsvTemplate}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-600 border border-[#D2DFE2] text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* SUCCESS NOTIFICATION */}
          {importSuccessCount !== null && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2 animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <h4 className="font-bold text-sm">
                    Successfully imported {importSuccessCount} menu items!
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setImportSuccessCount(null)}
                  className="text-emerald-700 hover:text-emerald-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-emerald-800 pl-8.5">
                All dishes and prices have been added and synchronized with the Live POS counter.
              </p>
            </div>
          )}

          {/* PARSE ERROR NOTIFICATION */}
          {parseError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Error Parsing Spreadsheet</span>
                  <span>{parseError}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setParseError(null)}
                className="text-rose-700 hover:text-rose-900 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: UPLOAD & IMPORT */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              
              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-3 ${
                  isDragging 
                    ? 'border-[#1B8585] bg-[#EBF7F7]/60 scale-[1.01]' 
                    : 'border-[#D2DFE2] bg-[#F6F9FA]/70 hover:bg-[#F2F6F7] hover:border-[#1B8585]/60'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-white shadow-warm-sm border border-[#D2DFE2] flex items-center justify-center text-[#1B8585]">
                  <Upload className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-sm text-[#10222B]">
                    {file ? file.name : 'Click to browse or drag & drop your Excel file here'}
                  </p>
                  <p className="text-xs text-stone-500">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)
                  </p>
                </div>

                {isParsing && (
                  <div className="flex items-center gap-2 text-xs text-[#1B8585] font-bold">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Parsing spreadsheet rows...</span>
                  </div>
                )}
              </div>

              {/* Parsed Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#F6F9FA] border border-[#D2DFE2]">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-bold text-[#10222B]">
                        Found {parsedRows.length} Items:
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        {validCount} Ready to Import
                      </span>
                      {invalidCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                          {invalidCount} Errors
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllValid}
                        className="text-xs text-[#1B8585] hover:underline font-bold"
                      >
                        Select All Valid
                      </button>
                      <span className="text-stone-300">|</span>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="text-xs text-stone-500 hover:text-stone-800"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="border border-[#D2DFE2] rounded-2xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto max-h-[360px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#F6F9FA] text-[11px] font-bold text-stone-600 uppercase tracking-wider sticky top-0 z-10 border-b border-[#D2DFE2]">
                          <tr>
                            <th className="py-3 px-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={selectedRowIndices.size === validCount && validCount > 0}
                                onChange={(e) => {
                                  if (e.target.checked) handleSelectAllValid();
                                  else handleDeselectAll();
                                }}
                                className="rounded border-stone-300 text-[#1B8585] focus:ring-[#1B8585]"
                              />
                            </th>
                            <th className="py-3 px-3 w-12 text-center">Row</th>
                            <th className="py-3 px-4">Item Name</th>
                            <th className="py-3 px-3">Category</th>
                            <th className="py-3 px-3 text-right">Price (₹)</th>
                            <th className="py-3 px-3">Prep Time</th>
                            <th className="py-3 px-3">Tags</th>
                            <th className="py-3 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D2DFE2]/70">
                          {parsedRows.map((row, idx) => {
                            const isSelected = selectedRowIndices.has(idx);

                            return (
                              <tr 
                                key={idx}
                                className={`transition-colors ${
                                  !row.isValid 
                                    ? 'bg-rose-50/60' 
                                    : isSelected 
                                    ? 'bg-[#EBF7F7]/50' 
                                    : 'hover:bg-[#F6F9FA]'
                                }`}
                              >
                                <td className="py-3 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    disabled={!row.isValid}
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectRow(idx)}
                                    className="rounded border-stone-300 text-[#1B8585] focus:ring-[#1B8585] disabled:opacity-30"
                                  />
                                </td>
                                <td className="py-3 px-3 text-center font-mono text-stone-400">
                                  #{row.rowNumber}
                                </td>
                                <td className="py-3 px-4 font-bold text-[#10222B]">
                                  <div>
                                    <span>{row.item.name || '(Blank Name)'}</span>
                                    {row.item.description && (
                                      <p className="text-[10px] text-stone-500 font-normal line-clamp-1 max-w-xs">
                                        {row.item.description}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold">
                                    {row.item.category}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-[#10222B]">
                                  {formatCurrency(row.item.price)}
                                </td>
                                <td className="py-3 px-3 text-stone-600">
                                  {row.item.prepTime || '3-5 mins'}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-1">
                                    {row.item.dietaryTags?.map(t => (
                                      <span key={t} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[9px] font-bold">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap">
                                  {row.isValid ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-bold">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Ready</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-rose-700 text-[11px] font-bold" title={row.errors.join(', ')}>
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                      <span>{row.errors[0]}</span>
                                    </span>
                                  )}
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

          {/* TAB 2: FORMAT SPECIFICATION */}
          {activeTab === 'format' && (
            <div className="space-y-6">
              
              {/* Instructions banner */}
              <div className="p-5 rounded-2xl bg-[#EBF7F7] border border-[#A3DEDE] flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-[#1B8585] text-white flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#10222B]">
                    Menu Items Excel Format Guidelines
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Make sure your Excel spreadsheet has the column names listed below in Row 1. You can directly download our pre-filled template and replace the rows with your cafe's menu!
                  </p>
                </div>
              </div>

              {/* Columns Table */}
              <div className="border border-[#D2DFE2] rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F6F9FA] text-[11px] font-bold text-stone-600 uppercase tracking-wider border-b border-[#D2DFE2]">
                    <tr>
                      <th className="py-3 px-4 w-32">Column Header</th>
                      <th className="py-3 px-3 w-24">Required?</th>
                      <th className="py-3 px-3 w-20">Type</th>
                      <th className="py-3 px-4">Description & Allowed Values</th>
                      <th className="py-3 px-4 w-44">Example Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D2DFE2]/70">
                    {MENU_COLUMNS_SPEC.map(col => (
                      <tr key={col.key} className="hover:bg-[#F6F9FA] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#10222B]">
                          {col.name}
                        </td>
                        <td className="py-3 px-3">
                          {col.required ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                              Required
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px]">
                              Optional
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-stone-500 font-mono">
                          {col.type}
                        </td>
                        <td className="py-3 px-4 text-stone-600">
                          <p>{col.description}</p>
                          {col.allowedValues && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {col.allowedValues.map(v => (
                                <span key={v} className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px] font-mono">
                                  {v}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-[#1B8585]">
                          {col.example}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sample preview box */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Sample Excel Rows Included in Template
                </span>
                <div className="border border-[#D2DFE2] rounded-2xl overflow-x-auto bg-[#F6F9FA] p-4 text-xs font-mono text-stone-700">
                  <div className="flex gap-4 border-b border-[#D2DFE2] pb-2 font-bold text-[#10222B]">
                    <span className="w-48">Name</span>
                    <span className="w-44">Category</span>
                    <span className="w-20 text-right">Price (₹)</span>
                    <span className="w-24">Prep Time</span>
                    <span className="w-20">Dietary</span>
                    <span>Available</span>
                  </div>
                  {SAMPLE_MENU_DATA.map((row, i) => (
                    <div key={i} className="flex gap-4 py-1.5 border-b border-stone-200/50 last:border-none">
                      <span className="w-48 truncate font-medium">{row.Name}</span>
                      <span className="w-44 truncate text-stone-500">{row.Category}</span>
                      <span className="w-20 text-right font-bold text-emerald-700">₹{row['Price (₹)']}</span>
                      <span className="w-24 text-stone-500">{row['Prep Time']}</span>
                      <span className="w-20 text-stone-500">{row['Dietary Tags']}</span>
                      <span className="text-stone-500">{row.Available}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 bg-[#F6F9FA] border-t border-[#D2DFE2] flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-500">
            {selectedRowIndices.size > 0 ? (
              <span><strong>{selectedRowIndices.size}</strong> items selected for import</span>
            ) : (
              <span>Select valid rows to import to menu catalog</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#D2DFE2] bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={selectedRowIndices.size === 0 || isSyncing}
              onClick={handleConfirmImport}
              className="px-6 py-2.5 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#77C7C6] hover:text-white text-xs font-bold transition-all shadow-warm-md flex items-center gap-2 disabled:opacity-40 cursor-pointer active:scale-95"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Import {selectedRowIndices.size} Items to Menu</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
