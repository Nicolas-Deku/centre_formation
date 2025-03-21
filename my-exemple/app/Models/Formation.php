<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Formation extends Model
{
    protected $fillable = [
        'titre', 'description', 'image', 'formateur_id', 'categorie_id', 'prix', 'duree',
        'quiz_demarre', 'quiz_duration', 'quiz_end_time', 'quiz_started_at',
    ];

    protected $casts = [
        'prix' => 'decimal:2',
        'quiz_demarre' => 'boolean',
        'quiz_duration' => 'integer',
        'quiz_end_time' => 'datetime',
        'quiz_started_at' => 'datetime',
    ];

    // Relations
    public function formateur()
    {
        return $this->belongsTo(User::class, 'formateur_id');
    }

    public function categorie()
    {
        return $this->belongsTo(Categorie::class, 'categorie_id');
    }

    public function inscriptions()
    {
        return $this->hasMany(Inscription::class, 'formation_id');
    }

    public function lecons()
    {
        return $this->hasMany(Lecon::class, 'formation_id');
    }

    public function quiz()
    {
        return $this->hasMany(Quiz::class, 'formation_id');
    }

    public function quizAttempts()
    {
        return $this->hasMany(QuizAttempt::class, 'formation_id');
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class, 'formation_id');
    }

    public function certificats()
    {
        return $this->hasMany(Certificat::class, 'formation_id');
    }

    public function getImageUrlAttribute()
    {
        return $this->image ? url('storage/' . $this->image) : null;
    }
}