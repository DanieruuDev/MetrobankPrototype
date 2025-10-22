-- Query to check user emails for the notification system
-- Run this in your PostgreSQL database

-- Check specific users for notifications
SELECT 
    admin_id,
    admin_name,
    admin_email,
    role_id,
    CASE 
        WHEN admin_id = 7 THEN 'HR User'
        WHEN admin_id = 21 THEN 'Regular Registrar'
        WHEN admin_id = 22 THEN 'STI Sta Mesa Registrar'
        WHEN admin_id = 23 THEN 'Regular DO'
        WHEN admin_id = 24 THEN 'STI Sta Mesa DO'
        ELSE 'Other User'
    END as user_role
FROM administration_adminaccounts 
WHERE admin_id IN (7, 21, 22, 23, 24)
ORDER BY admin_id;

-- Check all admin users
SELECT 
    admin_id,
    admin_name,
    admin_email,
    role_id
FROM administration_adminaccounts 
ORDER BY admin_id;
