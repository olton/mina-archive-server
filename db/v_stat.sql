create view v_stat(total_producers, total_addresses, tr_applied, tr_failed, tr_total) as
WITH tr_info AS (
    SELECT (SELECT count(buc.user_command_id) AS count
            FROM blocks_user_commands buc
            WHERE buc.status = 'applied'::user_command_status) AS tr_applied,
           (SELECT count(buc.user_command_id) AS count
            FROM blocks_user_commands buc
            WHERE buc.status = 'failed'::user_command_status)  AS tr_failed
)
SELECT (SELECT count(DISTINCT blocks.creator_id) AS count
        FROM blocks)                          AS total_producers,
       (SELECT count(public_keys.id) AS count
        FROM public_keys)                     AS total_addresses,
       tr_info.tr_applied,
       tr_info.tr_failed,
       tr_info.tr_applied + tr_info.tr_failed AS tr_total
FROM tr_info;

alter table v_stat
    owner to mina;

