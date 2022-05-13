delete from uptime
where segment_id in (
    select id from uptime_segments where timestamp < (now() - '60 day'::interval)
);

delete from uptime_segments where timestamp < (now() - '60 day'::interval);