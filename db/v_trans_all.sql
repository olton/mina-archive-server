create view v_trans_all
            (id, type, nonce, amount, fee, memo, hash, sequence_no, status, failure_reason, block_id, block_parent_id,
             state_hash, height, global_slot, slot, epoch, timestamp, chain_status, block_creator_id, block_creator,
             block_winner_id, block_winner, trans_owner_id, trans_owner, trans_receiver_id, trans_receiver,
             trans_fee_payer_id, trans_fee_payer)
as
SELECT uc.id,
       uc.type,
       uc.nonce,
       COALESCE(uc.amount, 0::bigint)                                                                             AS amount,
       uc.fee,
       uc.memo,
       uc.hash,
       buc.sequence_no,
       buc.status,
       buc.failure_reason,
       b.id                                                                                                       AS block_id,
       b.parent_id                                                                                                AS block_parent_id,
       b.state_hash,
       b.height,
       b.global_slot,
       b.global_slot::double precision - floor((b.global_slot / 7140)::double precision) *
                                         7140::double precision                                                   AS slot,
       floor((b.global_slot / 7140)::double precision)                                                            AS epoch,
       b."timestamp",
       b.chain_status,
       b.creator_id                                                                                               AS block_creator_id,
       pk.value                                                                                                   AS block_creator,
       b.block_winner_id,
       pk2.value                                                                                                  AS block_winner,
       uc.source_id                                                                                               AS trans_owner_id,
       pk3.value                                                                                                  AS trans_owner,
       uc.receiver_id                                                                                             AS trans_receiver_id,
       pk4.value                                                                                                  AS trans_receiver,
       uc.fee_payer_id                                                                                            AS trans_fee_payer_id,
       pk5.value                                                                                                  AS trans_fee_payer
FROM user_commands uc
         LEFT JOIN blocks_user_commands buc ON buc.user_command_id = uc.id
         LEFT JOIN blocks b ON buc.block_id = b.id
         LEFT JOIN public_keys pk ON b.creator_id = pk.id
         LEFT JOIN public_keys pk2 ON b.block_winner_id = pk2.id
         LEFT JOIN public_keys pk3 ON uc.source_id = pk3.id
         LEFT JOIN public_keys pk4 ON uc.receiver_id = pk4.id
         LEFT JOIN public_keys pk5 ON uc.fee_payer_id = pk5.id;

alter table v_trans_all
    owner to mina;

