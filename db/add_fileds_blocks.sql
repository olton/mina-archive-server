alter table blocks 
add column chain_status chain_status_type NOT NULL DEFAULT 'pending'::chain_status_type;

create index idx_blocks_chain_status
    on blocks (chain_status);
