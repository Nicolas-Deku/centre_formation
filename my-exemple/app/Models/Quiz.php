<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{

    protected $table = 'quiz';
    protected $fillable = [
        'formation_id', 'titre', 'ordre',
    ];

    protected $casts = [
        'ordre' => 'integer',
    ];

    // Relations
    public function formation()
    {
        return $this->belongsTo(Formation::class, 'formation_id');
    }

    public function questions()
    {
        return $this->hasMany(Question::class, 'quiz_id');
    }

    public function quizAttempts()
    {
        return $this->hasMany(QuizAttempt::class, 'quiz_id');
    }
}