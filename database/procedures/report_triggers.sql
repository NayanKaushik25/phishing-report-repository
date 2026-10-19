USE phishing_repository;

DROP TRIGGER IF EXISTS trg_report_status_audit;

DELIMITER / /

CREATE TRIGGER trg_report_status_audit
AFTER UPDATE ON report
FOR EACH ROW
BEGIN
    IF NOT (OLD.status <=> NEW.status) THEN
        INSERT INTO report_status_audit
            (report_id, old_status, new_status)
        VALUES
            (NEW.report_id, OLD.status, NEW.status);
    END IF;
END //

DELIMITER;