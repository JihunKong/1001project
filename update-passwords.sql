-- Update all user passwords with proper bcrypt hashes
UPDATE users SET password = '$2b$12$kUfgVLSEyvnDTzf.swt8a.Ifdchg7Kfet9g0s7zX3FW1fuPzLyn1q' WHERE email = 'volunteer@1001stories.org';
UPDATE users SET password = '$2b$12$hBjdiIjkG/E/jJpibO.BmugrrWGLKSi7g8S9tS32zuzVToZYGSXZW' WHERE email = 'admin@1001stories.org';
UPDATE users SET password = '$2b$12$S/3Rm4MSO7eZYhWiAFg2Ge.nFdqpi99k8B4VboqVgzP5nFZlVOEuS' WHERE email = 'purusil55@gmail.com';
UPDATE users SET password = '$2b$12$uv4ikeAkcNBWnDqTs1r8T.RBc3PSVbp/nXplHHLuIgozOpFmnNGke' WHERE email = 'learner@test.1001stories.org';
UPDATE users SET password = '$2b$12$hcoLz7vawl16tIyQ7i3kO.dtO2E9GCmF73um2lAkgfYhFZTsLcdQy' WHERE email = 'teacher@test.1001stories.org';

-- Verify the password lengths
SELECT email, role, LENGTH(password) as password_length, LEFT(password, 15) as password_start FROM users ORDER BY email;