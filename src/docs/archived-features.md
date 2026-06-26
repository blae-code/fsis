# FSIS Archived Features Index

These features are intentionally sequestered for future development. They should not be removed blindly; they preserve useful architecture for a possible contractor/operator phase.

| Feature | Current status | Reason archived | Reactivation requirements |
|---|---|---|---|
| Job Board | Archived | Solo-proprietor focus | Public hiring policy, application review workflow, contractor access rules |
| Crew Roster | Archived | Crew management not central to current scope | Contractor identity model, privacy policy, payroll integration |
| Contractor Dashboards | Archived | Current app prioritizes proprietor operations | Contractor role permissions, scoped data access, onboarding copy |
| Station / Operator Views | Archived or secondary | Not needed for immediate storefront/management loop | Decide if operators can self-report activity |
| Public Operator Terminal Button | Archived | Management access should be discreet | Keep gear/admin access only unless policy changes |

## Reactivation Checklist

Before restoring any archived feature:

1. Define target role and permission level.
2. Confirm entity RLS supports that role.
3. Add QA checks for guest/user/contractor/admin access.
4. Update README and access-control docs.
5. Add onboarding/help copy for the restored workflow.