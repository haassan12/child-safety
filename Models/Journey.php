<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Journey extends Model
{
    use HasFactory;

    protected $fillable = [
        'child_id',
        'parent_id',
        'start_location',
        'end_location',
        'status',
        'started_at',
        'ended_at',
        'expected_end_time',
        'duration_minutes',
    ];

    public function child()
    {
        return $this->belongsTo(User::class, 'child_id');
    }



    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }


    public function alerts()
    {
        return $this->hasMany(Alert::class);
    }

}
