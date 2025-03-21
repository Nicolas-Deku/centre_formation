<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    protected $fillable = [
        'id', 'user_id', 'ip_address', 'user_agent', 'payload', 'last_activity',
    ];

    protected $casts = [
        'last_activity' => 'integer',
    ];

    public $incrementing = false; // Puisque 'id' est une chaîne
    protected $keyType = 'string';

    // Relations
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}