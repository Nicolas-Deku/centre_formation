export interface Formation {
    id: number;
    titre: string;
    description: string;
    prix: number;
    duree: number;
    image: string | null; // Correspond au champ backend
    image_url: string | null; // URL générée pour l'affichage
    categorie: string;
    formateur_id: number;
    created_at: string;
    updated_at: string;
  }