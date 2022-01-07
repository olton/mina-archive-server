alter table blocks 
add column chain_status chain_status_type NOT NULL DEFAULT 'pending'::chain_status_type;

CREATE INDEX idx_blocks_state_hash ON public.blocks USING btree (state_hash);