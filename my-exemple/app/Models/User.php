<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;


    protected $fillable = [
        'name', 'email', 'password', 'role',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'role' => 'string', // enum géré comme chaîne
    ];

    // Relations
    public function formations()
    {
        return $this->hasMany(Formation::class, 'formateur_id');
    }

    public function inscriptions()
    {
        return $this->hasMany(Inscription::class, 'user_id');
    }

    public function quizAttempts()
    {
        return $this->hasMany(QuizAttempt::class, 'user_id');
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class, 'user_id');
    }

    public function certificats()
    {
        return $this->hasMany(Certificat::class, 'user_id');
    }

    public function sessions()
    {
        return $this->hasMany(Session::class, 'user_id');
    }
}