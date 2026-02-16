# Spanner — Open Questions for Requirements Review

Review the questions below and add your responses in the **Response** section under each item.

> **Round 1:** Responses incorporated into `requirements.md` v1.1.  
> **Round 2:** Responses incorporated into `requirements.md` v2.0.  
> **Round 3:** Responses incorporated into `requirements.md` v3.0 and `prompts-refined.md`.  
> **Round 4:** Responses incorporated into `requirements.md` v3.1 and `prompts-refined.md`. Remaining open items in requirements.md section 16.

---

## CSV Upload

### Q1. Max file size and row limit
What are the limits for CSV uploads? (e.g., 10MB max file size, 50K rows, 100K rows?)

**Response:**
<!-- Add your answer here -->
I don't think there would be a f file size issue here, but let's say max size should be up to ten MB. And if the number of records are more than one thousand then we can look at on into this later. So just focus on put a max size of ten mb right now.


---

### Q2. Partial vs. strict import
When validation fails for some rows but not others: allow partial import (valid rows only), or reject the entire file (all-or-nothing)?

**Response:**
<!-- Add your answer here -->
Import the valid rows and show the error entries into the module.Create a module where you can correct the entries within the application, or they can upload correct entries CSV.


---

### Q3. Extra columns in CSV
If the CSV has extra columns not in the predefined schema: allow and ignore them, or reject the file?

**Response:**
<!-- Add your answer here -->
Ignore the extra columns. We have a fixed set of columns in the Excel. That this should be approved into the system. If user is adding a new column, just ignore that column.


---

### Q4. Deduplication key fields
Which fields form the duplicate key? (e.g., Email + Company Name + First Name + Last Name?)

**Response:**
<!-- Add your answer here -->
I think company name and company website URL should be the key for company duplication.


---

### Q5. Deduplication schedule
How often should the duplicate-flagging job run? (hourly, daily, weekly, configurable?)

**Response:**
<!-- Add your answer here -->
We can figure out the schedule later on, but for now keep it configurable and set for weekly.


---

### Q6. CSV column header case-sensitivity
Should column names match exactly (case-sensitive)? E.g., does `first name` match `First Name`?

**Response:**
<!-- Add your answer here -->
No, it's not case sensitive.


---

### Q7. Researcher Name in CSV
Should the Researcher Name in the CSV be the logged-in user (auto-filled), or can it differ per row (e.g., researcher who actually did the work)?

**Response:**
<!-- Add your answer here -->
I think in database you can maintain who uploaded the file or who uploaded the record into the system. We are not relying on the agent or researcher name from CSV.


---

## Task Assignment

### Q8. Task entity definition
What does a "task" look like? (e.g., "Find contacts for Company X", "Find companies for Segment Y" — what fields: title, description, assignee, status, due date?)

**Response:**
<!-- Add your answer here -->
 As I mentioned earlier we decide that the key entity for the application is the segment, For each segment, we will find the companies. Then from these companies, which companies we want to target, we will create a approved company list. And in the list view of the companies, we have two actions approve or reject. So if it is approved, it's approved, but if they want to reject, they should give a reason why they are rejecting a company. So that and we can log that into our database.


---

### Q9. What can be assigned?
At what level does task assignment happen — company-level, contact-level, segment-level, or all?

**Response:**
<!-- Add your answer here -->
It's all


---

### Q10. Notifications for task assignment
Do we need in-app or email notifications when an Approver assigns a task to a junior researcher?

**Response:**
<!-- Add your answer here -->
All notification will be happen on Microsoft Teams. We will do the integration in the next phase, but you can write the stories and create the right solution approach.


---

## Company & Contact Research

### Q11. Company vs. contact relationship
Is the flow: create companies first (approved list) → then researchers add contacts to those companies? Or is each CSV row a contact that may or may not belong to an already-approved company?

**Response:**
<!-- Add your answer here -->
Researcher can upload contacts based on the companies which are approved. This could be multiple, for example, a researcher can find contacts for multiple companies in a day and put in an Excel and we can upload.


---

### Q12. Approval workflow granularity
Can companies/contacts be approved in bulk, or must each record be approved/rejected individually?

**Response:**
<!-- Add your answer here -->
Contacts can be approved in bulk, but not companies. I want to make it strict.


---

### Q13. "Approved list to researcher" — how is it surfaced?
How do researchers see the approved company list? (New queue, filtered list view, notification with link, etc.?)

**Response:**
<!-- Add your answer here -->
Make a module in the application where researcher can see what companies are assigned to them or Or what segment are assigned to these guys so that on which they have to work upon.I am thinking of in the left navigation or in the top navigation they have a list of segments on which which which which which which which which which which which are assigned to them against which they are uploading companies and a module with a link that which says assigned companies or approved companies in which they are going to upload the contacts.We can make a module where against a company they can create a new contact.


---

## Marketing Collateral

### Q14. Marketing collateral storage
Are collateral files (pamphlets, brochures) stored in the application (file upload), or managed externally with links only?

**Response:**
<!-- Add your answer here -->
It should be links only.


---

### Q15. Marketing collateral file types
If files are stored in-app, which formats are allowed? (PDF, images, DOCX, etc.)

**Response:**
<!-- Add your answer here -->
It should be links only of the sh she she shear drive


---

### Q16. Marketing collateral scope
Is collateral tied to segment, to offerings, to a specific lead, or a combination?

**Response:**
<!-- Add your answer here -->

Keep it flexible right now.

---

## Technical & UX

### Q17. Frontend framework preference
React, Vue, Next.js, or no preference?

**Response:**
<!-- Add your answer here -->
Make it React, I think here I can do code in React well.  You can suggest to me if you have any preference. I want to keep UI and API separate.


---

### Q18. Multi-tenancy
Is this single-tenant (one organization) or multi-tenant (multiple organizations with isolated data)?

**Response:**
<!-- Add your answer here -->
It's single tenant right now.


---

### Q19. User registration / provisioning
Who creates users and assigns roles? (Admin-only, self-registration with approval, Segment Owner can add researchers, etc.)

**Response:**
<!-- Add your answer here -->



---

### Q20. SSO / external auth
Any requirements for SSO, Google/Microsoft login, or MFA?

**Response:**
<!-- Add your answer here -->
I will prefer to have Microsoft login as we are on Microsoft to Office 365, but create a sign up and login process. Sign up should not be open to public, only admin people, one super user we have to create, and that can only create a new user.


---

### Q21. Integration with SDR tools
Will SDRs use external tools (dialer, CRM) for calls? Should Spanner integrate with them, or is it standalone?

**Response:**
<!-- Add your answer here -->

No integration required right now.
---

## Approval Flow

### Q22. Company approval authority
Who approves companies: SDR only, Approver only, or both (either can approve)?

**Response:**
<!-- Add your answer here -->
Create a module to approve companies, we can grant access to relevant role who can approve the companies. It may be a approver or SDR or whosoever is registered on into the system.


---

### Q23. Contact approval authority
Same question for contacts — who approves?

**Response:**
<!-- Add your answer here -->
As said above, create a module and we can we can grant access to the module to the user.


---

### Q24. Approval sequence
Must companies be approved before contacts can be researched/uploaded, or can both flows run in parallel?

**Response:**
<!-- Add your answer here -->
Close can run in parallel.


---

## Data & Audit

### Q25. Edit/delete after import
Once data is imported, can contacts/companies be edited or deleted? By whom? (Researcher, Approver, SDR, Admin?)

**Response:**
<!-- Add your answer here -->
No, we don't need this right now.


---

### Q26. Audit logging depth
How detailed should audit logs be? (Every field change with before/after, or just "created/updated/deleted by X at time Y"?)

**Response:**
<!-- Add your answer here -->
Create the logs who did what

---
---

# Round 2 — Review Feedback Questions (2026-02-14)

> These questions come from the full review of all Spanner documents. Please add your responses below each item.

---

## Critical Gaps

### Q27. How do companies enter the system?
The CSV upload is for **contacts**. But there is no spec for how companies are created. How do researchers add companies?

Options:
- (a) Manual form — researcher adds one company at a time (Company Name, Website, Industry, etc.)
- (b) Separate company CSV upload — bulk upload with a different schema
- (c) Both form and CSV
- (d) Something else


Also: what fields define a Company entity? (e.g., Company Name, Website, Industry, Sub-Industry, Address, LinkedIn URL, Founded Year, Revenue Range, Employee Size Range, Description, Phone)

**Response:**
<!-- Add your answer here -->
Both forms and CSV.
You can refer the fields from the fields list I shared in the requirements.Make your own best judgments.


---

### Q28. Task Assignment — is it a separate module or same as Segment Assignment?
You mentioned Approvers assign tasks to junior researchers. Is this:

- (a) The same as assigning a segment to a researcher (already in Section 5.3) — "work on Segment X"
- (b) More granular — e.g., "Research contacts for Company Y in Segment X" (a separate task entity with title, assignee, status, due date)
- (c) Just the company approval workflow (Approve/Reject with assignments happening implicitly)

If (b), what fields should a task have?

**Response:**
<!-- Add your answer here -->
you are getting this wrong, so there is no task assignment. it is like we have to assign the segment to the researchers. Then we have to assign this the companies to the researchers and we have to assign context to the SDRs.

Let's keep the assignment things open as of now. Example a user can assign the segment to another user and these assignment modules we can control from the module access list. I have seen such systems of assignments, role space things in Drupal very well. So I believe you can take inspiration from there.


---

### Q29. Database engine
Which database do you want to use?

- (a) PostgreSQL — recommended; relational, mature, JSON support for flexible fields
- (b) MySQL
- (c) SQLite (dev only)
- (d) Other — specify

**Response:**
<!-- Add your answer here -->

Postry is is fine.

---

## Inconsistencies to Confirm

### Q30. Parallel approval — what did you mean?
The requirements say "approval flows can run in parallel" but contacts require an **approved** company. Did you mean:

- (a) You don't need ALL companies approved before starting contact research — as soon as Company A is approved, researchers can upload contacts for Company A while Company B is still pending
- (b) Company and contact research can truly happen at the same time, independently

**Response:**
<!-- Add your answer here -->
Option A is more relevant in this. so take an example let's say I'm a researcher and I'm I find a company and at the same time I find the contact of the company as well. So my I believe my Excel format is same for both company and for contact. So we may split this in future but for now let's keep that as a thing. Or you can suggest me something.


---

### Q31. Segment Name in CSV — derive or require?
Each contact row in the CSV has a Segment Name field. But if the contact belongs to an approved company, and the company already belongs to a segment, should we:

- (a) Require Segment Name in CSV and validate it matches the company's segment
- (b) Derive Segment Name from the company (remove from CSV required fields)
- (c) Keep it as-is — allow researcher to specify even if it might differ from the company's segment

**Response:**
<!-- Add your answer here -->
Since the c there is no current system and this team is relying on CSV formats for sharing data. maybe since we are creating a system for them, we can create multiple C S V formats for these guys. So you can make your own judgments here and suggest me the solution. If you have further questions, please log those questions in open questions.


---

### Q32. Researcher Name column in CSV
The Researcher Name column is currently "Ignored — system records uploader." Should the column:

- (a) Still be required in the CSV header (but value ignored)
- (b) Be removed from the required schema entirely (optional if present, always ignored)

**Response:**
<!-- Add your answer here -->
We can keep the logged in person name while uploading the CSV against each record.


---

## Clarifications

### Q33. User provisioning — admin UI
Q19 was left blank earlier. Q20 confirmed: admin/super-user creates users. For implementation:

- Does the admin need a full User Management module? (list users, create, edit roles, deactivate)
- Or just a simple "create user" form?

**Response:**
<!-- Add your answer here -->

We need the full functionality here.

---

### Q34. Company entity — fields and status
When a company is added (however it enters the system), what statuses should it have?

- (a) Pending → Approved / Rejected (simple)
- (b) Pending → Under Review → Approved / Rejected (with intermediate state)
- (c) Other — specify

And should rejected companies be re-submittable?

**Response:**
<!-- Add your answer here -->
Yes. Companies can be resubmitted.


---

### Q35. Contact entity — statuses
Once a contact is uploaded and approved, what statuses apply?

- (a) Uploaded → Approved (simple)
- (b) Uploaded → Approved → Meeting Scheduled → Contacted (pipeline)
- (c) Other — specify

**Response:**
<!-- Add your answer here -->
I think it is uploaded approved meeting scheduled and before meeting scheduled it's assigned to SDR and then Yeah


---

### Q36. Offerings entity — is it shared or per-segment?
When a Segment Owner adds an offering (e.g., "Cloud Migration"), and another segment also uses "Cloud Migration":

- (a) They share the same offering record (global offerings table, many-to-many with segments)
- (b) Each segment has its own copy (offerings are segment-scoped)

**Response:**
<!-- Add your answer here -->
I think we can create the offerings as a master list and create a mapping table for the segment versus segment two offerings mapping. Okay, so that this can help us in do not make duplicate copies of the offerings.


---

### Q37. Segment status
Can a segment be deactivated or archived? Or once created, it stays active forever?

**Response:**
<!-- Add your answer here -->
Yes, we can archive a segment. 


---

### Q38. Company rejection — what happens next?
When a company is rejected with a reason:

- (a) It's gone — cannot be re-submitted
- (b) Researcher can edit and re-submit for approval
- (c) It stays in the list as "Rejected" for reference only

**Response:**
<!-- Add your answer here -->

It stayed in the list as rejected for reference only.

---
---

# Round 3 — Product Manager Review (2026-02-14)

> Gaps found during PM review of requirements v2.0. Please add your responses below each item.

---

## User Journeys

### Q39. Approval Queue — where do Approvers/SDRs review pending items?
Researchers have a Workbench. But when an Approver logs in and needs to approve companies, where do they go? Same for SDRs reviewing contacts.

Do we need an **Approval Queue** module — a filtered view showing:
- Pending companies (for company approvers)
- Uploaded contacts (for contact approvers)

**Response:**
<!-- Add your answer here -->
Yeah, you are right. We should consider this.


---

### Q40. SDR Workbench — where do SDRs work?
Once contacts are "Assigned to SDR," where does the SDR see them? How do they mark "Meeting Scheduled"?

Do we need an **SDR Workbench** — showing:
- Contacts assigned to me (by status)
- Action to change status (e.g., "Schedule Meeting")

**Response:**
<!-- Add your answer here -->
we will update these requirements later on, but make it a open requirement.


---

### Q41. "My Submissions" — can researchers see their own pending/rejected companies?
The Researcher Workbench shows assigned segments and approved companies. But if a researcher submitted 20 companies and 5 were rejected, where do they see that?

Do we need a **"My Submissions"** view showing companies the researcher uploaded, filterable by status?

**Response:**
<!-- Add your answer here -->
They should have a view for uploaded companies and uploaded contracts with the required filters.


---

### Q42. What happens after "Meeting Scheduled"?
The contact pipeline currently ends at "Meeting Scheduled." After the meeting, does the system need to track:
- (a) Meeting outcome (Interested / Not Interested / Follow-up)
- (b) Deal stages (Proposal / Won / Lost)
- (c) Nothing — the pipeline ends at "Meeting Scheduled" for now

**Response:**
<!-- Add your answer here -->
 We are updating this in a another application, CRM application. So we will work on these features later on, mark as a future requirement.


---

### Q43. How does Marketing know a meeting was fixed?
Marketing needs to create personalized content when a meeting is scheduled. But there's no notification or view for this. Options:
- (a) Marketing sees a filtered list: "Contacts with Meeting Scheduled" — they check periodically
- (b) Defer to Teams notification (future phase)
- (c) Other

**Response:**
<!-- Add your answer here -->
We don't need this right now, mark as a feature requirement.


---

## Data Model

### Q44. Can a company belong to multiple segments?
Currently a company links to one segment. But the same company (e.g., "Acme Corp") could be relevant to "Cloud Migration" AND "DevOps Consulting."

Options:
- (a) One company → one segment (if same company fits two segments, create two separate records)
- (b) One company → many segments (many-to-many, like offerings)

**Response:**
<!-- Add your answer here -->
Yeah a company can belong to multiple segments. Also a contact can also belong to multiple segments. 


---

### Q45. Offerings entity — what fields?
The offerings master list needs a definition. Suggested fields:
- Name (required)
- Description (optional)
- Status: Active / Inactive (optional)

Anything else?

**Response:**
<!-- Add your answer here -->
We can work start working you using these.Make your own judgments.


---

## List Views & Navigation

### Q46. Company List View — what should it show?
What columns, filters, and access rules for the company list?

Suggested columns: Company Name, Segment, Status, Industry, Created By, Created At
Suggested filters: by segment, by status, by researcher, by date range

- Who sees what? (Researchers see only their submissions? Approvers see all? Everyone sees all?)

**Response:**
<!-- Add your answer here -->

Instructures can see only their own submissions. Approver can see all submissions.

---

### Q47. Contact List View — what should it show?
Same question for contacts.

Suggested columns: First Name, Last Name, Email, Company, Segment, Status, Assigned SDR
Suggested filters: by company, by segment, by status, by SDR

**Response:**
<!-- Add your answer here -->
Make your own judgments. We need search and filters everywhere.


---

### Q48. Company & Contact Detail Pages
When you click on a company or contact, what do you see? Suggested:
- All entity fields
- Status + status change history
- Activity timeline (from audit log)
- Related records (contacts for a company; company for a contact)
- Available actions (approve, reject, assign, change status)

Is this the right level of detail?

**Response:**
<!-- Add your answer here -->
Detail view, preferably in a pop-up so that person can review. Do make it a make it like this, that a summary view in a pop up and if somebody wants to look into details, so a detailed view in a new page. these days I've seen like in Jira that in a side panel we show the detailed view. So we can consider that.


---

## Edge Cases

### Q49. Duplicate company within the same CSV file
If a Company CSV has "Acme Corp" on row 5 and row 12:
- (a) Create both as separate Pending records (dedup job catches later)
- (b) Reject the duplicate row within the same file during validation
- (c) Import the first, skip the second with a warning

**Response:**
<!-- Add your answer here -->
Study work jobs will catch it later.


---

### Q50. Archived segment — what happens to its companies and contacts?
If a segment is archived after it has companies and contacts:
- (a) Companies and contacts remain accessible but no new ones can be added
- (b) Everything under it is also archived/hidden
- (c) Other

**Response:**
<!-- Add your answer here -->
We don't need this because we would have filters list views and search views.


---

### Q51. Can contacts be rejected?
Companies can be rejected with a reason. Can contacts also be rejected? If so:
- Does rejection require a reason (like companies)?
- Can rejected contacts be re-submitted?

**Response:**
<!-- Add your answer here -->
No contacts cannot be rejected.


---

### Q52. Re-submission rules for rejected companies
Rejected companies can be re-submitted. Clarifications:
- Who can re-submit? (original researcher only? any researcher? approver?)
- Is the rejection history preserved after re-submission?
- Is there a limit on re-submissions?

**Response:**
<!-- Add your answer here -->
 You don't need a resubmission facility at all, I believe.


---

## Non-Functional & Missing Features

### Q53. Expected data volumes
Roughly how many:
- Segments at any time? (10? 50? 500?)
- Companies per segment? (100? 1,000? 10,000?)
- Contacts per company? (5? 20? 50?)

This helps with pagination, search, and indexing decisions.

**Response:**
<!-- Add your answer here -->
At any time we would have 10 to 20 segments, hundred to one thousand companies and five up to five or ten, twenty contacts each company. Typically we would need one or two contacts only per company.


---

### Q54. Export capability
Data comes IN via CSV. Should users be able to EXPORT data? E.g.:
- Export approved companies for a segment
- Export contacts assigned to an SDR
- Export error report from CSV upload (already specified)

**Response:**
<!-- Add your answer here -->
Yes, we would need export functionality as per the access of the data as as per the user.


---

### Q55. Search
Do we need a global search bar (search across companies and contacts by name, email, etc.)? Or is filtering within list views sufficient?

**Response:**
<!-- Add your answer here -->
We don't need global search bar but we need search filters and searches in all the list views.


---

### Q56. Pagination
For list views with many records, do we need:
- (a) Standard pagination (page 1, 2, 3...)
- (b) Infinite scroll
- (c) Your preference

**Response:**
<!-- Add your answer here -->

I think finite scroll is a good one and export with export features.

---
---

# Round 4 — Final PM Review (2026-02-14)

> Final gaps found in requirements v3.0. These are smaller and more focused. Please respond below each item.

---

## Critical (decide before implementation)

### Q57. Company approval scope — global or per-segment?
A company can belong to multiple segments. But status (Pending/Approved/Rejected) is a single field.

**Scenario A:** "Acme Corp" approved for Segment A. Later uploaded for Segment B. Is it auto-approved for B?

**Scenario B:** "Acme Corp" rejected for Segment A. Later uploaded for Segment B. It's stuck as Rejected — no re-submission. Segment B can never use it.

Options:
- (a) **Global approval** — once approved, approved for all segments. Simple, less control.
- (b) **Per-segment approval** — status lives on the `company_segments` mapping. Each segment pairing has its own Pending/Approved/Rejected status. More control, more complex.

**Response:**
<!-- Add your answer here -->
We can have duplicate records for companies each segment.


---

### Q58. Segment Owner visibility — can they see companies/contacts under their segments?
Currently Segment Owners can only see the Segment List (read-only). They have no view into companies or contacts.

Should Segment Owners have **read access** to company and contact lists, filtered to their own segments? (No approval actions, just visibility.)

**Response:**
<!-- Add your answer here -->
We should have one common screen with the for contacts and another screen for segments and another screen for companies when we and we should have filters on all these list views.


---

## Clarifications

### Q59. Error Correction vs. "No edit" — explicit distinction
Section 12.1 says "no edit or delete of imported data." Error Correction Module lets users "correct entries in-app."

These aren't contradictory — Error Correction is for **rows that failed validation and were never imported**. But this should be explicit.

Confirm: Error Correction applies only to failed/invalid rows, not to successfully imported records?

**Response:**
<!-- Add your answer here -->

We are not creating the edit module as of now. Just create the basic edit screen in the detailed view if required.

---

### Q60. No in-app notifications in phase 1 — acknowledged?
Without Teams (future) and no in-app notifications:
- Approvers must manually check the Approval Queue
- Researchers must manually check My Uploads for status changes
- SDRs must manually check for new assigned contacts

Is this acceptable for phase 1?

**Response:**
<!-- Add your answer here -->
Yes.


---

### Q61. Duplicate-flagged records — what's the workflow?
The dedup job flags records with `is_duplicate`. After flagging:
- (a) Someone reviews flagged records and manually merges or dismisses — need a "Duplicates" view
- (b) Just filter them out in list views; no active workflow needed
- (c) Other

**Response:**
<!-- Add your answer here -->
We can have the filters in all the screens in the list views with the active and disactive deactive and by default we will not show the deactive recall, deactivated recalls, deactivated or duplicated recalls.


---

### Q62. Offerings management — standalone screen?
Offerings can be created via segment autocomplete. But:
- Is there a standalone Offerings management screen? (list, edit, deactivate)
- Or only managed through segment editing?
- Who can deactivate an offering?

**Response:**
<!-- Add your answer here -->
Only managed through the segment editing screen.


