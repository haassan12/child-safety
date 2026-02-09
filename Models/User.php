<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'parent_id'
    ];

    // Relationship: Child belongs to a Parent
    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    // Relationship: Parent has many children
    public function children()
    {
        return $this->hasMany(User::class, 'parent_id');
    }

    // Relationship: Child's journeys
    public function journeysAsChild()
    {
        return $this->hasMany(\App\Models\Journey::class, 'child_id');
    }
}