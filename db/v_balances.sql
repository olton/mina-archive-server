create view v_balances(id, address, balance) as
WITH current_balances AS (
    SELECT max(b_1.id) AS balance_id,
           b_1.public_key_id
    FROM balances b_1
    GROUP BY b_1.public_key_id
)
SELECT pk.id,
       pk.value AS address,
       b.balance
FROM public_keys pk
         LEFT JOIN current_balances cb ON cb.public_key_id = pk.id
         LEFT JOIN balances b ON cb.balance_id = b.id;

alter table v_balances
    owner to mina;

