<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Journey;
use App\Models\Alert;
use App\Models\User;

class DashboardController extends Controller
{
    // Parent Dashboard
    public function parentDashboard(Request $request)
    {
        try {
            $parent = $request->user();

            $childIds = User::where('parent_id', $parent->id)->pluck('id');

            $totalChildren = $childIds->count();

            $activeJourneys = Journey::whereIn('child_id', $childIds)
                ->where('status', 'started')
                ->count();

            $completedJourneys = Journey::whereIn('child_id', $childIds)
                ->whereIn('status', ['completed', 'stopped'])
                ->count();

            // Count SOS alerts from any of the parent's children
            $sosAlerts = Alert::whereIn('child_id', $childIds)->count();
            
            // Get latest alert for polling popup
            $latestAlert = Alert::whereIn('child_id', $childIds)
                                ->join('users', 'alerts.child_id', '=', 'users.id')
                                ->select('alerts.*', 'users.name as child_name')
                                ->latest()
                                ->first();

            $children = User::where('parent_id', $parent->id)->select('id', 'name', 'email', 'created_at', 'role')->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_children' => $totalChildren,
                    'active_journeys' => $activeJourneys,
                    'completed_journeys' => $completedJourneys,
                    'sos_alerts' => $sosAlerts,
                    'children' => $children,
                    'latest_alert' => $latestAlert 
                ]
            ]);
        } catch (\Throwable $e) {
            \Log::error('ParentDashboard error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Server error'
            ], 500);
        }
    }

    // Get Child Details for Parent View
    public function getChildDetails($id)
    {
        $child = User::findOrFail($id);
        
        // Security: Ensure parent owns this child
        $user = request()->user();
        if($user->role === 'parent' && $child->parent_id !== $user->id){
             return response()->json(['message' => 'Unauthorized'], 403);
        }

        $stats = [
            'total_journeys' => Journey::where('child_id', $id)->count(),
            'active_journeys' => Journey::where('child_id', $id)->where('status', 'started')->count(),
            'completed_journeys' => Journey::where('child_id', $id)->where('status', 'completed')->count(),
            'alerts' => Alert::where('child_id', $id)->count(),
        ];

        $recentJourneys = Journey::where('child_id', $id)->latest()->take(5)->get();
        $recentAlerts = Alert::where('child_id', $id)->latest()->take(5)->get();

        return response()->json([
            'profile' => $child,
            'stats' => $stats,
            'recent_journeys' => $recentJourneys,
            'recent_alerts' => $recentAlerts
        ]);
    }

    // Child Dashboard Stats
    public function childStats(Request $request)
    {
        $child = $request->user();

        $activeJourney = Journey::where('child_id', $child->id)
            ->where('status', 'started')
            ->first();

        $stats = [
            'total_journeys' => Journey::where('child_id', $child->id)->count(),
            'completed_journeys' => Journey::where('child_id', $child->id)->where('status', 'completed')->count(),
            'alerts' => Alert::where('child_id', $child->id)->count(),
            'active_journey_status' => $activeJourney ? 'Active' : 'None',
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    public function adminDashboard()
    {
        $totalUsers = \App\Models\User::count();
        $totalChildren = \App\Models\User::where('role', 'child')->count();
        $totalJourneys = \App\Models\Journey::count();
        
        $activeJourneys = \App\Models\Journey::where('status', 'started')->count(); 
        $completedJourneys = \App\Models\Journey::whereIn('status', ['stopped', 'completed'])->count();
        
        $sosAlerts = \App\Models\Alert::count();

        // Get latest alert for polling popup
        $latestAlert = Alert::join('users', 'alerts.child_id', '=', 'users.id')
                            ->select('alerts.*', 'users.name as child_name')
                            ->latest()
                            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => $totalUsers,
                'total_children' => $totalChildren,
                'total_journeys' => $totalJourneys,
                'active_journeys' => $activeJourneys,
                'completed_journeys' => $completedJourneys,
                'sos_alerts' => $sosAlerts,
                'latest_alert' => $latestAlert
            ]
        ]);
    }

    public function adminRecentJourneys()
    {
        // Join with users to get child name
        $journeys = Journey::join('users', 'journeys.child_id', '=', 'users.id')
                    ->select('journeys.*', 'users.name as child_name')
                    ->orderBy('journeys.created_at', 'desc')
                    ->take(10)
                    ->get();
        
        return response()->json(['success' => true, 'data' => $journeys]);
    }

    public function adminRecentAlerts()
    {
        $alerts = Alert::join('users', 'alerts.child_id', '=', 'users.id')
                    ->select('alerts.*', 'users.name as child_name')
                    ->orderBy('alerts.created_at', 'desc')
                    ->take(10)
                    ->get();

        return response()->json(['success' => true, 'data' => $alerts]);
    }

    public function adminJourneyDetails($id)
    {
        $journey = Journey::join('users', 'journeys.child_id', '=', 'users.id')
                    ->select('journeys.*', 'users.name as child_name')
                    ->where('journeys.id', $id)
                    ->first();

        if (!$journey) {
            return response()->json(['success' => false, 'message' => 'Journey not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $journey]);
    }

    public function adminAlertDetails($id)
    {
        $alert = Alert::join('users', 'alerts.child_id', '=', 'users.id')
                    ->select('alerts.*', 'users.name as child_name')
                    ->where('alerts.id', $id)
                    ->first();

        if (!$alert) {
            return response()->json(['success' => false, 'message' => 'Alert not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $alert]);
    }

    // Get all children for admin dashboard
    public function adminAllChildren()
    {
        $children = \App\Models\User::where('role', 'child')
            ->withCount(['journeysAsChild as total_journeys'])
            ->with(['parent:id,name,email'])
            ->get()
            ->map(function ($child) {
                $sosCount = \App\Models\Alert::where('child_id', $child->id)->count();
                return [
                    'id' => $child->id,
                    'name' => $child->name,
                    'email' => $child->email,
                    'parent_name' => $child->parent ? $child->parent->name : 'No Parent',
                    'total_journeys' => $child->total_journeys ?? 0,
                    'sos_alerts' => $sosCount,
                    'created_at' => $child->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $children
        ]);
    }

    // Get all parents for admin dashboard
    public function adminAllParents()
    {
        $parents = \App\Models\User::where('role', 'parent')
            ->withCount(['children as total_children'])
            ->get()
            ->map(function ($parent) {
                return [
                    'id' => $parent->id,
                    'name' => $parent->name,
                    'email' => $parent->email,
                    'total_children' => $parent->total_children ?? 0,
                    'created_at' => $parent->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $parents
        ]);
    }

    // Admin delete user (child or parent)
    public function adminDeleteUser($id)
    {
        $user = \App\Models\User::find($id);
        
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        if ($user->role === 'admin') {
            return response()->json(['success' => false, 'message' => 'Cannot delete admin users'], 403);
        }

        // If parent is deleted, unlink their children (set parent_id to null)
        if ($user->role === 'parent') {
            \App\Models\User::where('parent_id', $user->id)->update(['parent_id' => null]);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }

    // Admin update journey (no parent_id restriction)
    public function adminUpdateJourney(Request $request, $id)
    {
        try {
            $request->validate([
                'start_location' => 'sometimes|required|string|max:255',
                'end_location' => 'sometimes|required|string|max:255',
                'duration_minutes' => 'sometimes|required|integer|min:1',
                'status' => 'sometimes|required|in:scheduled,started,completed,stopped',
            ]);

            $journey = Journey::find($id);

            if (!$journey) {
                return response()->json(['success' => false, 'message' => 'Journey not found'], 404);
            }

            $journey->update($request->only(['start_location', 'end_location', 'duration_minutes', 'status']));

            return response()->json([
                'success' => true,
                'message' => 'Journey updated successfully',
                'data' => $journey
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Server error', 'error' => $e->getMessage()], 500);
        }
    }


}
