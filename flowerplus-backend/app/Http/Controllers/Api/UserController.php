<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /* ============================
       GET USER BY ID
    ============================ */
    public function show($id)
    {
        $user = User::findOrFail($id);

        return response()->json([
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => $user->role,
            'avatar'     => $user->avatar,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ]);
    }

    /* ============================
       UPDATE PROFILE (name, email, avatar)
    ============================ */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Update name
        if ($request->has('name')) {
            $user->name = $request->name;
        }

        // Update email
        if ($request->has('email')) {
            $user->email = $request->email;
        }

        // Update role
        if ($request->has('role')) {
            $user->role = $request->role;
        }

        // Update avatar (file upload)
        if ($request->hasFile('avatar')) {
            // Hapus avatar lama jika ada
            if ($user->avatar) {
                $pathOnly = parse_url($user->avatar, PHP_URL_PATH);
                $oldPath = str_replace(['/storage/', '/api/image/'], '', $pathOnly);
                \Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('avatar')->store('avatars', 'public');
            $filename = basename($path);
            $user->avatar = url("/api/image/avatars/{$filename}");
        }

        // Hapus avatar (set null)
        if ($request->has('remove_avatar') && $request->remove_avatar == true) {
            if ($user->avatar) {
                $pathOnly = parse_url($user->avatar, PHP_URL_PATH);
                $oldPath = str_replace(['/storage/', '/api/image/'], '', $pathOnly);
                \Storage::disk('public')->delete($oldPath);
            }
            $user->avatar = null;
        }

        // Update password jika dikirim
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated',
            'data'    => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'role'       => $user->role,
                'avatar'     => $user->avatar,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
        ]);
    }

    public function login(Request $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah'
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'token' => $token,
            'data'    => [
                'id'     => $user->id,
                'name'   => $user->name,
                'email'  => $user->email,
                'role'   => $user->role,
                'avatar' => $user->avatar,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]
        ]);
    }

    /* ============================
       GET ALL USERS
    ============================ */
    public function index()
    {
        $users = User::select('id', 'name', 'email', 'role', 'avatar', 'created_at')->get();

        return response()->json($users);
    }
}