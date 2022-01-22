create view v_address as
SELECT b.id                                                                  as public_key_id,
       b.value                                                               as public_key,
       a.name,
       a.site,
       a.telegram,
       a.discord,
       a.fee,
       a.description,
       l.balance                                                             as ledger_balance,
       l.delegate_key_id,
       c.name                                                                AS delegate_key,
       l.cliff_amount,
       l.cliff_time,
       l.initial_balance,
       l.initial_minimum_balance,
       l.receipt_chain_hash,
       l.vesting_increment,
       l.vesting_period,
       l.voting_for,
       (select count(*)
        from user_commands uc
        left join blocks_user_commands buc on uc.id = buc.user_command_id
        where buc.status = 'applied'
        and (uc.source_id = b.id or uc.receiver_id = b.id)
        ) as trans_count,
       (select count(*)
        from user_commands uc
        left join blocks_user_commands buc on uc.id = buc.user_command_id
        where buc.status = 'applied'
        and (uc.source_id = b.id)
        ) as trans_out,
       (select count(*)
        from user_commands uc
        left join blocks_user_commands buc on uc.id = buc.user_command_id
        where buc.status = 'failed'
        and (uc.source_id = b.id)
        ) as trans_failed,
       (SELECT count(b.id) AS count
        FROM blocks b
        WHERE b.creator_id = b.id)                                          AS blocks_total,
       (SELECT count(b.id) AS count
        FROM blocks b
        WHERE b.creator_id = b.id
          AND b.chain_status = 'canonical'::chain_status_type)              AS blocks_canonical,
       (SELECT count(sik.id) AS count
        FROM internal_commands sik
        WHERE sik.receiver_id = b.id
          AND sik.type = 'fee_transfer_via_coinbase'::internal_command_type) AS snarks_count
FROM public_keys b
         LEFT JOIN addresses a ON b.id = a.public_key_id
         LEFT JOIN v_ledger l ON b.id = l.public_key_id
         LEFT JOIN addresses c ON l.delegate_key_id = c.public_key_id;

