<?php

namespace App\Http\Controllers;

use App\Models\User; // ✅ required
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash; // ✅ required



class AuthController extends Controller
{
//register function
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|min:8',
            'role'     => 'required|in:admin,parent,child',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user'    => $user,
            'token'   => $token,
        ], 201);
    }


    //login function
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user'    => $user,
            'token'   => $token
        ]);
    }
    // Parent adds a child
    public function addChild(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|min:6',
        ]);

        $parent = $request->user();

        $child = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'child',
            'parent_id' => $parent->id,
        ]);

        return response()->json([
            'message' => 'Child account created successfully',
            'child'    => $child
        ], 201);
    }

    // Link existing child by email
    public function linkChild(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $parent = $request->user();
        $child = User::where('email', $request->email)->where('role', 'child')->first();

        if (!$child) {
            return response()->json(['message' => 'Child account not found or is not a child role'], 404);
        }

        if ($child->parent_id && $child->parent_id !== $parent->id) {
            return response()->json(['message' => 'Child is already linked to another parent'], 400);
        }

        $child->parent_id = $parent->id;
        $child->save();

        return response()->json([
            'message' => 'Child linked successfully',
            'child' => $child
        ]);
    }

    // Update child details
    public function updateChild(Request $request, $id)
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email',
        ]);

        $parent = $request->user();
        $child = User::where('id', $id)
                      ->where('parent_id', $parent->id)
                      ->where('role', 'child')
                      ->first();

        if (!$child) {
            return response()->json(['message' => 'Child not found or not linked to you'], 404);
        }

        // Check email uniqueness if changing
        if ($request->has('email') && $request->email !== $child->email) {
            $exists = User::where('email', $request->email)->where('id', '!=', $id)->exists();
            if ($exists) {
                return response()->json(['message' => 'Email already in use'], 400);
            }
        }

        $child->update($request->only(['name', 'email']));

        return response()->json([
            'success' => true,
            'message' => 'Child updated successfully',
            'child' => $child
        ]);
    }

    // Unlink (remove) child from parent
    public function unlinkChild(Request $request, $id)
    {
        $parent = $request->user();
        $child = User::where('id', $id)
                      ->where('parent_id', $parent->id)
                      ->where('role', 'child')
                      ->first();

        if (!$child) {
            return response()->json(['message' => 'Child not found or not linked to you'], 404);
        }

        // Unlink the child (set parent_id to null)
        $child->parent_id = null;
        $child->save();

        return response()->json([
            'success' => true,
            'message' => 'Child unlinked successfully'
        ]);
    }

    // Update Own Profile
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'password' => 'nullable|min:6|confirmed',
        ]);

        $user->name = $request->name;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }
}