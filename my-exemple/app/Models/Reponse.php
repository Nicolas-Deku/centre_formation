<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reponse extends Model
{
    protected $fillable = [
        'question_id', 'reponse', 'est_correcte',
    ];

    protected $casts = [
        'est_correcte' => 'boolean',
    ];

    // Relations
    public function question()
    {
        return $this->belongsTo(Question::class, 'question_id');
    }
}