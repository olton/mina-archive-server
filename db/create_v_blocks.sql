CREATE OR REPLACE VIEW public.v_blocks
AS SELECT bs.id,
    bs.height,
    floor((bs.global_slot / 7140)::double precision) AS epoch,
    bs.global_slot::double precision - floor((bs.global_slot / 7140)::double precision) * 7140::double precision AS slot,
    bs.global_slot,
    pk.value AS creator_key,
    bs.creator_id, 
    pk2.value AS winner_key,
    bs.block_winner_id as winner_id, 
    to_char(to_timestamp((bs."timestamp" / 1000)::double precision), 'DD/MM/YYYY HH24:MI:SS'::text) AS block_time,
    ( SELECT sum(ic2.fee) AS sum
           FROM internal_commands ic2
             LEFT JOIN blocks_internal_commands bic2 ON bic2.internal_command_id = ic2.id
          WHERE bic2.block_id = bs.id AND ic2.type = 'coinbase'::internal_command_type) AS coinbase,
    ( SELECT sum(ic3.fee) AS sum
           FROM internal_commands ic3
             LEFT JOIN blocks_internal_commands bic3 ON bic3.internal_command_id = ic3.id
          WHERE bic3.block_id = bs.id AND ic3.type = 'fee_transfer'::internal_command_type) AS fee_transfer,
    ( SELECT count(buc.block_id) AS count
           FROM blocks_user_commands buc
          WHERE buc.block_id = bs.id AND buc.status = 'applied'::user_command_status) AS tr_applied,
    ( SELECT count(buc.block_id) AS count
           FROM blocks_user_commands buc
          WHERE buc.block_id = bs.id AND buc.status = 'failed'::user_command_status) AS tr_failed,
    bs.state_hash,
    bs.chain_status
   FROM blocks bs
     LEFT JOIN public_keys pk ON bs.creator_id = pk.id
     LEFT JOIN public_keys pk2 ON bs.block_winner_id = pk2.id
  ORDER BY bs.height DESC;