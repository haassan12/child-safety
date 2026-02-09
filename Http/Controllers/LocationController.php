<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Journey;
use App\Models\Location;

class LocationController extends Controller
{
    public function store(Request $request)
    {
        // 1️⃣ Validate input
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        // 2️⃣ Get logged-in child
        $child = $request->user();

        // 3️⃣ Find active journey for this child
        $journey = Journey::where('child_id', $child->id)
            ->where('status', 'started')
            ->latest()
            ->first();

        if (!$journey) {
            return response()->json([
                'message' => 'No active journey found'
            ], 404);
        }

        // 4️⃣ Save location
        $location = Location::create([
            'journey_id' => $journey->id,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'recorded_at' => now(),
        ]);

        return response()->json([
            'message' => 'Location saved',
            'location' => $location
        ]);
    }
}
