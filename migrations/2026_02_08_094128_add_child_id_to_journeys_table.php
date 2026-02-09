<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Schema::table('journeys', function (Blueprint $table) {
        //     $table->unsignedBigInteger('child_id')->nullable()->after('parent_id');
        //     $table->foreign('child_id')->references('id')->on('users')->onDelete('cascade');
        // });
    }

    public function down()
    {
        Schema::table('journeys', function (Blueprint $table) {
            $table->dropForeign(['child_id']);
            $table->dropColumn('child_id');
        });
    }

};
