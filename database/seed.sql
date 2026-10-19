USE phishing_repository;

-- Sample users (development placeholders; not login credentials)
INSERT INTO
    users (
        name,
        email,
        password_hash,
        role
    )
VALUES (
        'Aarav Sharma',
        'aarav@example.com',
        'DEV_PLACEHOLDER_1',
        'REPORTER'
    ),
    (
        'Priya Rao',
        'priya@example.com',
        'DEV_PLACEHOLDER_2',
        'REPORTER'
    ),
    (
        'Rohan Mehta',
        'rohan@example.com',
        'DEV_PLACEHOLDER_3',
        'REPORTER'
    ),
    (
        'Ananya Iyer',
        'ananya@example.com',
        'DEV_PLACEHOLDER_4',
        'ANALYST'
    ),
    (
        'Karan Singh',
        'karan@example.com',
        'DEV_PLACEHOLDER_5',
        'ANALYST'
    ),
    (
        'System Admin',
        'admin@example.com',
        'DEV_PLACEHOLDER_6',
        'ADMIN'
    );

-- Platforms
INSERT INTO
    platform (
        platform_name,
        platform_type,
        description
    )
VALUES (
        'Instagram',
        'SOCIAL_MEDIA',
        'Social networking platform'
    ),
    (
        'Telegram',
        'MESSAGING',
        'Messaging platform'
    ),
    (
        'Facebook',
        'SOCIAL_MEDIA',
        'Social networking platform'
    );

-- Categories
INSERT INTO
    category (category_name, description)
VALUES (
        'Credential Theft',
        'Attempts to steal login credentials'
    ),
    (
        'Impersonation',
        'Accounts impersonating legitimate people or brands'
    ),
    (
        'Financial Fraud',
        'Fraudulent financial offers or payment requests'
    );

-- Suspicious accounts
INSERT INTO
    account (
        platform_id,
        username,
        account_type,
        profile_url
    )
SELECT platform_id, 'secure_bank_support', 'IMPERSONATION', 'https://example.com/secure_bank_support'
FROM platform
WHERE
    platform_name = 'Instagram';

INSERT INTO
    account (
        platform_id,
        username,
        account_type,
        profile_url
    )
SELECT platform_id, 'crypto_reward_claim', 'FINANCIAL_FRAUD', 'https://example.com/crypto_reward_claim'
FROM platform
WHERE
    platform_name = 'Telegram';

INSERT INTO
    account (
        platform_id,
        username,
        account_type,
        profile_url
    )
SELECT platform_id, 'account_verify_team', 'CREDENTIAL_THEFT', 'https://example.com/account_verify_team'
FROM platform
WHERE
    platform_name = 'Facebook';

-- Analyst profiles
INSERT INTO
    analyst (user_id, department)
SELECT user_id, 'Cybersecurity'
FROM users
WHERE
    email IN (
        'ananya@example.com',
        'karan@example.com'
    );

-- Reports
INSERT INTO
    report (
        user_id,
        account_id,
        category_id,
        title,
        description,
        severity,
        status
    )
SELECT u.user_id, a.account_id, c.category_id, 'Fake bank support account', 'An account impersonates bank support and requests login details.', 'HIGH', 'PENDING'
FROM
    users u
    JOIN account a ON a.username = 'secure_bank_support'
    JOIN platform p ON p.platform_id = a.platform_id
    JOIN category c ON c.category_name = 'Impersonation'
WHERE
    u.email = 'aarav@example.com'
    AND p.platform_name = 'Instagram';

INSERT INTO
    report (
        user_id,
        account_id,
        category_id,
        title,
        description,
        severity,
        status
    )
SELECT u.user_id, a.account_id, c.category_id, 'Suspicious cryptocurrency giveaway', 'An account promises cryptocurrency rewards in exchange for payment.', 'CRITICAL', 'UNDER_REVIEW'
FROM
    users u
    JOIN account a ON a.username = 'crypto_reward_claim'
    JOIN platform p ON p.platform_id = a.platform_id
    JOIN category c ON c.category_name = 'Financial Fraud'
WHERE
    u.email = 'priya@example.com'
    AND p.platform_name = 'Telegram';

INSERT INTO
    report (
        user_id,
        account_id,
        category_id,
        title,
        description,
        severity,
        status
    )
SELECT u.user_id, a.account_id, c.category_id, 'Fake account verification message', 'A suspicious account asks users to verify their credentials.', 'MEDIUM', 'PENDING'
FROM
    users u
    JOIN account a ON a.username = 'account_verify_team'
    JOIN platform p ON p.platform_id = a.platform_id
    JOIN category c ON c.category_name = 'Credential Theft'
WHERE
    u.email = 'rohan@example.com'
    AND p.platform_name = 'Facebook';

-- Evidence
INSERT INTO
    evidence (
        report_id,
        evidence_type,
        description,
        file_path_or_url
    )
SELECT report_id, 'URL', 'Example URL associated with the suspicious profile', 'https://example.com/suspicious-bank-link'
FROM report
WHERE
    title = 'Fake bank support account';

INSERT INTO
    evidence (
        report_id,
        evidence_type,
        description,
        file_path_or_url
    )
SELECT report_id, 'MESSAGE', 'Example message advertising a cryptocurrency giveaway', NULL
FROM report
WHERE
    title = 'Suspicious cryptocurrency giveaway';

-- Assign reports to analysts
INSERT INTO
    report_assignment (
        report_id,
        analyst_id,
        assigned_by
    )
SELECT r.report_id, a.analyst_id, admin.user_id
FROM
    report r
    JOIN users admin ON admin.email = 'admin@example.com'
    JOIN analyst a ON TRUE
    JOIN users au ON au.user_id = a.user_id
WHERE
    r.title = 'Fake bank support account'
    AND au.email = 'ananya@example.com';

INSERT INTO
    report_assignment (
        report_id,
        analyst_id,
        assigned_by
    )
SELECT r.report_id, a.analyst_id, admin.user_id
FROM
    report r
    JOIN users admin ON admin.email = 'admin@example.com'
    JOIN analyst a ON TRUE
    JOIN users au ON au.user_id = a.user_id
WHERE
    r.title = 'Suspicious cryptocurrency giveaway'
    AND au.email = 'karan@example.com';

-- Initial investigation
INSERT INTO
    investigation (
        report_id,
        analyst_id,
        finding,
        remarks
    )
SELECT r.report_id, a.analyst_id, 'Initial review pending', 'Evidence requires further verification.'
FROM report r
    JOIN analyst a ON TRUE
    JOIN users u ON u.user_id = a.user_id
WHERE
    r.title = 'Fake bank support account'
    AND u.email = 'ananya@example.com';