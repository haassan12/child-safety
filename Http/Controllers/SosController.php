<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SosController extends Controller
{
    public function store(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'message' => 'SOS received successfully',
            'data' => $request->all()
        ]);
    }
}
