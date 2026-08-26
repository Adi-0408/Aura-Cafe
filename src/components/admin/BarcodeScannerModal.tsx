import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useInventory } from '../../context/InventoryContext';
import { InventoryItem } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { 
  ScanLine, 
  X, 
  Camera, 
  CameraOff, 
  Plus, 
  Minus, 
  PackageCheck, 
  AlertTriangle, 
  Search, 
  Check, 
  Barcode,
  History
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHistory?: (item: InventoryItem) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ 
  isOpen, 
  onClose,
  onOpenHistory 
}) => {
  const { inventory, updateStockQuantity } = useInventory();
  const [scannedCode, setScannedCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'aura-barcode-reader-canvas';

  // Find item by barcode or sku or id
  const lookupItem = (code: string): InventoryItem | null => {
    const clean = code.trim().toLowerCase();
    if (!clean) return null;
    return inventory.find(i => 
      (i.barcode && i.barcode.toLowerCase() === clean) ||
      (i.sku && i.sku.toLowerCase() === clean) ||
      (i.id && i.id.toLowerCase() === clean) ||
      (i.name && i.name.toLowerCase().includes(clean))
    ) || null;
  };

  const handleBarcodeDetected = (code: string) => {
    setScannedCode(code);
    const found = lookupItem(code);
    setScannedItem(found);
    if (found) {
      setActionSuccess(`Scanned: ${found.name}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } else {
      setCameraError(`No inventory item matches code "${code}".`);
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleBarcodeDetected(decodedText);
        },
        () => {
          // Frame error (silently ignore)
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera scanner initialization notice:', err);
      setCameraError('Camera access unavailable or blocked. You can use the manual SKU/barcode quick search below.');
      setIsCameraActive(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isCameraActive) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.warn(e);
      }
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      // Auto-focus manual search or start camera
      const firstItem = inventory[0];
      if (firstItem && !scannedItem) {
        setScannedItem(firstItem);
      }
    } else {
      stopScanner();
      setScannedCode('');
      setManualCode('');
      setCameraError(null);
    }
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCameraError(null);
    const found = lookupItem(manualCode);
    if (found) {
      setScannedItem(found);
      setScannedCode(found.barcode || found.sku);
      setActionSuccess(`Found: ${found.name}`);
      setTimeout(() => setActionSuccess(null), 2500);
    } else {
      setCameraError(`No item matches "${manualCode}". Try SKU, barcode, or name.`);
    }
  };

  const handleQuickAdjust = async (delta: number) => {
    if (!scannedItem) return;
    const newQty = Math.max(0, Number((scannedItem.quantity + delta).toFixed(2)));
    await updateStockQuantity(scannedItem.id, newQty, {
      previousQty: scannedItem.quantity,
      reason: 'Barcode Scan',
      notes: `Quick barcode scan adjust: ${delta > 0 ? `+${delta}` : delta} ${scannedItem.unit}`
    });

    setScannedItem(prev => prev ? { ...prev, quantity: newQty } : null);
    setActionSuccess(`Stock adjusted to ${newQty} ${scannedItem.unit}`);
    setTimeout(() => setActionSuccess(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full flex flex-col border border-[#D2DFE2] shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="p-6 bg-[#10222B] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1E3A47] text-[#77C7C6] flex items-center justify-center">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">
                Barcode & QR Quick-Scanner
              </h3>
              <p className="text-xs text-stone-300">
                Scan inventory packages for instant lookup and +1/-1 stock edits
              </p>
            </div>
          </div>

          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          
          {/* Camera View / Toggle Box */}
          <div className="relative rounded-2xl overflow-hidden bg-[#10222B] border border-[#1E3A47] flex flex-col items-center justify-center min-h-[220px]">
            <div id={readerElementId} className="w-full max-w-full overflow-hidden"></div>

            {!isCameraActive && (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#77C7C6] flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-white text-sm">Mobile Camera Ready</h4>
                  <p className="text-stone-400 text-xs mt-0.5">Activate device camera to scan GS1/QR barcodes on raw bags or coffee canisters</p>
                </div>
                <button
                  type="button"
                  onClick={startScanner}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1B8585] text-white text-xs font-bold hover:bg-[#146868] transition-colors shadow-xs"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera Scanner</span>
                </button>
              </div>
            )}

            {isCameraActive && (
              <button
                type="button"
                onClick={stopScanner}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 text-stone-300 hover:text-white text-xs font-semibold backdrop-blur-sm transition-colors flex items-center gap-1.5"
              >
                <CameraOff className="w-3.5 h-3.5" />
                <span>Turn Off Camera</span>
              </button>
            )}
          </div>

          {/* Feedback message */}
          {actionSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {cameraError && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Manual SKU / Barcode Lookup Bar */}
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter SKU, barcode or item name (e.g. SKU-ETH-001)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs font-mono text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#10222B] text-[#F2F6F7] text-xs font-semibold hover:bg-[#1E3A47] transition-colors"
            >
              Lookup
            </button>
          </form>

          {/* Scanned Item Details & Quick Adjustment Panel */}
          {scannedItem ? (
            <div className="p-5 rounded-3xl bg-[#F2F6F7] border border-[#D2DFE2] space-y-4 animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#D2DFE2] flex items-center justify-center font-bold text-sm font-serif text-[#1B8585] shrink-0">
                    {scannedItem.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#10222B]">
                      {scannedItem.name}
                    </h4>
                    <span className="font-mono text-[11px] text-stone-500 block">
                      SKU: {scannedItem.sku} • {scannedItem.category}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Current Stock</span>
                  <span className="font-serif font-bold text-xl text-[#10222B]">
                    {scannedItem.quantity} {scannedItem.unit}
                  </span>
                </div>
              </div>

              {/* Quick Adjustment Controls */}
              <div className="p-3 bg-white rounded-2xl border border-[#D2DFE2]/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700">
                  Quick Stock Adjustment:
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuickAdjust(-1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F2F6F7] hover:bg-rose-50 hover:text-rose-700 text-stone-700 text-xs font-bold border border-[#D2DFE2] transition-colors"
                    title="Deduct 1 unit"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>-1 {scannedItem.unit}</span>
                  </button>

                  <button
                    onClick={() => handleQuickAdjust(1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#77C7C6] text-xs font-bold transition-colors shadow-xs"
                    title="Add 1 unit"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+1 {scannedItem.unit}</span>
                  </button>

                  {onOpenHistory && (
                    <button
                      onClick={() => onOpenHistory(scannedItem)}
                      className="p-1.5 rounded-xl text-stone-500 hover:text-[#10222B] hover:bg-[#F2F6F7] border border-[#D2DFE2] transition-colors"
                      title="View audit trail"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-stone-400 bg-[#F2F6F7] rounded-2xl border border-[#D2DFE2] text-xs">
              Scan a barcode or enter an item SKU to view details and make quick stock adjustments.
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
