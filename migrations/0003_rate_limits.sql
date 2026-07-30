create table rate_limits (
  user_id text not null references "user" ("id") on delete cascade,
  action text not null,
  created_at integer not null
);

create index rate_limits_user_action_idx on rate_limits (user_id, action, created_at);
