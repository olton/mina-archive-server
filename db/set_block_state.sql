create function set_block_state() returns trigger
    language plpgsql
as
$$
declare
    chain_row record;
    canonicalHeight bigint;
    expectedBlocksInChain bigint;
    realBlocksInChain bigint;
    k constant bigint := 15;
begin
    select into canonicalHeight max(height) from blocks where chain_status = 'canonical';
    expectedBlocksInChain = new.height - (canonicalHeight - k) + 1;

    select into realBlocksInChain count(*) from (
        with recursive chain as (
            select id, state_hash, parent_id, height
            from blocks
            where state_hash = new.state_hash

            union all

            select b.id, b.state_hash, b.parent_id, b.height
            from blocks b
                     inner join chain
                                on b.id = chain.parent_id and chain.height <> (canonicalHeigh - k)
        )

        select state_hash, height
        from chain
        where height < (select max(height) from blocks)
        order by height
    );

    if (expectedBlocksInChain = realBlocksInChain) then
        for chain_row in (
            with recursive chain as (
                select id, state_hash, parent_id, height
                from blocks
                where state_hash = new.state_hash

                union all

                select b.id, b.state_hash, b.parent_id, b.height
                from blocks b
                         inner join chain
                                    on b.id = chain.parent_id and chain.height <> (canonicalHeigh - k)
            )

            select state_hash, height
            from chain
            where height < (select max(height) from blocks)
            order by height
        )
        loop
            update blocks set chain_status = 'canonical' where state_hash = chain_row.state_hash;
            update blocks set chain_status = 'orphaned' where height = chain_row.height and state_hash != chain_row.state_hash;
        end loop;
    end if;

	return new;
end;
$$;

alter function set_block_state() owner to mina;

