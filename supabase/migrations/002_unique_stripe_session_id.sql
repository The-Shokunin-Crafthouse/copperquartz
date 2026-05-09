alter table contributions
  add constraint contributions_stripe_session_id_key
  unique (stripe_session_id);
