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
        Schema::create('journeys', function (Blueprint $table) {
            $table->id();

            // Child who started the journey
            $table->foreignId('child_id')->constrained('users')->onDelete('cascade');

            // Parent of that child
            $table->foreignId('parent_id')->constrained('users')->onDelete('cascade');

            // Journey locations
            $table->string('start_location');
            $table->string('end_location');

            // Journey status
            $table->enum('status', ['started', 'stopped'])->default('started');

            // Time tracking
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();

            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journeys');
    }
};
