<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    protected $fillable = [
        'quiz_id', 'question', 'type',
    ];

    protected $casts = [
        'type' => 'string', // enum géré comme chaîne
    ];

    // Relations
    public function quiz()
    {
        return $this->belongsTo(Quiz::class, 'quiz_id');
    }

    public function reponses()
    {
        return $this->hasMany(Reponse::class, 'question_id');
    }
}