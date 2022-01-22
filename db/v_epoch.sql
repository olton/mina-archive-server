create view v_epoch(global_slot, epoch, slot, height, canonical) as
WITH gslot AS (
    SELECT max(blocks.global_slot) AS slot_number
    FROM blocks
)
SELECT gslot.slot_number                                                            AS global_slot,
       floor((gslot.slot_number / 7140)::double precision)                          AS epoch,
       gslot.slot_number::double precision -
       floor((gslot.slot_number / 7140)::double precision) * 7140::double precision AS slot,
       (SELECT max(blocks.height) AS max
        FROM blocks)                                                                AS height
FROM gslot;

alter table v_epoch
    owner to mina;

