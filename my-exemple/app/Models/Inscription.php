<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inscription extends Model
{
    protected $fillable = [
        'user_id', 'formation_id', 'statut', 'is_paid', 'score', 'has_passed_quiz', 'certified',
    ];

    protected $casts = [
        'statut' => 'string', // enum géré comme chaîne
        'is_paid' => 'boolean',
        'score' => 'decimal:2',
        'has_passed_quiz' => 'boolean',
        'certified' => 'boolean',
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