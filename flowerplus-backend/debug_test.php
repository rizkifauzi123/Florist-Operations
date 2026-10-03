<?php
echo "=== Testing Forgot Password & Login ===\n\n";

// Include autoload
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

// Get all users
echo "=== ALL USERS IN DATABASE ===\n";
$users = User::all();
foreach ($users as $user) {
    echo "ID: {$user->id}, Email: {$user->email}, Name: {$user->name}, Role: {$user->role}\n";
}

echo "\n=== TESTING PASSWORD HASH ===\n";
$testEmail = 'rizkiahmadfauzi1215@gmail.com';
$testPassword = 'uji123';

$user = User::where('email', $testEmail)->first();
if ($user) {
    echo "User found: {$user->name}\n";
    echo "Password hash check (uji123): " . (Hash::check($testPassword, $user->password) ? 'MATCH ✓' : 'NO MATCH ✗') . "\n";
} else {
    echo "User NOT found with email: $testEmail\n";
}

echo "\n=== CHECKING PASSWORD RESET TOKENS ===\n";
$tokens = DB::table('password_reset_tokens')->get();
if ($tokens->count() > 0) {
    foreach ($tokens as $token) {
        echo "Email: {$token->email}, Token exists: " . (strlen($token->token) > 20 ? 'YES' : 'NO') . "\n";
    }
} else {
    echo "No tokens found\n";
}

echo "\n=== ALL DATABASE USERS ===\n";
$allUsers = DB::table('users')->get();
foreach ($allUsers as $u) {
    echo "{$u->id}. {$u->email} ({$u->name})\n";
}
?>
