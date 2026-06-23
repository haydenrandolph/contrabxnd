-- Agent registry: service discovery + credit system

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  description text,
  endpoint text,
  capabilities jsonb not null default '[]',
  pricing_model text not null default 'free',
  pricing_detail jsonb,
  pubkey text,
  verified boolean not null default false,
  featured boolean not null default false,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_agents_status on agents (status);
create index if not exists idx_agents_capabilities on agents using gin (capabilities);
create index if not exists idx_agents_owner on agents (owner_id);

-- Agent predictions for credit system

create table if not exists agent_predictions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  prediction_hash text not null,
  prediction_text text not null,
  confidence real not null check (confidence >= 0 and confidence <= 1),
  category text not null default 'general',
  target_date timestamptz not null,
  submitted_at timestamptz default now(),
  resolved_at timestamptz,
  outcome text check (outcome in ('correct', 'incorrect', 'expired', 'pending')),
  resolution_note text
);

create index if not exists idx_predictions_agent on agent_predictions (agent_id);
create index if not exists idx_predictions_outcome on agent_predictions (outcome);
create index if not exists idx_predictions_target on agent_predictions (target_date);
create index if not exists idx_predictions_hash on agent_predictions (prediction_hash);

-- Credit scores (materialized, recomputed periodically)

create table if not exists agent_credit_scores (
  agent_id uuid primary key references agents(id) on delete cascade,
  accuracy real,
  volume integer not null default 0,
  consistency real,
  calibration real,
  age_days integer not null default 0,
  composite_score real,
  total_predictions integer not null default 0,
  correct_predictions integer not null default 0,
  updated_at timestamptz default now()
);

-- RLS

alter table agents enable row level security;
alter table agent_predictions enable row level security;
alter table agent_credit_scores enable row level security;

-- Public read for discovery
create policy "Anyone can read active agents" on agents
  for select using (status = 'active');

create policy "Owners can manage own agents" on agents
  for all using (auth.uid() = owner_id);

create policy "Service role full access agents" on agents
  for all using (true);

-- Predictions: public read, agent owner can insert
create policy "Anyone can read predictions" on agent_predictions
  for select using (true);

create policy "Service role full access predictions" on agent_predictions
  for all using (true);

-- Credit scores: public read
create policy "Anyone can read credit scores" on agent_credit_scores
  for select using (true);

create policy "Service role full access credit" on agent_credit_scores
  for all using (true);
