<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Schema::table('alerts', function (Blueprint $table) {
        //    if (!Schema::hasColumn('alerts', 'child_id')) {
        //        $table->foreignId('child_id')->nullable()->after('journey_id')->constrained('users')->onDelete('cascade');
        //    }
        // });
    }

    public function down(): void
    {
        Schema::table('alerts', function (Blueprint $table) {
            $table->dropForeign(['child_id']);
            $table->dropColumn('child_id');
        });
    }
};
