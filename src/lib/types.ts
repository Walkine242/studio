

export interface WorkoutLog {
    id: number;
    date: string;
    title: string;
    source: string;
    duration: string;
    distance: string;
    avgPace: string;
    userId: string;
    location?: string;
}


export interface PersonalBest {
  id: string;
  stroke: string;
  distance: number;
  unit: 'meters' | 'yards';
  time: string;
  date: string;
  userId: string;
}

export interface RaceResult {
  id: string;
  date: string;
  totalTime: number;
  unit: 'meters' | 'yards';
  laps: number[];
  event: string;
  swimmerId?: string; // To associate result with a swimmer
  country?: string; // To filter by country
  meetId?: string;
  round?: string;
}

export interface AllTimeBest {
    event: string;
    totalTime: number;
    date: string;
    swimmerId: string;
    swimmerName: string;
}

export interface AllTimePoints {
    // For now, we'll use a placeholder for swimmer names.
    // In a real app, this would be a user ID or name.
    swimmer: string;
    points: number;
    races: number;
}

export interface MeetEvent {
    name: string;
    rounds: {
        name: 'Prelims' | 'Quarterfinals' | 'Semifinals' | 'Finals';
        startTime: string;
    }[];
}

export interface Meet {
    id: string;
    name:string;
    date: string;
    events: MeetEvent[];
    isChampionship?: boolean;
}

export interface Award {
    id: string;
    userId: string;
    title: string;
    meet: string;
    date: string;
    rank: number;
}

export interface UserProfile {
    name: string;
    country: string;
}

export type GoalType = 'custom' | 'personal_best' | 'leaderboard_rank' | 'meet_qualification' | 'goal_time_standard';

export interface Goal {
  id: string;
  description: string;
  targetDate: string;
  completed: boolean;
  type: GoalType;
  // Personal Best / Time Standard
  event?: string; 
  targetTime?: string;
  // Leaderboard
  league?: string; 
  targetRank?: number;
  // Meet
  meetId?: string;
  userId: string;
}


export interface UserProfileData extends UserProfile {
    id: string;
    isCurrentUser: boolean;
    isPremium: boolean;
}

export interface Notification {
    id: string;
    type: 'dual_request' | 'friend_request' | 'result_update' | 'new_follower' | 'streak_award' | 'workout_share';
    from: {
        name: string;
        avatar?: string; // URL to avatar image
    };
    content: string; // e.g., "50m Freestyle" or "finished 1st"
    timestamp: string;
    read: boolean;
    partyId?: string; // Optional: for dual requests
}

export interface Ranking {
    rank: number | 'N/A';
    points: number;
}
