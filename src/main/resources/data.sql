-- Seed the first SYSTEM_ADMIN (only if not exists)
INSERT INTO users (username, email, password, email_verified, role, department_id, institution_id)
SELECT 'admin', 'admin@lab.com', '$2a$12$I3TCunZ8nn2QRuz1MABCWeiC3L4iaxoaFLCe1la5PRSY2Ez8TApqa', true, 'SYSTEM_ADMIN', NULL, NULL
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@lab.com');