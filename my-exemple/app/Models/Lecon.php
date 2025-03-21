<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lecon extends Model
{
    protected $fillable = [
        'formation_id', 'titre', 'contenu', 'ordre',
    ];

    protected $casts = [
        'ordre' => 'integer',
    ];

    // Relations
    public function formation()
    {
        return $this->belongsTo(Formation::class, 'formation_id');
    }
}