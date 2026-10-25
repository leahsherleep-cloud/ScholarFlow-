# ScholarFlow — Project Status Report

**Date:** 3 October 2026  
**Scope:** Read-only assessment of the existing MERN codebase. No application code was changed except creation of this report.  
**Stack confirmed:** React 19 + Vite, Node.js + Express, MongoDB + Mongoose, JWT + bcryptjs, Axios, React Router, React Context, Tailwind CSS.

---

## 1. Existing project architecture

### Repository layout

```
fsd project/
├── client/          React 19 + Vite frontend
│   └── src/
│       ├── components/ui + shared/RouteGuards
│       ├── context/AuthContext.jsx
│       ├── layouts/DashboardLayout.jsx
│       ├── pages/   landing, auth, student, officer, admin
│       ├── services/ Axios API modules
│       └── utils/helpers.js
└── server/          Express API
    ├── config/db.js
    ├── controllers/
    ├── middleware/  auth, upload, errorHandler
    ├── models/
    ├── routes/
    ├── services/    eligibilityService.js only
    └── utils/       helpers, response, seed
```

### Runtime flow

- Frontend (`http://localhost:5173`) proxies `/api` and `/uploads` to the backend (`http://localhost:5000`).
- Backend mounts REST routes under `/api`, serves uploaded files from `/uploads`, uses JWT Bearer auth, CORS, and `express-rate-limit`.
- MongoDB is required at startup (`connectDB` before `listen`).

### Documented vs actual backend layering

README describes **Routes → Controllers → Services → Models → MongoDB**.

**Actual state:**

| Layer | Status |
|---|---|
| Routes | Present and wired in `server.js` |
| Controllers | Hold almost all business logic |
| Services | Only `eligibilityService.js` |
| Models | Eight Mongoose models |
| Middleware | Auth (protect/authorize), Multer upload, central error handler |

This is a working Express architecture, but it is **controller-heavy**, not a full service layer.

### Frontend architecture

- Single `AuthContext` for session.
- Role-based routing via `RoleRoute`.
- Shared `DashboardLayout` with role-specific nav.
- No `client/src/hooks/` directory (mentioned in README; does not exist).
- No additional global state store (correct for the mandated Context API).

---

## 2. Features already implemented

### Authentication and public site

- Landing page, login, register (students only).
- JWT login/register/`/me`/logout.
- Public registration forced to `student`; officers created by admin.
- Inactive users blocked at login and on protected routes.
- Frontend role dashboards after login.
- Seeded demo accounts: admin, officer, student.

### Student module (most complete)

- Profile CRUD with completion percentage (personal, academic, address, bank).
- Browse/search active scholarships.
- Eligibility check against CGPA, income, course, category, year, department.
- Create draft application from scholarship detail (`/student/apply/:scholarshipId`) and from the scholarships list modal.
- After draft create, navigation uses the returned application `_id` (BUG-4 style fix **is present**).
- Document upload with field names matching backend: `document`, `applicationId`, `documentType`, `documentName`.
- Submit draft / resubmit after correction.
- Application list with status filter, pagination, error + retry (BUG-3 **is present**).
- Application detail with timeline, history, remarks, correction banner.
- Notifications list, mark one/all read.
- Dashboard loads **real** profile, applications, scholarships (no mock application/scholarship fallback). Dashboard and notification widgets have error + retry (BUG-1 / BUG-2 **are present**).

### Officer module

- Dashboard lists applications from `GET /api/applications` with search and status filters.
- Review page loads application + documents from APIs.
- Verify application, request correction, approve, reject.
- Verify/reject individual documents.
- Admin can also open officer review routes.

### Admin module

- Dashboard stats and Recharts (monthly applications, status pie, applications by scholarship).
- Scholarship create / edit / activate-deactivate / delete.
- User list, search, role filter, activate/deactivate, create officer.
- Application monitor (read-only table; “Review” opens officer review UI).
- Audit log table with pagination.
- Disbursement list and “process disbursement” for `APPROVED` applications.

### Backend supporting features

- Application numbers `SCH-YYYY-XXXXXX`.
- One application per student per scholarship (unique index).
- Status history, audit logs, in-app notifications on key events.
- File type/size validation (JPEG, PNG, PDF, DOC, DOCX; default 10MB).
- Pagination helpers and consistent `{ success, message, data }` responses.

---

## 3. Features partially implemented

| Feature | What works | What is incomplete |
|---|---|---|
| Application workflow | DRAFT → SUBMITTED → VERIFIED → APPROVED → DISBURSED (plus CORRECTION_REQUIRED / RESUBMITTED / REJECTED) | `UNDER_VERIFICATION` and `UNDER_EVALUATION` exist on the model and UI but **are never assigned** by controllers |
| Officer application list | Data loads on **dashboard** | `/officer/applications` is the **same review component**; missing `:id` redirects to dashboard instead of showing a list |
| Document workflow | Upload, list, officer verify/reject | Student cannot view/download files; submit does not require documents; no server check against `requiredDocuments` |
| Eligibility | Server-side check on apply; UI on detail/form | Scholarships list “quick apply” modal skips eligibility UI; eligibility failure on check is swallowed as “profile incomplete” on the form |
| Disbursements | Admin can create a record and mark application `DISBURSED` | Always created as `COMPLETED`; `PENDING` / `PROCESSING` / `FAILED` unused; `PATCH /disbursements/:id` is a generic update; no payment gateway |
| Admin analytics | Dashboard aggregation | `GET /api/admin/statistics` (disbursement-by-month) is **not used** by the UI |
| Officer remarks | Optional remarks on verify; stored on approve if provided | Approve button fires immediately with **empty remarks** (no remarks modal) |
| Student draft editing | Backend allows `PUT` personal statement in DRAFT / CORRECTION_REQUIRED | Application detail UI never calls `applicationService.update` |
| Notifications | In-app create/list/read | No navigation from a notification to the related application; no officer/admin notification screens; no email/SMS |
| Audit logs | Written on many actions | UI has no action/entity filters even though the API supports them |
| User model extras | `resetPasswordToken`, `profilePhoto` fields | No forgot-password, reset, or photo upload APIs/UI |
| Login “Remember me” | Checkbox in UI | Not wired to token lifetime or storage |
| Architecture / validation | Controllers + Mongoose validators | `express-validator` is a dependency but **unused**; little request-body sanitization |
| Slot management | `totalSlots` / `filledSlots` on scholarships | `filledSlots` increments on **submit**, not approval; no check that slots remain |
| Seed script | Users, profile, scholarships, notifications | Does **not** clear `Document` or `Disbursement` collections |

---

## 4. Missing features

Compared with README / role matrix / workflow diagram, these are absent or only stubbed:

1. Dedicated officer applications inbox page (currently confused with review).
2. Transition into `UNDER_VERIFICATION` when an officer starts review, and `UNDER_EVALUATION` after verify (workflow as documented).
3. Enforcement of required documents before submit.
4. Student document preview/download.
5. Scholarship recommendation / matching beyond a manual eligibility check.
6. Officer assignment / workload (`assignedOfficer` is set only on verify).
7. Password reset / change password.
8. Profile photo upload.
9. Email or SMS notifications.
10. Real payment processing (disbursement is a manual admin record).
11. Helmet / extra hardening claimed in README (rate limit, CORS, bcrypt, JWT **are** present; helmet and express-validator **are not used**).
12. Automated test suite in the repo (no `*test*` files). The previously reported **46/46 API assertions** are not in this codebase; they were likely external (Postman/curl).
13. Custom React hooks folder.
14. 404 page (unknown routes redirect to `/login`).
15. Officer/admin notification UI.
16. Multi-institution, OCR, i18n, mobile app (listed as future work — correctly not implemented).

---

## 5. Identified bugs

### High impact

1. **Officer dashboard mock fallback** (`client/src/pages/officer/OfficerDashboard.jsx`)  
   On API failure, the UI loads hardcoded `MOCK_APPS` with fake IDs (`o1`–`o6`). Review links go to `/officer/applications/o1` etc. and fail. This violates the no-mock-data rule and hides outages.

2. **Broken officer list route**  
   `App.jsx` maps both `/officer/applications` and `/officer/applications/:id` to `OfficerApplicationReview`. Without `:id`, the page redirects to the dashboard. The review page “Back” link goes to `/officer/applications`, which immediately redirects away.

3. **Workflow statuses never used**  
   Controllers jump `SUBMITTED` → `VERIFIED` (skipping `UNDER_VERIFICATION`) and `VERIFIED` → `APPROVED` (skipping `UNDER_EVALUATION`). Filters and timelines for those statuses will almost always be empty.

4. **Submit without documents**  
   `submitApplication` does not verify that required (or any) documents exist. Students can submit empty drafts.

5. **Axios 401 interceptor on login** (`client/src/services/api.js`)  
   Failed login returns 401, which clears storage and does `window.location.href = '/login'`. Hard redirect on credential errors is noisy and can fight the login form’s own error state.

### Medium impact

6. **Officer stats are page-local**  
   Counts use the current paginated list (default 10), not system-wide totals.

7. **Application search does not search student names**  
   Backend `GET /applications?search=` only regex-matches `applicationNumber`, despite comments suggesting student-name search. Officer client-side search only filters the current page.

8. **Scholarship delete is unconstrained**  
   Deleting a scholarship does not check existing applications (orphans / broken populates).

9. **Application number race**  
   Numbers use `countDocuments() + 1`. Concurrent creates can collide; duplicate key would then fail create.

10. **Disbursement update is unsafe**  
    `findByIdAndUpdate(req.params.id, req.body)` accepts arbitrary fields.

11. **Seed leftover collections**  
    Re-seeding does not delete `documents` or `disbursements`.

12. **Student document list has no file link**  
    Officers can open `doc.fileUrl`; students cannot.

13. **Approve without confirmation**  
    Officer “Approve” runs immediately; easy to click by mistake. Remarks are not collected.

14. **Admin/officer silent failures**  
    Several admin pages `catch {}` with no error banner or retry (dashboard, scholarships, users, applications, audit logs, disbursements). Empty state can look like “no data”.

15. **Quick apply vs full form inconsistency**  
    List modal allows empty personal statement; full apply form requires 50+ characters. Backend does not require a statement.

### Lower impact

16. Unused login “Remember me”.  
17. Unused `User` import-adjacent clutter and unused icons on some pages.  
18. `getScholarship` is public and returns inactive/draft scholarships by ID.  
19. Logout is audit-only; JWT remains valid until expiry (typical, but not a real server-side logout).  
20. `filledSlots` can exceed `totalSlots`.  
21. Unknown routes send authenticated users to `/login` instead of their dashboard.

---

## 6. Frontend–backend integration status

| Area | Client service | Backend | UI wired? | Notes |
|---|---|---|---|---|
| Auth | `authService` | `/api/auth/*` | Yes | Login/register/me/logout |
| Student profile | `studentService` | `/api/students/*` | Yes | |
| Scholarships | `scholarshipService` | `/api/scholarships/*` | Yes | Admin CRUD + student browse/eligibility |
| Applications | `applicationService` | `/api/applications/*` | Mostly | Update draft not used in UI |
| Documents | `documentService` | `/api/documents/*` | Yes (student upload, officer verify) | Field names match |
| Notifications | `notificationService` | `/api/notifications/*` | Student only | Shape `{ notifications, unreadCount }` matches `sendPaginated` |
| Admin | `adminService` | `/api/admin/*` + `/api/disbursements` | Mostly | `getStatistics` unused |
| Health | — | `GET /api/health` | No UI | Fine for ops |

**Student previous bug-fix verification (inspected, not assumed):**

- Mock application/scholarship data: **removed** from student dashboard (officer dashboard still has mocks).
- Dashboard API error + retry: **present**.
- Notification error + retry: **present** on dashboard widget.
- Application-list error + retry: **present**.
- Navigate to new draft `_id`: **present** in `ApplicationForm` and `StudentScholarships`.
- Upload field names: **aligned** (`document` + metadata fields).

---

## 7. API endpoint status

Legend: **OK** = implemented and used; **Partial** = implemented but unused/incomplete; **Gap** = documented workflow missing.

### Authentication

| Method | Path | Auth | Status |
|---|---|---|---|
| POST | `/api/auth/register` | Public | OK |
| POST | `/api/auth/login` | Public | OK |
| GET | `/api/auth/me` | JWT | OK |
| POST | `/api/auth/logout` | JWT | OK (client token drop + audit) |
| GET | `/api/health` | Public | OK |

### Students

| Method | Path | Auth | Status |
|---|---|---|---|
| GET | `/api/students/profile` | student | OK |
| PUT | `/api/students/profile` | student | OK |
| GET | `/api/students/applications` | student | OK (dashboard uses this; list page uses `/applications`) |

### Scholarships

| Method | Path | Auth | Status |
|---|---|---|---|
| GET | `/api/scholarships` | Optional JWT | OK |
| GET | `/api/scholarships/:id` | Public | OK |
| GET | `/api/scholarships/:id/eligibility` | student | OK |
| POST | `/api/scholarships` | admin | OK |
| PUT | `/api/scholarships/:id` | admin | OK |
| PATCH | `/api/scholarships/:id/status` | admin | OK |
| DELETE | `/api/scholarships/:id` | admin | OK (no referential guard) |

### Applications

| Method | Path | Auth | Status |
|---|---|---|---|
| POST | `/api/applications` | student | OK |
| GET | `/api/applications` | JWT (role-filtered) | OK |
| GET | `/api/applications/:id` | JWT (student own-only) | OK |
| PUT | `/api/applications/:id` | student | Partial (no UI) |
| POST | `/api/applications/:id/submit` | student | Partial (no document check) |
| PATCH | `/api/applications/:id/request-correction` | officer, admin | OK |
| PATCH | `/api/applications/:id/verify` | officer, admin | OK |
| PATCH | `/api/applications/:id/approve` | officer, admin | OK |
| PATCH | `/api/applications/:id/reject` | officer, admin | OK |

**Not implemented (implied by status enums / README):** start-verification, start-evaluation, assign officer, add-remark-only.

### Documents

| Method | Path | Auth | Status |
|---|---|---|---|
| POST | `/api/documents/upload` | student | OK |
| GET | `/api/documents/:applicationId` | JWT | OK |
| PATCH | `/api/documents/:id/verify` | officer, admin | OK |
| PATCH | `/api/documents/:id/reject` | officer, admin | OK |

No delete-document or download-with-auth endpoint (files are static `/uploads`).

### Notifications

| Method | Path | Auth | Status |
|---|---|---|---|
| GET | `/api/notifications` | JWT | OK |
| PATCH | `/api/notifications/read-all` | JWT | OK |
| PATCH | `/api/notifications/:id/read` | JWT | OK |

### Admin

| Method | Path | Auth | Status |
|---|---|---|---|
| GET | `/api/admin/dashboard` | admin | OK |
| GET | `/api/admin/users` | admin | OK |
| POST | `/api/admin/users/officer` | admin | OK |
| PATCH | `/api/admin/users/:id/toggle-status` | admin | OK |
| GET | `/api/admin/audit-logs` | admin | OK (filters unused in UI) |
| GET | `/api/admin/statistics` | admin | Partial (no UI) |

### Disbursements

| Method | Path | Auth | Status |
|---|---|---|---|
| POST | `/api/disbursements` | admin | OK (always COMPLETED) |
| GET | `/api/disbursements` | admin | OK |
| PATCH | `/api/disbursements/:id` | admin | Partial / risky |

---

## 8. Authentication and authorization status

### Strengths

- Passwords hashed with bcrypt (12 rounds); password `select: false`.
- JWT signed with `id` + `role`; expiry from `JWT_EXPIRE`.
- `protect` verifies token, loads user, rejects missing/invalid/inactive users.
- `authorize(...)` enforces roles on mutating routes.
- Students cannot read others’ applications or documents.
- Public register cannot create officer/admin.
- Admin cannot deactivate other admins.
- Frontend `RoleRoute` mirrors dashboards; officer routes also allow admin.
- Auth endpoints additionally use a stricter rate limiter (20 / 15 min).
- CORS locked to `CLIENT_URL`.

### Gaps / risks

- JWT in `localStorage` (XSS would steal tokens).
- No refresh tokens or server-side revocation.
- Login 401 handled as a global session kill.
- Little `express-validator` usage; reliance on Mongoose + a few controller checks.
- Static `/uploads` is not auth-gated; a guessed filename is readable.
- `updateDisbursement` mass-assignment.
- Officer/admin share application GET without assigned-officer restriction (any officer sees all).

---

## 9. Database model status

| Model | Collection purpose | Status |
|---|---|---|
| **User** | Auth, roles, active flag | Complete for current features. Unused: password reset fields. |
| **Student** | Academic/personal/bank profile | Complete. Unused: `profilePhoto`. Completion helper exists. |
| **Scholarship** | Programs, criteria, docs, slots, dates | Complete. Virtual `isOpen` exists. Slot enforcement missing. |
| **Application** | Lifecycle | Complete schema; two enum statuses unused in writes. Unique student+scholarship. |
| **Document** | File metadata + verification | Complete. |
| **Notification** | In-app messages | Complete. Several `type` values unused (`VERIFICATION_STARTED`, etc.). |
| **AuditLog** | Trail | Complete. Several `action` values unused (`DISBURSEMENT_FAILED`, `REMARKS_ADDED`, `DISBURSEMENT_INITIATED`). |
| **Disbursement** | Payment record | Schema richer than the controller (PENDING/FAILED unused). |

Indexes exist on common query fields. Relationships are ObjectId refs and are populated in controllers.

Seed data (as of Oct 2026) includes five **active** scholarships with windows that are currently open, plus a complete demo student profile.

---

## 10. Recommended development sequence

Do not rebuild. Work module by module, keeping the existing UI. Suggested order:

### Phase A — Officer module (highest gap vs README)

1. Remove `MOCK_APPS` from `OfficerDashboard.jsx`; add real error/empty/retry like the student dashboard.
2. Split **list** vs **review**: keep dashboard/list at `/officer/applications` (or reuse dashboard table) and review only at `/officer/applications/:id`. Fix the Back link.
3. Optionally set status `UNDER_VERIFICATION` when an officer opens or starts review, and `UNDER_EVALUATION` after verify, to match the documented workflow.
4. Add confirm + remarks modal for approve; keep reject/correction as they are.
5. Enforce (or at least warn) when documents are still `PENDING` before verify/approve.

### Phase B — Application integrity (student + backend)

6. Require scholarship `requiredDocuments` (uploaded, not rejected) before submit.
7. Allow students to view/download their files; wire `applicationService.update` for statement edits in DRAFT / CORRECTION_REQUIRED.
8. Align quick-apply with the full form (eligibility + statement rules).
9. Guard scholarship delete if applications exist; increment/check slots on **approval**, not raw submit.

### Phase C — Admin polish

10. Error/retry on admin pages; use `GET /api/admin/statistics` on the dashboard if disbursement charts are required.
11. Audit-log filters in the UI.
12. Tighten `PATCH /disbursements/:id` to explicit fields/status transitions instead of `req.body`.
13. Clear `Document` and `Disbursement` in seed.

### Phase D — Auth and security hardening (same stack)

14. Stop treating login 401 as a forced redirect; only redirect 401 on already-authenticated calls.
15. Add `express-validator` on auth, application, and disbursement bodies.
16. Auth-protect file downloads or signed URLs.
17. Change-password (and later forgot-password) if required for the project rubric.

### Phase E — Verification

18. Recreate the previous API assertion suite in-repo or Postman and re-run after each phase.
19. Manual role walkthrough: student apply → officer verify/correct → approve → admin disburse → student notification/timeline.

---

## Assessment summary

ScholarFlow already has a **real MERN skeleton** with working JWT RBAC, MongoDB models, and a **largely complete student module** (including the previously reported student bug fixes). Admin CRUD for scholarships, users, audit logs, and disbursements is connected to live APIs. The **officer module is the weakest production surface**: mock fallback, no dedicated list route, and a workflow that skips documented statuses. Remaining work should continue on the existing files, starting with officer list/review and removing mock data, then tightening document submit rules and admin error handling.

**Next step:** wait for the next development instruction; no application files were modified for this assessment.
