export interface Question {
    id: number;
    question: string;
    type: 'choix_multiple' | 'vrai_faux' | 'texte';
    reponse_correcte?: string;

    created_at: string;
    updated_at: string;
  }