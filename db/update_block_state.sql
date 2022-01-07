update blocks b1
set chain_status = case when (
	select count(b2.id) 
	from blocks b2
	where b2.height = b1.height + 1 and b2.parent_id = b1.id 
) > 0 then 'canonical'::chain_status_type else 'orphaned'::chain_status_type end
where b1.height < 96815