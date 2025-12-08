# Backlog

This file tracks deferred tasks and ideas for the personal portfolio project.

- [ ] Email notifications for incoming contact messages
  - Description: Send an email to the address configured in the `contact` content (admin) whenever a new message is received via `/api/contact`.
  - Options: SMTP (Gmail App Password) or transactional provider (SendGrid/Mailgun).
  - Requirements:
    - Environment variables for SMTP or provider API key.
    - Background send (thread/task) to avoid blocking requests.
    - Add tests and logging for send failures.
  - Security: store credentials in Railway env vars; rotate keys if compromised.
  - Priority: medium

-- END --
