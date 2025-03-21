export interface Lecon {
  id: number;
  titre: string;
  contenu: string;
  ordre: number;
  formation_id: number;
  created_at?: string;
  updated_at?: string;
}