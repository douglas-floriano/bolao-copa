<?php

use App\Models\AuditLog;

if (!function_exists('audit')) {
    function audit(string $action, $subject = null, array $changes = []): void
    {
        \DB::table('audit_logs')->insert([
            'user_id' => auth()->id(),
            'action' => $action,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject?->id,
            'changes' => json_encode($changes),
            'ip' => request()?->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
