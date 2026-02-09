// Type definitions for dashboard responses
export interface ChildDashboardResponse {
  active_journey_status: string;
  total_journeys: number;
  alerts: number;
}

export interface ParentDashboardResponse {
  total_children: number;
  active_journeys: number;
  completed_journeys: number;
  sos_alerts: number;
  children?: { id: number; name: string; email: string; role: string; created_at: string; }[];
  latest_alert?: any;
}
