create function notify_new_block() returns trigger
    language plpgsql
as
$$
declare
    new_block v_blocks%ROWTYPE;
begin
    select into new_block * from v_blocks where id = new.id limit 1;
    perform pg_notify('new_block', row_to_json(new_block)::text);
    return null;
end;
$$;

alter function notify_new_block() owner to mina;

create trigger tr_ai_notify_new_block
    after insert
    on blocks
    for each row
execute procedure notify_new_block();
