| table_name       | column_name       | data_type                |
| ---------------- | ----------------- | ------------------------ |
| analytics_events | id                | uuid                     |
| analytics_events | user_id           | uuid                     |
| analytics_events | job_id            | uuid                     |
| analytics_events | event_type        | text                     |
| analytics_events | event_data        | jsonb                    |
| analytics_events | created_at        | timestamp with time zone |
| applications     | id                | uuid                     |
| applications     | user_id           | uuid                     |
| applications     | job_id            | uuid                     |
| applications     | cover_letter      | text                     |
| applications     | resume_url        | text                     |
| applications     | status            | text                     |
| applications     | applied_at        | timestamp with time zone |
| applications     | updated_at        | timestamp with time zone |
| bookmarks        | id                | uuid                     |
| bookmarks        | user_id           | uuid                     |
| bookmarks        | job_id            | uuid                     |
| bookmarks        | created_at        | timestamp with time zone |
| files            | id                | uuid                     |
| files            | user_id           | uuid                     |
| files            | file_name         | text                     |
| files            | file_url          | text                     |
| files            | mime_type         | text                     |
| files            | size_bytes        | bigint                   |
| files            | uploaded_at       | timestamp with time zone |
| jobs             | id                | uuid                     |
| jobs             | source            | text                     |
| jobs             | external_id       | text                     |
| jobs             | title             | text                     |
| jobs             | company           | text                     |
| jobs             | company_logo      | text                     |
| jobs             | location          | text                     |
| jobs             | job_type          | text                     |
| jobs             | remote            | boolean                  |
| jobs             | description       | text                     |
| jobs             | skills            | ARRAY                    |
| jobs             | salary_min        | numeric                  |
| jobs             | salary_max        | numeric                  |
| jobs             | url               | text                     |
| jobs             | embedding         | USER-DEFINED             |
| jobs             | created_at        | timestamp with time zone |
| jobs             | updated_at        | timestamp with time zone |
| profiles         | id                | uuid                     |
| profiles         | full_name         | text                     |
| profiles         | email             | text                     |
| profiles         | mobile            | text                     |
| profiles         | location          | text                     |
| profiles         | degree            | text                     |
| profiles         | stream            | text                     |
| profiles         | graduation_year   | text                     |
| profiles         | experience        | text                     |
| profiles         | preferred_city    | text                     |
| profiles         | about             | text                     |
| profiles         | skills            | ARRAY                    |
| profiles         | interests         | ARRAY                    |
| profiles         | technical_domains | ARRAY                    |
| profiles         | resume_url        | text                     |
| profiles         | created_at        | timestamp with time zone |
| profiles         | updated_at        | timestamp with time zone |
| stored_jobs      | id                | uuid                     |
| stored_jobs      | user_id           | uuid                     |
| stored_jobs      | job_id            | uuid                     |
| stored_jobs      | saved_at          | timestamp with time zone |
| stored_jobs      | source            | text                     |