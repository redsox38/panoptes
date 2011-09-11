/* tables */

--
-- Add request method column to url_monitors table
--
ALTER TABLE url_monitors ADD COLUMN request_method VARCHAR(255) DEFAULT 'GET' AFTER expect_http_content;

--
-- Add http post vars column to url_monitors table
--
ALTER TABLE url_monitors ADD COLUMN http_post_vars VARCHAR(255) DEFAULT NULL AFTER request_method;

