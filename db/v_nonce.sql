create view v_nonce(key_id, nonce) as
SELECT t.source_id      AS key_id,
       max(t.nonce) + 1 AS nonce
FROM v_trans t
GROUP BY t.source_id;

alter table v_nonce
    owner to mina;

