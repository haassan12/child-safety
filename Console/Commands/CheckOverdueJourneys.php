<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckOverdueJourneys extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'journeys:check-overdue';
    protected $description = 'Check for active journeys that have passed their expected end time and trigger SOS.';

    public function handle()
    {
        $overdueJourneys = \App\Models\Journey::where('status', 'started')
            ->whereNotNull('expected_end_time')
            ->where('expected_end_time', '<', now())
            ->get();

        $count = 0;
        foreach ($overdueJourneys as $journey) {
            // Check if we already sent an overdue alert for this specific journey
            $alreadyAlerted = \App\Models\Alert::where('journey_id', $journey->id)
                ->where('type', 'sos')
                ->where('message', 'LIKE', '%Overdue%')
                ->exists();

            if (!$alreadyAlerted) {
                \App\Models\Alert::create([
                    'journey_id' => $journey->id,
                    'child_id' => $journey->child_id,
                    'type' => 'sos',
                    'message' => 'SOS: Journey Overdue! Child did not complete the journey on time.',
                ]);
                $count++;
            }
        }

        $this->info("Checked journeys. Triggered $count new SOS alerts.");
    }
}
