USE phishing_repository;

-- Reports with submitter, account, platform and category
SELECT
    r.report_id,
    r.title,
    u.name AS submitted_by,
    a.username AS suspicious_account,
    p.platform_name,
    c.category_name,
    r.severity,
    r.status
FROM
    report r
    JOIN users u ON r.user_id = u.user_id
    JOIN account a ON r.account_id = a.account_id
    JOIN platform p ON a.platform_id = p.platform_id
    JOIN category c ON r.category_id = c.category_id;

-- Reports and their currently assigned analysts
SELECT r.report_id, r.title, au.name AS analyst_name, ra.assigned_at
FROM
    report r
    JOIN report_assignment ra ON r.report_id = ra.report_id
    JOIN analyst an ON ra.analyst_id = an.analyst_id
    JOIN users au ON an.user_id = au.user_id
WHERE
    ra.ended_at IS NULL;