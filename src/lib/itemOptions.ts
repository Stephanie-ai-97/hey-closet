export const RATING_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);

export const SIZE_OPTION_GROUPS = [
  {
    label: 'Alpha clothing',
    options: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  },
  {
    label: 'Australia clothing / dress',
    options: ['AU 4', 'AU 6', 'AU 8', 'AU 10', 'AU 12', 'AU 14', 'AU 16', 'AU 18', 'AU 20', 'AU 22', 'AU 24', 'AU 26'],
  },
  {
    label: 'US clothing / dress',
    options: ['US 0', 'US 2', 'US 4', 'US 6', 'US 8', 'US 10', 'US 12', 'US 14', 'US 16', 'US 18', 'US 20', 'US 22'],
  },
  {
    label: 'UK clothing / dress',
    options: ['UK 4', 'UK 6', 'UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16', 'UK 18', 'UK 20', 'UK 22', 'UK 24', 'UK 26'],
  },
  {
    label: 'Numeric clothing / dress',
    options: ['4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24', '26'],
  },
  {
    label: 'Bra sizes',
    options: [
      '30A', '30B', '30C', '30D', '30DD',
      '32A', '32B', '32C', '32D', '32DD',
      '34A', '34B', '34C', '34D', '34DD',
      '36A', '36B', '36C', '36D', '36DD',
      '38A', '38B', '38C', '38D', '38DD',
      '40A', '40B', '40C', '40D', '40DD',
    ],
  },
  {
    label: 'Length / fit',
    options: ['Short', 'Regular', 'Medium', 'Long', 'Tall', 'Petite', 'One Size'],
  },
] as const;

export const SIZE_OPTIONS = SIZE_OPTION_GROUPS.flatMap((group) => group.options);
