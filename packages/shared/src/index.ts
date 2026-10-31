export const MATERIAL_TYPES = [
  'PET Plastic',
  'HDPE Plastic',
  'Aluminum',
  'Glass',
  'Cardboard',
  'Mixed Plastic',
  'Unknown',
] as const;

export type MaterialType = (typeof MATERIAL_TYPES)[number];

export const MATERIAL_RATES: Record<MaterialType, number> = {
  'PET Plastic': 25,
  'HDPE Plastic': 20,
  Aluminum: 50,
  Glass: 15,
  Cardboard: 10,
  'Mixed Plastic': 15,
  Unknown: 12,
};

export function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatWeight(kg: number): string {
  if (kg >= 1) return `${kg.toFixed(1)} kg`;
  return `${(kg * 1000).toFixed(0)} g`;
}
