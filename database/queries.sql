-- Example Database Queries for FinSentinel

-- 1. Get User Profile
SELECT id, email, name, currency, timezone FROM users WHERE id = 'user_uuid';

-- 2. Get Recent Expenses
SELECT * FROM expenses WHERE user_id = 'user_uuid' ORDER BY date DESC LIMIT 20;

-- 3. Get Expenses by Category (Last 30 Days)
SELECT category, SUM(amount) as total, COUNT(*) as count
FROM expenses
WHERE user_id = 'user_uuid' AND date >= 1708890000000 -- example timestamp
GROUP BY category
ORDER BY total DESC;

-- 4. Get Budget Status
SELECT b.id, b.category, b.limit_amount, b.alert_threshold,
       COALESCE(SUM(e.amount), 0) as spent
FROM budgets b
LEFT JOIN expenses e ON b.user_id = e.user_id 
  AND LOWER(b.category) = LOWER(e.category) 
  AND e.date >= 1708890000000
WHERE b.user_id = 'user_uuid'
GROUP BY b.id;

-- 5. Get Upcoming Goals
SELECT * FROM goals
WHERE user_id = 'user_uuid' AND status = 'active' AND deadline > 1708976400000
ORDER BY deadline ASC
LIMIT 5;

-- 6. Family Group with Members
SELECT fg.*, u.name as owner_name, u.email as owner_email
FROM family_groups fg
JOIN users u ON fg.owner_id = u.id
WHERE fg.id = 'group_uuid';

SELECT fm.*, u.name, u.email
FROM family_members fm
JOIN users u ON fm.user_id = u.id
WHERE fm.group_id = 'group_uuid';
