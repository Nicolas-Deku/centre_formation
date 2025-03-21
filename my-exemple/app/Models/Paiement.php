<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    protected $fillable = [
        'user_id', 'formation_id', 'montant', 'statut', 'methode', 'transaction_id',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'statut' => 'string', // enum géré comme chaîne
        'methode' => 'string', // enum géré comme chaîne
    ];

    // Relations
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function formation()
    {
        return $this->belongsTo(Formation::class, 'formation_id');
    }
}