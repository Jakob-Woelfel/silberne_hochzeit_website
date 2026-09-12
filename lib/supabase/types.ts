export type Guest = {
  id: string;
  name: string;
  team_id: number | null;
  seq: number;
  created_at: string;
};

export type Answer = {
  guest_id: string;
  task_id: string;
  value: unknown;
  points: number;
  answered_at: string;
};

export type Upload = {
  id: string;
  guest_id: string;
  task_id: string;
  storage_path: string;
  created_at: string;
};

export type SessionRow = {
  id: number;
  phase: 'idle' | 'lobby' | 'question' | 'reveal' | 'ended';
  question_id: string | null;
  started_at: string | null;
  parents_answer: unknown;
  updated_at: string;
};

export type TeamBonus = {
  team_id: number;
  points: number;
  note: string | null;
  updated_at: string;
};

export type SoloRankingRow = {
  id: string;
  name: string;
  team_id: number | null;
  points: number;
  rank: number;
};

export type TeamRankingRow = {
  id: number;
  name: string;
  color: string;
  points: number;
  members: number;
};

/** Minimales Schema für den typisierten Supabase-Client. */
type Table<Row, Insert = Row, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type View<Row> = { Row: Row; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      teams: Table<{ id: number; name: string; color: string }>;
      guests: Table<Guest, { name: string; team_id?: number | null }>;
      answers: Table<
        Answer,
        { guest_id: string; task_id: string; value: unknown; points: number }
      >;
      uploads: Table<
        Upload,
        { guest_id: string; task_id: string; storage_path: string }
      >;
      session: Table<SessionRow, Partial<SessionRow> & { id: number }>;
      team_bonus: Table<TeamBonus, { team_id: number; points: number; note?: string | null; updated_at?: string }>;
    };
    Views: {
      solo_ranking: View<SoloRankingRow>;
      team_ranking: View<TeamRankingRow>;
    };
    Functions: {
      create_guest: {
        Args: { p_name: string };
        Returns: Guest;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
