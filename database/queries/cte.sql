USE phishing_repository;

-- Count reports by status using a CTE
WITH
    report_counts AS (
        SELECT status, COUNT(*) AS total
        FROM report
        GROUP BY
            status
    )
SELECT status, total
FROM report_counts
ORDER BY total DESC;