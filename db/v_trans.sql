create view v_trans
            (id, type, source_id, source_key, receiver_id, receiver_key, fee_payer_id, fee_payer_key, nonce, amount,
             fee, memo, hash, status, failure_reason, sequence_no, block_id, block_chain_status, block_time, height,
             confirmation)
as
SELECT t.id,
       t.type,
       t.source_id,
       pk1.value                  AS source_key,
       t.receiver_id,
       pk2.value                  AS receiver_key,
       t.fee_payer_id,
       pk3.value                  AS fee_payer_key,
       t.nonce,
       t.amount,
       t.fee,
       t.memo,
       t.hash,
       buc.status,
       buc.failure_reason,
       buc.sequence_no,
       b.id                       AS block_id,
       b.chain_status             AS block_chain_status,
       b."timestamp"              AS block_time,
       b.height,
       ((SELECT max(blocks.height) AS max
         FROM blocks)) - b.height AS confirmation
FROM user_commands t
         LEFT JOIN blocks_user_commands buc ON t.id = buc.user_command_id
         LEFT JOIN v_blocks b ON buc.block_id = b.id
         LEFT JOIN public_keys pk1 ON t.source_id = pk1.id
         LEFT JOIN public_keys pk2 ON t.receiver_id = pk2.id
         LEFT JOIN public_keys pk3 ON t.fee_payer_id = pk3.id
WHERE b.chain_status = 'canonical'::chain_status_type
ORDER BY b.height DESC;

alter table v_trans
    owner to mina;

