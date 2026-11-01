-- Media now lives in ImageKit instead of R2. provider_file_id is ImageKit's fileId, needed to delete a file later.
ALTER TABLE media ADD COLUMN provider_file_id TEXT;
