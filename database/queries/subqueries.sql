USE phishing_repository;

-- Reports more severe than the average severity score
SELECT report_id, title, severity
FROM report
WHERE
    CASE severity
        WHEN 'LOW' THEN 1
        WHEN 'MEDIUM' THEN 2
        WHEN 'HIGH' THEN 3
        WHEN 'CRITICAL' THEN 4
    END > (
        SELECT AVG(
                CASE severity
                    WHEN 'LOW' THEN 1
                    WHEN 'MEDIUM' THEN 2
                    WHEN 'HIGH' THEN 3
                    WHEN 'CRITICAL' THEN 4
                END
            )
        FROM report
    );

-- Reporters who have submitted at least one report
SELECT user_id, name, email
FROM users u
WHERE
    EXISTS (
        SELECT 1
        FROM report r
        WHERE
            r.user_id = u.user_id
            AND u.role = 'REPORTER'
    );