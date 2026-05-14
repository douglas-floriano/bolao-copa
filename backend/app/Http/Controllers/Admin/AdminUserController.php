<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $r)
    {
        return User::query()
            ->when($r->search, fn ($q) => $q->where(function ($w) use ($r) {
                $w->where('name', 'ilike', "%{$r->search}%")->orWhere('email', 'ilike', "%{$r->search}%");
            }))
            ->orderByDesc('id')
            ->paginate(50);
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'name' => 'required|string|max:120',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'is_admin' => 'boolean',
        ]);
        $user = User::create($data);
        audit('user.create', $user, ['email' => $user->email, 'is_admin' => $user->is_admin]);
        return response()->json($user, 201);
    }

    public function update(Request $r, User $user)
    {
        $data = $r->validate([
            'name' => 'sometimes|string|max:120',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8',
            'is_admin' => 'sometimes|boolean',
        ]);
        $user->update($data);
        audit('user.update', $user, $data);
        return $user;
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Não pode excluir a si mesmo.'], 422);
        }
        $user->delete();
        audit('user.delete', $user);
        return response()->noContent();
    }
}
