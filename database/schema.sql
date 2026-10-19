CREATE DATABASE IF NOT EXISTS phishing_repository;

USE phishing_repository;

-- 1. Registered users
CREATE TABLE users (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM(
        'REPORTER',
        'ANALYST',
        'ADMIN'
    ) NOT NULL DEFAULT 'REPORTER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- 2. Platforms
CREATE TABLE platform (
    platform_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    platform_name VARCHAR(100) NOT NULL UNIQUE,
    platform_type VARCHAR(50) NOT NULL,
    description TEXT
) ENGINE = InnoDB;

-- 3. Suspicious accounts
CREATE TABLE account (
    account_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    platform_id BIGINT UNSIGNED NOT NULL,
    username VARCHAR(255) NOT NULL,
    account_type VARCHAR(50),
    profile_url VARCHAR(2048),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_platform FOREIGN KEY (platform_id) REFERENCES platform (platform_id),
    CONSTRAINT uq_platform_username UNIQUE (platform_id, username)
) ENGINE = InnoDB;

-- 4. Report categories
CREATE TABLE category (
    category_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
) ENGINE = InnoDB;

-- 5. Analyst profiles
CREATE TABLE analyst (
    analyst_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    department VARCHAR(100),
    CONSTRAINT fk_analyst_user FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE = InnoDB;

-- 6. Phishing reports
CREATE TABLE report (
    report_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    account_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    severity ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ) NOT NULL DEFAULT 'MEDIUM',
    status ENUM(
        'PENDING',
        'UNDER_REVIEW',
        'RESOLVED',
        'REJECTED'
    ) NOT NULL DEFAULT 'PENDING',
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_user FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT fk_report_account FOREIGN KEY (account_id) REFERENCES account (account_id),
    CONSTRAINT fk_report_category FOREIGN KEY (category_id) REFERENCES category (category_id),
    INDEX idx_report_status (status),
    INDEX idx_report_account (account_id),
    INDEX idx_report_date (reported_at)
) ENGINE = InnoDB;

-- 7. Investigations
CREATE TABLE investigation (
    investigation_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT UNSIGNED NOT NULL UNIQUE,
    analyst_id BIGINT UNSIGNED NOT NULL,
    finding TEXT,
    remarks TEXT,
    investigated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    CONSTRAINT fk_investigation_report FOREIGN KEY (report_id) REFERENCES report (report_id),
    CONSTRAINT fk_investigation_analyst FOREIGN KEY (analyst_id) REFERENCES analyst (analyst_id)
) ENGINE = InnoDB;

-- 8. Evidence
CREATE TABLE evidence (
    evidence_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT UNSIGNED NOT NULL,
    evidence_type ENUM(
        'URL',
        'SCREENSHOT',
        'FILE',
        'MESSAGE',
        'OTHER'
    ) NOT NULL,
    description TEXT,
    file_path_or_url VARCHAR(2048),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evidence_report FOREIGN KEY (report_id) REFERENCES report (report_id),
    INDEX idx_evidence_report (report_id)
) ENGINE = InnoDB;

-- 9. Assignment history
CREATE TABLE report_assignment (
    assignment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT UNSIGNED NOT NULL,
    analyst_id BIGINT UNSIGNED NOT NULL,
    assigned_by BIGINT UNSIGNED NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    CONSTRAINT fk_assignment_report FOREIGN KEY (report_id) REFERENCES report (report_id),
    CONSTRAINT fk_assignment_analyst FOREIGN KEY (analyst_id) REFERENCES analyst (analyst_id),
    CONSTRAINT fk_assignment_admin FOREIGN KEY (assigned_by) REFERENCES users (user_id),
    INDEX idx_assignment_report (report_id),
    INDEX idx_assignment_analyst (analyst_id)
) ENGINE = InnoDB;

-- 10. Status-change audit history
CREATE TABLE report_status_audit (
    audit_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT UNSIGNED NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_report FOREIGN KEY (report_id) REFERENCES report (report_id),
    INDEX idx_audit_report (report_id)
) ENGINE = InnoDB;