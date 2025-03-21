export interface Paiement {
    id: number;
    user_id: number;
    formation_id: number;
    montant: number;
    statut: 'en_attente' | 'effectué' | 'échoué';
    methode: 'carte' | 'paypal' | 'virement';
    transaction_id: string;
    created_at: string;
    updated_at: string;
  }