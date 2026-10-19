USE phishing_repository;

DROP PROCEDURE IF EXISTS UpdateReportStatus;

DELIMITER / /

CREATE PROCEDURE UpdateReportStatus(
    IN p_report_id BIGINT UNSIGNED,
    IN p_new_status VARCHAR(20)
)
BEGIN
    IF p_new_status NOT IN (
        'PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid report status';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM report WHERE report_id = p_report_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Report not found';
    END IF;

    UPDATE report
    SET status = p_new_status
    WHERE report_id = p_report_id;
END //

DELIMITER;