"""
Script to generate a realistic corporate policy document in PDF format
for CogniSec demonstrations.
"""

from pathlib import Path
import pymupdf as fitz


def create_demo_pdf(output_path: Path):
    doc = fitz.open()

    # Color palette (RGB normalized 0.0 - 1.0)
    DARK_GREEN = (11 / 255, 46 / 255, 36 / 255)
    EMERALD = (5 / 255, 150 / 255, 105 / 255)
    CHARCOAL = (30 / 255, 41 / 255, 59 / 255)
    SLATE_MUTED = (100 / 255, 116 / 255, 139 / 255)
    LIGHT_BG = (248 / 255, 250 / 255, 252 / 255)
    BORDER_COLOR = (226 / 255, 232 / 255, 240 / 255)

    def draw_page_chrome(page, page_num, total_pages, title):
        # Top banner line
        page.draw_rect(fitz.Rect(50, 40, 545, 42), color=EMERALD, fill=EMERALD)
        
        # Header text
        page.insert_text(
            (50, 32),
            "COGNITIVELY SECURE ENTERPRISE SYSTEMS • CONFIDENTIAL INTERNAL POLICY",
            fontsize=8,
            fontname="helv",
            color=SLATE_MUTED,
        )
        page.insert_text(
            (545 - 60, 32),
            "DOC-SEC-2026",
            fontsize=8,
            fontname="helv",
            color=EMERALD,
        )

        # Footer divider
        page.draw_rect(fitz.Rect(50, 790, 545, 791), color=BORDER_COLOR, fill=BORDER_COLOR)
        page.insert_text(
            (50, 805),
            "Strictly for authorized employee use. Unauthorized distribution is prohibited.",
            fontsize=8,
            fontname="helv",
            color=SLATE_MUTED,
        )
        page.insert_text(
            (545 - 55, 805),
            f"Page {page_num} of {total_pages}",
            fontsize=8,
            fontname="helv",
            color=CHARCOAL,
        )

    # =========================================================================
    # PAGE 1: INFORMATION SECURITY & CREDENTIAL POLICIES
    # =========================================================================
    p1 = doc.new_page(width=595, height=842)  # A4 size
    draw_page_chrome(p1, 1, 3, "Information Security Policy")

    # Document Title
    p1.insert_text((50, 80), "CogniSec Enterprise Operations & Security Policy", fontsize=18, fontname="helv", color=DARK_GREEN)
    p1.insert_text((50, 98), "Version 3.4 • Effective Date: January 1, 2026 • Classification: Internal Restricted", fontsize=9, fontname="helv", color=SLATE_MUTED)
    p1.draw_rect(fitz.Rect(50, 110, 545, 111), color=BORDER_COLOR, fill=BORDER_COLOR)

    # Section 1 Header
    p1.insert_text((50, 135), "1. Information Security & Remote Work Policy", fontsize=14, fontname="helv", color=DARK_GREEN)

    # Section 1.1
    p1.insert_text((50, 160), "1.1 Password Standards and Credential Management", fontsize=11, fontname="helv", color=EMERALD)
    text_1_1 = (
        "All corporate systems, cloud infrastructure, and internal portals require multi-factor authentication (MFA). "
        "Passwords must be at least 14 characters in length and include uppercase letters, lowercase letters, numbers, and symbols. "
        "Passwords must be rotated every 90 calendar days and cannot be reused across consecutive rotation cycles. "
        "Under no circumstances should credentials be shared via email, chat channels, or plaintext document notes."
    )
    p1.insert_textbox(fitz.Rect(50, 170, 545, 230), text_1_1, fontsize=9.5, fontname="helv", color=CHARCOAL)

    # Section 1.2
    p1.insert_text((50, 245), "1.2 Remote Work Protocols and Device Security", fontsize=11, fontname="helv", color=EMERALD)
    text_1_2 = (
        "Employees working remotely must connect through the official corporate WireGuard VPN before accessing any internal company repositories. "
        "All laptops must maintain full-disk encryption enabled using BitLocker or FileVault with minimum 256-bit AES keys. "
        "Connecting to public or unsecured Wi-Fi networks (such as cafes, hotels, and airports) without an active corporate VPN session is strictly forbidden. "
        "Any lost, stolen, or compromised device must be immediately reported to the IT Helpdesk within 60 minutes."
    )
    p1.insert_textbox(fitz.Rect(50, 255, 545, 325), text_1_2, fontsize=9.5, fontname="helv", color=CHARCOAL)

    # Section 1.3
    p1.insert_text((50, 340), "1.3 Clean Desk Policy and Physical Security", fontsize=11, fontname="helv", color=EMERALD)
    text_1_3 = (
        "Workstations must automatically lock after 5 minutes of inactivity. When stepping away from work desks, employees must manually lock their screens. "
        "Printed documents containing customer data, candidate resumes, or financial balances must not be left unattended on printers or desks, and must be shredded immediately after use."
    )
    p1.insert_textbox(fitz.Rect(50, 350, 545, 400), text_1_3, fontsize=9.5, fontname="helv", color=CHARCOAL)

    # Callout Box with PII (For testing privacy detector)
    p1.draw_rect(fitz.Rect(50, 420, 545, 490), color=BORDER_COLOR, fill=LIGHT_BG)
    p1.insert_text((65, 440), "SECURITY CONTACT AND ESCALATION LEAD:", fontsize=9.5, fontname="helv", color=DARK_GREEN)
    p1.insert_text((65, 458), "Designated Security Officer: Dr. Marcus Vance", fontsize=9, fontname="helv", color=CHARCOAL)
    p1.insert_text((65, 472), "Email: marcus.vance@cognisec-internal.corp  |  Direct Phone: +1-555-019-2834", fontsize=9, fontname="helv", color=CHARCOAL)

    # =========================================================================
    # PAGE 2: EMPLOYEE BENEFITS, LEAVE & WORK SCHEDULE
    # =========================================================================
    p2 = doc.new_page(width=595, height=842)
    draw_page_chrome(p2, 2, 3, "Employee Benefits & Leave Policy")

    p2.insert_text((50, 80), "2. Employee Leave Entitlements & Work Schedule", fontsize=14, fontname="helv", color=DARK_GREEN)

    # Section 2.1
    p2.insert_text((50, 105), "2.1 Annual Paid Leave (Vacation Days)", fontsize=11, fontname="helv", color=EMERALD)
    text_2_1 = (
        "All permanent full-time employees are entitled to 25 days of annual paid leave per calendar year. "
        "Leave accrues monthly at a rate of 2.08 days per completed calendar month of active service. "
        "Employees may carry over a maximum of 5 unused vacation days into the first quarter (Q1) of the subsequent year, which must be utilized prior to March 31st. "
        "Leave requests exceeding 3 consecutive business days require at least 2 weeks of prior submission through the HR portal."
    )
    p2.insert_textbox(fitz.Rect(50, 115, 545, 185), text_2_1, fontsize=9.5, fontname="helv", color=CHARCOAL)

    # Section 2.2
    p2.insert_text((50, 200), "2.2 Sick Leave, Health & Medical Absences", fontsize=11, fontname="helv", color=EMERALD)
    text_2_2 = (
        "Employees receive 10 fully paid medical sick leave days per calendar year. "
        "Medical absences exceeding 3 consecutive working days require a signed certificate or digital verification from a licensed medical practitioner. "
        "The company additionally provides an annual Wellness Allowance of $1,200 per employee, reimbursable for gym memberships, mental health counseling, ergonomics, and fitness subscriptions."
    )
    p2.insert_textbox(fitz.Rect(50, 210, 545, 275), text_2_2, fontsize=9.5, fontname="helv", color=CHARCOAL)

    # Section 2.3
    p2.insert_text((50, 290), "2.3 Core Working Hours and Flexible Scheduling", fontsize=11, fontname="helv", color=EMERALD)
    text_2_3 = (
        "Standard working hours consist of 40 hours per week. Core collaboration hours during which all team members should be reachable are between 10:00 AM and 3:00 PM local time. "
        "Flexible starting hours are permitted between 7:30 AM and 10:00 AM upon agreement with departmental leads. "
        "Parental leave offers 16 weeks of 100% paid leave for primary caregivers and 6 weeks for secondary caregivers."
    )
    p2.insert_textbox(fitz.Rect(50, 300, 545, 365), text_2_3, fontsize=9.5, fontname="helv", color=CHARCOAL)

    # Callout Box with PII (HR Lead)
    p2.draw_rect(fitz.Rect(50, 385, 545, 455), color=BORDER_COLOR, fill=LIGHT_BG)
    p2.insert_text((65, 405), "PEOPLE OPERATIONS & HR INQUIRIES:", fontsize=9.5, fontname="helv", color=DARK_GREEN)
    p2.insert_text((65, 423), "Contact: Ms. Elena Rostova, VP of People Operations", fontsize=9, fontname="helv", color=CHARCOAL)
    p2.insert_text((65, 437), "HR Support Desk: elena.rostova@cognisec-internal.corp  |  Ext: 4402", fontsize=9, fontname="helv", color=CHARCOAL)

    # =========================================================================
    # PAGE 3: DATA RETENTION, DISPOSAL & INCIDENT RESPONSE
    # =========================================================================
    p3 = doc.new_page(width=595, height=842)
    draw_page_chrome(p3, 3, 3, "Data Retention & Incident Response")

    p3.insert_text((50, 80), "3. Data Retention, Archival & Incident Protocols", fontsize=14, fontname="helv", color=DARK_GREEN)

    # Section 3.1
    p3.insert_text((50, 105), "3.1 Data Retention Schedules and Record Lifecycles", fontsize=11, fontname="helv", color=EMERALD)
    text_3_1 = (
        "In compliance with legal, regulatory, and corporate compliance frameworks, company records must be archived and deleted strictly according to the following retention periods:\n\n"
        "• Financial and Tax Audit Records: Retained for exactly 7 years following the end of the applicable fiscal year.\n"
        "• Employee Personnel & Payroll Records: Retained for 5 years following separation or termination of employment.\n"
        "• Client Contracts & Vendor Agreements: Retained for 6 years following contract expiration or termination.\n"
        "• Temporary Working Drafts and Transitory Files: Permanently purged after 180 calendar days of creation."
    )
    p3.insert_textbox(fitz.Rect(50, 115, 545, 220), text_3_1, fontsize=9.5, fontname="helv", color=CHARCOAL)

    # Section 3.2
    p3.insert_text((50, 235), "3.2 Incident Severity Levels and Mandatory SLAs", fontsize=11, fontname="helv", color=EMERALD)
    text_3_2 = (
        "Security incidents must be triaged and resolved according to the following service level agreements (SLAs):\n\n"
        "• Severity 1 (Critical): Active data breach, system compromise, or ransomware. Initial containment SLA: within 30 minutes. Executive notification within 1 hour.\n"
        "• Severity 2 (High): Isolated credential compromise or targeted phishing attack. Response SLA: within 2 hours.\n"
        "• Severity 3 (Medium / Low): Policy violation, suspicious spam, or unauthorized software installation. Response SLA: within 24 hours."
    )
    p3.insert_textbox(fitz.Rect(50, 245, 545, 345), text_3_2, fontsize=9.5, fontname="helv", color=CHARCOAL)

    # Section 3.3
    p3.insert_text((50, 360), "3.3 Secure Disposal and Sanitization Procedures", fontsize=11, fontname="helv", color=EMERALD)
    text_3_3 = (
        "Storage media, flash drives, and decommissioned servers containing internal data must undergo cryptographic wipe in accordance with NIST SP 800-88 Rev 1 guidelines. "
        "Physical paper documents bearing proprietary intellectual property or PII must be deposited in locked shredding consoles for cross-cut destruction."
    )
    p3.insert_textbox(fitz.Rect(50, 370, 545, 430), text_3_3, fontsize=9.5, fontname="helv", color=CHARCOAL)

    # Callout Box: Incident Hotline
    p3.draw_rect(fitz.Rect(50, 445, 545, 515), color=BORDER_COLOR, fill=LIGHT_BG)
    p3.insert_text((65, 465), "24/7 INCIDENT RESPONSE HOTLINE & DISPATCH:", fontsize=9.5, fontname="helv", color=DARK_GREEN)
    p3.insert_text((65, 483), "Report Breach: security-incident@cognisec-internal.corp", fontsize=9, fontname="helv", color=CHARCOAL)
    p3.insert_text((65, 497), "Emergency Hotline: +1-555-014-9988  |  Radio Channel: Delta-9", fontsize=9, fontname="helv", color=CHARCOAL)

    # Save PDF
    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(output_path))
    doc.close()
    print(f"Successfully generated demo PDF at: {output_path}")


if __name__ == "__main__":
    out_file = Path("e:/miniprojectupdate/safegpt/CogniSec_Corporate_Policy_2026.pdf")
    create_demo_pdf(out_file)

