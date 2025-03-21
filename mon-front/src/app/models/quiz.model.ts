export interface Quiz {
  id: number;
  titre: string;
  ordre: number;
  formation_id: number;
  created_at?: string;
  updated_at?: string;
}