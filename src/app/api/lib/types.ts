// types.ts
export interface ApiResponse {
  events: MatchEvent[];
}

export interface MatchEvent {
  id: string;
  competitions?: Competition[];
}

export interface Competition {
  id: string;
  status?: Status;
  competitors?: Competitor[];
  details?: MatchDetail[];
}

export interface Status {
  clock: number;
  displayClock: string;
  type: StatusType;
}

export interface StatusType {
  id: string;
  name: string;
  state: string; // e.g., "pre", "in", "post"
  completed: boolean;
  description: string;
  detail: string;
  shortDetail: string;
}

export interface Competitor {
  id: string;
  type: string; // e.g., "team"
  order: number;
  homeAway: 'home' | 'away';
  score: string; // Score is returned as a string (e.g., "0", "1")
  team: Team;
}

export interface Team {
  id: string;
  abbreviation?: string; // e.g., "INT", "BAR"
  displayName: string;
  shortDisplayName?: string;
  name: string;
  logo: string;
}

export interface MatchDetail {
  clock?: Clock;
  athletesInvolved?: Athlete[];
  type?: DetailType;
}

export interface Clock {
  displayValue: string; // e.g., "45:00"
}

export interface Athlete {
  id: string;
  displayName: string;
}

export interface DetailType {
  id: string;
  description: string; // e.g., "Goal"
}