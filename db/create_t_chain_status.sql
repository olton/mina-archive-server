-- DROP TYPE chain_status_type;

CREATE TYPE chain_status_type AS ENUM (
	'canonical',
	'orphaned',
	'pending');
