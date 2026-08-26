export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const calculateValuation = (quantity: number, unitCost: number): number => {
  return Number((quantity * unitCost).toFixed(2));
};

export const calculateGrossMargin = (cost: number, price: number): number => {
  if (!price || price === 0) return 0;
  return Number((((price - cost) / price) * 100).toFixed(1));
};

export const formatStockNumber = (num: number, unit: string): string => {
  const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(1);
  return `${formatted} ${unit}`;
};
