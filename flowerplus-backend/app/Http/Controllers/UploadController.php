<?php
// app/Http/Controllers/UploadController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        // Simpan ke storage/app/public/invoice-images/
        $path = $request->file('image')->store('invoice-images', 'public');

        // Generate URL publik menggunakan route khusus api/image
        $filename = basename($path);
        $url = url("/api/image/invoice-images/{$filename}");

        return response()->json([
            'success' => true,
            'url'     => $url,
        ]);
    }
}