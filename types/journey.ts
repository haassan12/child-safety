export interface Journey {
  id: number;
  child_id: number;
  parent_id: number;
  start_location: string;
  end_location: string;
  status: "started" | "stopped" | "active" | "completed" | "scheduled";
  started_at: string;
  ended_at?: string | null;
  document_path?: string | null;
  child?: { name: string }; // child object with name
  duration_minutes?: number;
}
