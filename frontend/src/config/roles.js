/**
 * CogniSec Role Architecture & Registry
 *
 * Current backend status:
 *   - 'employee': fully operational (default public tier)
 *   - 'admin': fully operational (provisioned administratively)
 *
 * Planned future roles:
 *   - 'document_manager': planned (requires backend schema & permission tier expansion)
 *   - 'security_officer': planned (requires compliance review audit expansion)
 *
 * Security note: The frontend NEVER assigns or elevates permissions.
 * The backend User model and /auth/me endpoint are the sole sources of truth.
 */

export const ROLES = {
  EMPLOYEE: {
    id: 'employee',
    title: 'Employee',
    tag: 'Operational',
    description: "Access your organisation's knowledge workspace and ask questions within your authorised permissions.",
    route: '/employee',
    icon: 'User',
    isOperational: true,
    canSelfRegister: true,
  },
  ADMIN: {
    id: 'admin',
    title: 'Administrator',
    tag: 'Operational',
    description: 'Manage users, documents, permissions, and inspect security audit activities.',
    route: '/admin',
    icon: 'ShieldCheck',
    isOperational: true,
    canSelfRegister: false,
    restrictedMessage:
      'Administrator accounts cannot be self-registered. They are provisioned exclusively through authorised administrative security procedures.',
  },
  DOCUMENT_MANAGER: {
    id: 'document_manager',
    title: 'Document Manager',
    tag: 'Planned',
    description: 'Curate document collections, manage metadata taxonomy, and oversee document lifecycles.',
    route: '/document-manager',
    icon: 'FolderLock',
    isOperational: false,
    canSelfRegister: false,
    plannedNotice:
      'The Document Manager role is scheduled for a future release and requires backend role schema updates.',
  },
  SECURITY_OFFICER: {
    id: 'security_officer',
    title: 'Security / Privacy Officer',
    tag: 'Planned',
    description: 'Inspect privacy review logs, monitor redaction efficacy, and enforce compliance policies.',
    route: '/security-officer',
    icon: 'KeyRound',
    isOperational: false,
    canSelfRegister: false,
    plannedNotice:
      'The Security / Privacy Officer role is scheduled for upcoming compliance governance modules.',
  },
};

export const OPERATIONAL_ROLES = [ROLES.EMPLOYEE, ROLES.ADMIN];
export const FUTURE_ROLES = [ROLES.DOCUMENT_MANAGER, ROLES.SECURITY_OFFICER];

