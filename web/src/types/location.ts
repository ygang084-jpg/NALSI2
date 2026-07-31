export type LocationValue =
  | { type: 'coords'; lat: number; lon: number }
  | { type: 'query'; query: string }
