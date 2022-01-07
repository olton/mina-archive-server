CREATE OR REPLACE FUNCTION public.set_block_state()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin	
	update blocks 
	set chain_status = case when id = new.parent_id then 'canonical'::chain_status_type else 'orphaned'::chain_status_type end
	where height = new.height - 1;
	
	return new;	
end;
$function$
;

create trigger tr_ai_set_block_state after
insert
    on
    public.blocks for each row execute function set_block_state();