export type Fund = 'honeymoon' | 'kiva' | 'howlin-dog';

export type Contribution = {
  id: string;
  name: string;
  email: string;
  fund: Fund;
  amount_cents: number;
  message: string | null;
  reference_url: string | null;
  lenders_choice: boolean;
  self_reported: boolean;
  stripe_session_id: string | null;
  created_at: string;
};
