-- Add theme preference column to agents table
alter table agents add column if not exists theme text default 'dark';
