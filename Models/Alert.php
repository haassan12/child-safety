<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Alert extends Model
{
    use HasFactory;

    protected $fillable = [
        'journey_id',
        'child_id',
        'type',
        'message',
        'latitude',
        'longitude',
        'location_address',
    ];

    public function journey()
    {
        return $this->belongsTo(Journey::class);
    }

    public function child()
    {
        return $this->belongsTo(User::class, 'child_id');
    }
}
