<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Journey;
use App\Models\Alert;
use Illuminate\Support\Facades\Storage;

class JourneyController extends Controller
{
    // Child starts a journey
    public function start(Request $request)
    {
        try {
            // Updated validation to allow starting a SPECIFIC journey
            $request->validate([
                'journey_id' => 'nullable|exists:journeys,id', 
                'start_location' => 'required_without:journey_id|string|max:255',
                'end_location'   => 'required_without:journey_id|string|max:255',
            ]);

            $child = $request->user();
            if ($child->role !== 'child') {
                return response()->json(['message' => 'Only children can start journeys'], 403);
            }

            // Check if active journey exists
            $active = Journey::where('child_id', $child->id)->where('status', 'started')->first();
            if ($active) {
                return response()->json(['message' => 'You already have an active journey'], 400);
            }

            if ($request->journey_id) {
                // Start Existing Scheduled Journey
                $journey = Journey::where('id', $request->journey_id)
                            ->where('child_id', $child->id)
                            ->first();

                if (!$journey) return response()->json(['message' => 'Journey not found'], 404);

                // Update status to started
                // Update status to started and set expected end time
                $updateData = [
                    'status' => 'started',
                    'started_at' => now(),
                ];

                if ($journey->duration_minutes) {
                    $updateData['expected_end_time'] = now()->addMinutes($journey->duration_minutes);
                }

                $journey->update($updateData);
            } else {
                // Start New Journey (Ad-hoc)
                if (!$child->parent_id) {
                    return response()->json(['message' => 'Account not linked'], 400);
                }
                $journey = Journey::create([
                    'child_id' => $child->id,
                    'parent_id' => $child->parent_id,
                    'start_location' => $request->start_location,
                    'end_location'   => $request->end_location,
                    'status' => 'started',
                    'started_at' => now(),
                ]);
            }

            return response()->json([
                'message' => 'Journey started successfully',
                'journey' => $journey
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message'=>'Server error','error'=>$e->getMessage()], 500);
        }
    }

    // Get Child's Own Journeys
    public function childJourneys(Request $request)
    {
        try {
            $child = $request->user();
            $journeys = Journey::where('child_id', $child->id)
                ->whereIn('status', ['started', 'active', 'scheduled', 'completed', 'stopped'])
                ->orderBy('created_at', 'desc') // Show newest created (scheduled) first
                ->get();

            return response()->json([
                'success' => true,
                'data' => $journeys
            ]);

        } catch (\Exception $e) {
            return response()->json(['message'=>'Server error','error'=>$e->getMessage()], 500);
        }
    }

    // Child stops active journey
    public function stop()
    {
        try {
            $child = auth()->user();

            $journey = Journey::where('child_id', $child->id)
                ->where('status', 'started')
                ->latest()
                ->first();

            if (!$journey) {
                return response()->json(['message' => 'No active journey found'], 404);
            }

            $journey->update([
                'status' => 'stopped',
                'ended_at' => now()
            ]);

            return response()->json([
                'message' => 'Journey stopped successfully',
                'journey' => $journey
            ]);

        } catch (\Exception $e) {
            return response()->json(['message'=>'Server error','error'=>$e->getMessage()],500);
        }
    }

    // Parent views child journeys
    public function parentJourneys(Request $request)
    {
        try {
            $parentId = $request->user()->id;
            $query = Journey::where('parent_id', $parentId);

            if ($request->has('status') && $request->status !== 'all' && $request->status !== '') {
            $query->where('status', $request->status);
        }

            if ($request->has('child_id')) {
                $query->where('child_id', $request->child_id);
            }

            if ($request->has('search')) {
                $searchTerm = $request->search;
                $query->whereHas('child', function($q) use ($searchTerm) {
                    $q->where('name', 'like', "%{$searchTerm}%");
                });
            }

            $journeys = $query->with(['child' => function($q){
                $q->select('id','name','email');
            }])->orderBy('started_at','desc')
              ->paginate(10);

            return response()->json([
                'success' => true,
                'data' => $journeys->items(),
                'pagination' => [
                    'current_page' => $journeys->currentPage(),
                    'last_page'    => $journeys->lastPage(),
                    'per_page'     => $journeys->perPage(),
                    'total'        => $journeys->total(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json(['success'=>false,'message'=>'Server error','error'=>$e->getMessage()],500);
        }
    }

    // Child triggers SOS with location
    public function sos(Request $request)
    {
        try {
            $request->validate([
                'message' => 'nullable|string|max:255',
                'latitude' => 'nullable|numeric',
                'longitude' => 'nullable|numeric',
                'location_address' => 'nullable|string|max:500',
            ]);

            $child = $request->user();

            // Find active journey if exists (optional)
            $journey = Journey::where('child_id', $child->id)
                ->where('status','started')
                ->latest()
                ->first();

            $defaultMessages = [
                'SOS! I need help immediately!',
                'I am in danger, please assist!',
                'Emergency! Child is in trouble!',
                'Help! I am unsafe!',
                'Alert! Child needs urgent help!'
            ];

            // Sample locations (Indian cities) for demo if no location provided
            $sampleLocations = [
                ['lat' => 28.6139, 'lng' => 77.2090, 'address' => 'New Delhi, India'],
                ['lat' => 19.0760, 'lng' => 72.8777, 'address' => 'Mumbai, Maharashtra'],
                ['lat' => 12.9716, 'lng' => 77.5946, 'address' => 'Bangalore, Karnataka'],
                ['lat' => 13.0827, 'lng' => 80.2707, 'address' => 'Chennai, Tamil Nadu'],
                ['lat' => 22.5726, 'lng' => 88.3639, 'address' => 'Kolkata, West Bengal'],
                ['lat' => 17.3850, 'lng' => 78.4867, 'address' => 'Hyderabad, Telangana'],
                ['lat' => 23.0225, 'lng' => 72.5714, 'address' => 'Ahmedabad, Gujarat'],
                ['lat' => 26.9124, 'lng' => 75.7873, 'address' => 'Jaipur, Rajasthan'],
                ['lat' => 18.5204, 'lng' => 73.8567, 'address' => 'Pune, Maharashtra'],
                ['lat' => 11.0168, 'lng' => 76.9558, 'address' => 'Coimbatore, Tamil Nadu'],
            ];

            // Use provided location or pick random sample location
            if ($request->latitude && $request->longitude) {
                $latitude = $request->latitude;
                $longitude = $request->longitude;
                $locationAddress = $request->location_address ?? 'Location captured';
            } else {
                // Pick random sample location for demo
                $random = $sampleLocations[array_rand($sampleLocations)];
                $latitude = $random['lat'];
                $longitude = $random['lng'];
                $locationAddress = $random['address'];
            }

            $alert = Alert::create([
                'journey_id' => $journey ? $journey->id : null,
                'child_id' => $child->id,
                'type' => 'sos',
                'message' => $request->message ?? $defaultMessages[array_rand($defaultMessages)],
                'latitude' => $latitude,
                'longitude' => $longitude,
                'location_address' => $locationAddress,
            ]);

            return response()->json([
                'message'=>'SOS alert sent',
                'alert'=>$alert
            ]);

        } catch (\Exception $e) {
            return response()->json(['message'=>'Server error','error'=>$e->getMessage()],500);
        }
    }

    // Parent updates journey details
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'start_location' => 'sometimes|required|string|max:255',
                'end_location' => 'sometimes|required|string|max:255',
                'duration_minutes' => 'sometimes|required|integer|min:1',
            ]);

            $parent = $request->user();
            $journey = Journey::where('id', $id)
                              ->where('parent_id', $parent->id)
                              ->first();

            if (!$journey) {
                return response()->json(['message' => 'Journey not found'], 404);
            }

            // Only allow editing scheduled journeys
            if ($journey->status !== 'scheduled') {
                return response()->json(['message' => 'Only scheduled journeys can be edited'], 400);
            }

            $journey->update($request->only(['start_location', 'end_location', 'duration_minutes']));

            return response()->json([
                'success' => true,
                'message' => 'Journey updated successfully',
                'journey' => $journey
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Server error', 'error' => $e->getMessage()], 500);
        }
    }


    public function uploadDocument(Request $request, $journeyId)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $journey = \App\Models\Journey::findOrFail($journeyId);

        $file = $request->file('file');
        $filename = time().'_'.$file->getClientOriginalName();
        $path = $file->storeAs('journey_documents', $filename, 'public');

        $journey->document_path = $path;
        $journey->save();

        return response()->json([
            'message' => 'File uploaded successfully',
            'file_path' => $path
        ]);
    }

    public function startJourney(Request $request)
    {
        $request->validate([
            'child_id' => 'required|exists:users,id',
            'start_location' => 'required|string|max:255',
        ]);

        $journey = \App\Models\Journey::create([
            'child_id' => $request->child_id,
            'parent_id' => auth()->user()->id,
            'status' => 'active',
            'start_location' => $request->start_location,
        ]);

        return response()->json([
            'message' => 'Journey started',
            'journey' => $journey
        ]);
    }

    // Delete a journey (CRUD: Delete)
    public function destroy($id)
    {
        try {
            $user = auth()->user();
            $journey = Journey::findOrFail($id);

            // Authorization: Only allow if parent owns it or child owns it
            if ($user->role === 'parent' && $journey->parent_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            if ($user->role === 'child' && $journey->child_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Optional: Delete associated files if any
            if ($journey->document_path) {
                Storage::disk('public')->delete($journey->document_path);
            }

            $journey->delete();

            return response()->json([
                'success' => true,
                'message' => 'Journey deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json(['message'=>'Server error','error'=>$e->getMessage()], 500);
        }
    }

    // Parent creates a scheduled journey
    public function store(Request $request) 
    {
        try {
            $request->validate([
                'child_id' => 'required|exists:users,id',
                'start_location' => 'required|string|max:255',
                'end_location' => 'required|string|max:255',
                'duration_minutes' => 'required|integer|min:1',
            ]);

            $parent = $request->user();
            if ($parent->role !== 'parent') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Verify child belongs to parent
            $child = \App\Models\User::where('id', $request->child_id)
                        ->where('parent_id', $parent->id)
                        ->first();
            
            if (!$child) {
                return response()->json(['message' => 'Child not found or unauthorized'], 403);
            }

            // Calculate expected end time based on duration
            $journey = Journey::create([
                'child_id' => $child->id,
                'parent_id' => $parent->id,
                'start_location' => $request->start_location,
                'end_location' => $request->end_location,
                'status' => 'scheduled',
                'duration_minutes' => $request->duration_minutes,
                // expected_end_time will be set when child starts the journey
            ]);

            return response()->json([
                'message' => 'Journey scheduled successfully',
                'journey' => $journey
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message'=>'Server error','error'=>$e->getMessage()], 500);
        }
    }
}
