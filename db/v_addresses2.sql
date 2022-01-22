create view v_addresses
            (id, address, balance, ledger_balance, delegate_id, delegate_address, cliff_amount, cliff_time,
             initial_balance, initial_minimum_balance, receipt_chain_hash, vesting_increment, vesting_period,
             voting_for, tr_count, tr_applied, tr_failed, name, site, telegram, discord, fee, description,
             blocks_count, blocks_canonical_count, snarks_count)
as
WITH ledger_current AS (
    SELECT l1.public_key_id,
           l1.balance,
           l1.delegate_key_id,
           l1.nonce,
           l1.receipt_chain_hash,
           l1.voting_for,
           l1.token,
           l1.initial_balance,
           l1.initial_minimum_balance,
           l1.cliff_time,
           l1.cliff_amount,
           l1.vesting_period,
           l1.vesting_increment,
           l1.epoch
    FROM ledger l1
    WHERE l1.epoch::double precision = ((SELECT v_epoch.epoch
                                         FROM v_epoch))
)
SELECT b.id,
       b.address,
       b.balance,
       lc.balance                                                            AS ledger_balance,
       lc.delegate_key_id                                                    AS delegate_id,
       pk.value                                                              AS delegate_address,
       lc.cliff_amount,
       lc.cliff_time,
       lc.initial_balance,
       lc.initial_minimum_balance,
       lc.receipt_chain_hash,
       lc.vesting_increment,
       lc.vesting_period,
       lc.voting_for,
       (SELECT count(t1.id) AS count
        FROM user_commands t1
        WHERE t1.source_id = b.id)                                           AS tr_count,
       (SELECT count(vt.id) AS count
        FROM v_trans vt
        WHERE vt.trans_owner_id = b.id
          AND vt.status = 'applied'::user_command_status
          and vt.chain_status = 'canonical')                    AS tr_applied,
       (SELECT count(vt.id) AS count
        FROM v_trans vt
        WHERE vt.trans_owner_id = b.id
          AND vt.status = 'failed'::user_command_status
          and chain_status = 'canonical' )                     AS tr_failed,
       a.name,
       a.site,
       a.telegram,
       a.discord,
       a.fee,
       a.description,
       (SELECT count(vb.id) AS count
        FROM blocks vb
        WHERE vb.creator_id = b.id)                                          AS blocks_count,
       (SELECT count(vb.id) AS count
        FROM blocks vb
        WHERE vb.creator_id = b.id
          AND vb.chain_status = 'canonical'::chain_status_type)              AS blocks_canonical_count,
       (SELECT count(sik.id) AS count
        FROM internal_commands sik
        WHERE sik.receiver_id = b.id
          AND sik.type = 'fee_transfer_via_coinbase'::internal_command_type) AS snarks_count
FROM v_balances b
         LEFT JOIN ledger_current lc ON b.id = lc.public_key_id
         LEFT JOIN public_keys pk ON lc.delegate_key_id = pk.id
         LEFT JOIN addresses a ON b.id = a.public_key_id;

alter table v_addresses
    owner to mina;

