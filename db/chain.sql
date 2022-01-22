WITH RECURSIVE chain AS (
    SELECT id, state_hash, parent_id, height
    FROM blocks
    WHERE state_hash =
--           '3NK5GrHRtwjiu382D44UqSr6vhXzikafCSt9Pzvn5tPzXjDSRzfj'
    (
        select state_hash
          from blocks
         where height = (select max(height) from blocks)
        limit 1
    )

    UNION ALL

    SELECT b.id, b.state_hash, b.parent_id, b.height
    FROM blocks b
             INNER JOIN chain
                        ON b.id = chain.parent_id AND chain.height <> (select max(height) from blocks where chain_status = 'canonical')
)

SELECT state_hash, height
FROM chain
ORDER BY height asc