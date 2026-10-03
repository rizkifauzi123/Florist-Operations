<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// Check if user exists
$user = DB::table('users')->where('email', 'rizkiahmadfauzi1215@gmail.com')->first();
echo "User check: ";
echo $user ? json_encode($user) : "NOT FOUND";
echo "\n";

// Check password_reset_tokens table
$tokens = DB::table('password_reset_tokens')->where('email', 'rizkiahmadfauzi1215@gmail.com')->first();
echo "Token check: ";
echo $tokens ? json_encode($tokens) : "NO TOKENS YET";
echo "\n";
