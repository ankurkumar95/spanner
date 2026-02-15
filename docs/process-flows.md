# Spanner — Process Flows

**Document Version:** 1.0  
**Last Updated:** 2026-02-14  
**Source:** `requirements.md` v3.1

---

## 1. End-to-End Business Flow

The complete lifecycle from segment planning to SDR outreach.

```mermaid
flowchart TD
    Start([Start]) --> CreateSegment["1. Segment Owner creates Segment\n- Name, Description, Offerings"]
    CreateSegment --> AssignSegment["2. Assign Segment\n- To Researcher(s)\n- To SDR(s)"]
    AssignSegment --> CompanyResearch["3. Researcher finds Companies\n- Via form (single)\n- Via CSV upload (bulk)"]
    CompanyResearch --> CompanyPending["Companies enter as 'Pending'\nOne record per segment"]
    CompanyPending --> ApprovalQueue["4. Approval Queue\n- Approver reviews each company individually"]
    ApprovalQueue --> Decision{Approve or Reject?}
    Decision -->|Approve| CompanyApproved["Company status = 'Approved'"]
    Decision -->|Reject| CompanyRejected["Company status = 'Rejected'\n- Mandatory reason\n- No re-submission"]
    CompanyApproved --> ContactResearch["5. Researcher finds Contacts\nfor approved companies\n- Via form (single)\n- Via CSV upload (bulk)"]
    ContactResearch --> ContactUploaded["Contacts enter as 'Uploaded'\nSegment derived from company"]
    ContactUploaded --> ContactApproval["6. Contact Approval\n- Bulk approval allowed\n- No rejection for contacts"]
    ContactApproval --> ContactApproved["Contact status = 'Approved'"]
    ContactApproved --> AssignSDR["7. Assign Contacts to SDR"]
    AssignSDR --> ContactAssigned["Contact status = 'Assigned to SDR'"]
    ContactAssigned --> SDROutreach["8. SDR sets up meetings/calls"]
    SDROutreach --> MeetingScheduled["Contact status = 'Meeting Scheduled'"]
    MeetingScheduled --> Marketing["9. Marketing creates collateral\n- Links per segment/offerings"]
    Marketing --> Future(["10. Post-meeting outcomes\n(Future — separate CRM)"])

    CompanyRejected --> EndRejected([Record stays for reference])
```

---

## 2. CSV Upload & Validation Pipeline

Applies to both Company CSV and Contact CSV uploads.

```mermaid
flowchart TD
    Upload([User uploads CSV file]) --> AuthCheck{User authenticated\nand authorized?}
    AuthCheck -->|No| Reject401["401/403 — Unauthorized"]
    AuthCheck -->|Yes| CreateBatch["Create upload_batch record\n- Generate batch ID\n- Record file name, size, uploader"]

    CreateBatch --> FileCheck{File checks}
    FileCheck --> ExtCheck{Extension = .csv?}
    ExtCheck -->|No| RejectFile["Reject: invalid file type"]
    ExtCheck -->|Yes| SizeCheck{Size <= 10MB?}
    SizeCheck -->|No| RejectFile2["Reject: file too large"]
    SizeCheck -->|Yes| EncodingCheck{UTF-8 encoding?}
    EncodingCheck -->|No| RejectFile3["Reject: invalid encoding"]
    EncodingCheck -->|Yes| EmptyCheck{Has data rows\nbeyond header?}
    EmptyCheck -->|No| RejectFile4["Reject: empty or header-only"]
    EmptyCheck -->|Yes| HeaderValidation

    subgraph header_validation [Header Validation]
        HeaderValidation["Parse header row\nCase-insensitive matching"]
        HeaderValidation --> RequiredCheck{All required\ncolumns present?}
        RequiredCheck -->|No| RejectHeader["Reject: list missing columns"]
        RequiredCheck -->|Yes| IgnoreExtra["Ignore extra columns\nMap by header name"]
    end

    IgnoreExtra --> RowValidation

    subgraph row_validation [Row-Level Validation]
        RowValidation["For each row:"]
        RowValidation --> ValidateFields["- Required fields non-empty\n- Email format (RFC 5322)\n- URL format\n- Max length checks\n- Founded year range"]
        ValidateFields --> LookupCheck["- Segment Name exists (active)\n- Company Name exists (approved)\n  (contact CSV only)"]
        LookupCheck --> RowResult{Row valid?}
        RowResult -->|Yes| ValidPool["Add to valid rows pool"]
        RowResult -->|No| ErrorPool["Add to error pool\n- Row #, column, value, message"]
    end

    ValidPool --> Import["Import valid rows to DB\n- Status = Pending (company)\n- Status = Uploaded (contact)\n- created_by = uploader\n- batch_id = this batch"]
    ErrorPool --> ErrorStore["Store errors in upload_errors table"]
    ErrorStore --> UpdateBatch["Update batch record\n- valid_rows, invalid_rows\n- status = completed"]
    Import --> UpdateBatch

    UpdateBatch --> AuditLog["Write audit log entry"]
    AuditLog --> Response["Return response\n- Batch ID\n- Valid/invalid counts\n- Error report download link"]

    Response --> HasErrors{Invalid rows exist?}
    HasErrors -->|Yes| ErrorCorrection["Error Correction Module\n- View failed rows\n- Download error report\n- Re-upload corrected CSV"]
    HasErrors -->|No| Done([Upload complete])
    ErrorCorrection -->|Re-upload| Upload
```

---

## 3. Company Approval Workflow

```mermaid
flowchart TD
    Start([Company enters system]) --> Pending["Status: Pending"]
    Pending --> Queue["Appears in Approval Queue\nFiltered by segment, researcher, date"]
    Queue --> ApproverReviews["Approver reviews company\n- Detail panel: all fields,\n  segment, researcher, upload batch"]

    ApproverReviews --> Decision{Decision}

    Decision -->|Approve| Approve["Set status = Approved"]
    Approve --> AuditApprove["Audit log: approve action\n- Actor, company, timestamp"]
    AuditApprove --> VisibleForContacts["Company visible in\nResearcher Workbench\nfor contact research"]
    VisibleForContacts --> Done([Continue to contact research])

    Decision -->|Reject| RejectReason["Enter rejection reason\n(mandatory)"]
    RejectReason --> Reject["Set status = Rejected\nStore rejection_reason"]
    Reject --> AuditReject["Audit log: reject action\n- Actor, company, reason, timestamp"]
    AuditReject --> NoResubmit["Record stays for reference\nNO re-submission allowed"]
    NoResubmit --> EndReject([Rejected permanently])

    Note1["NOTE: Individual approval only\nNo bulk approve for companies"]
```

---

## 4. Contact Status Pipeline

```mermaid
flowchart LR
    Uploaded["Uploaded\n(initial)"] -->|"Approval Queue\n(bulk allowed)"| Approved["Approved"]
    Approved -->|"Assignment\n(Approver assigns)"| AssignedSDR["Assigned to SDR"]
    AssignedSDR -->|"SDR action"| MeetingScheduled["Meeting Scheduled"]
    MeetingScheduled -.->|"Future"| PostMeeting(["Post-meeting\noutcomes"])
```

### Contact Pipeline — Detailed

```mermaid
flowchart TD
    Entry([Contact enters via form or CSV]) --> Uploaded["Status: Uploaded"]
    Uploaded --> ContactQueue["Appears in Approval Queue\n(Uploaded Contacts tab)"]
    ContactQueue --> BulkApprove["Approver selects contacts\nBulk approval allowed\nNo rejection for contacts"]
    BulkApprove --> Approved["Status: Approved"]
    Approved --> AssignAction["Approver assigns to SDR\n(grant-based access)"]
    AssignAction --> Assigned["Status: Assigned to SDR\nassigned_sdr_id set"]
    Assigned --> SDRWorkbench["SDR sees contact in workbench\nViews collateral links"]
    SDRWorkbench --> ScheduleMeeting["SDR schedules meeting/call"]
    ScheduleMeeting --> MeetingScheduled["Status: Meeting Scheduled"]
    MeetingScheduled --> Future(["Post-meeting outcomes\n(Future scope)"])
```

---

## 5. Company Status State Diagram

```mermaid
stateDiagram-v2
    [*] --> Pending : Company created (form or CSV)
    Pending --> Approved : Approver approves (individual)
    Pending --> Rejected : Approver rejects (with reason)
    Rejected --> [*] : Final state (no re-submission)
    Approved --> [*] : Available for contact research
```

---

## 6. Contact Status State Diagram

```mermaid
stateDiagram-v2
    [*] --> Uploaded : Contact created (form or CSV)
    Uploaded --> Approved : Approved (bulk allowed)
    Approved --> AssignedToSDR : Assigned to SDR
    AssignedToSDR --> MeetingScheduled : SDR schedules meeting
    MeetingScheduled --> [*] : Post-meeting (future)
```

---

## 7. Assignment Flow

```mermaid
flowchart TD
    subgraph segment_assignment [Segment Assignment]
        SO["Segment Owner"] -->|"assigns"| SegToRes["Segment → Researcher(s)"]
        SO -->|"assigns"| SegToSDR["Segment → SDR(s)"]
        APP["Approver"] -->|"can also assign"| SegToRes
    end

    subgraph company_assignment [Company Assignment]
        APP2["Approver"] -->|"assigns"| CompToRes["Company → Researcher\n(for contact research)"]
    end

    subgraph contact_assignment [Contact Assignment]
        APP3["Approver"] -->|"assigns (grant-based)"| ConToSDR["Contact → SDR\n(for outreach)"]
    end

    SegToRes --> ResearcherWorkbench["Researcher sees\nassigned segments\nin Workbench"]
    CompToRes --> ResearcherWorkbench
    SegToSDR --> SDRWorkbench["SDR sees assigned\nsegments/contacts"]
    ConToSDR --> SDRWorkbench
```

---

## 8. Duplicate Detection Flow

```mermaid
flowchart TD
    Scheduler([Scheduled Job — weekly]) --> FetchCompanies["Fetch companies\nGROUP BY name, website, segment_id\nHAVING count > 1"]
    FetchCompanies --> FlagCompanies["Set is_duplicate = true\nfor duplicate companies\n(within same segment only)"]

    Scheduler --> FetchContacts["Fetch contacts\nGROUP BY email, company_id\nHAVING count > 1"]
    FetchContacts --> FlagContacts["Set is_duplicate = true\nfor duplicate contacts"]

    FlagCompanies --> AuditLog["Write audit log entries"]
    FlagContacts --> AuditLog
    AuditLog --> Done([Job complete])

    Note1["NOTE:\n- Cross-segment company duplicates\n  are INTENTIONAL — not flagged\n- No merge/delete — flag only\n- List views hide duplicates by default"]
```

---

## 9. User Authentication Flow

```mermaid
sequenceDiagram
    participant User as Browser
    participant API as FastAPI
    participant DB as PostgreSQL

    rect rgb(240, 240, 240)
        Note over User, DB: Login Flow
        User->>API: POST /api/auth/login {email, password}
        API->>DB: SELECT user WHERE email = ?
        DB-->>API: user record
        API->>API: bcrypt.verify(password, hash)
        alt Valid credentials
            API->>API: Generate JWT tokens
            API-->>User: 200 {access_token, refresh_token}
        else Invalid
            API-->>User: 401 Unauthorized
        end
    end

    rect rgb(240, 240, 240)
        Note over User, DB: Authenticated Request
        User->>API: GET /api/companies (Bearer token)
        API->>API: Decode JWT (Auth Middleware)
        API->>API: Check role permissions (RBAC Middleware)
        alt Authorized
            API->>DB: Query companies
            DB-->>API: Results
            API-->>User: 200 {data}
        else Forbidden
            API-->>User: 403 Forbidden
        end
    end

    rect rgb(240, 240, 240)
        Note over User, DB: Token Refresh
        User->>API: POST /api/auth/refresh {refresh_token}
        API->>API: Validate refresh token
        API->>API: Generate new access token
        API-->>User: 200 {access_token}
    end
```

---

## 10. Researcher Workbench Flow

```mermaid
flowchart TD
    Login([Researcher logs in]) --> Workbench["Researcher Workbench"]
    Workbench --> MySegments["My Segments\n(assigned segments list)"]
    MySegments --> SelectSegment["Select a segment"]
    SelectSegment --> ApprovedCompanies["View approved companies\nin this segment"]
    ApprovedCompanies --> AddContact{Add contacts?}

    AddContact -->|"Single"| ContactForm["Create contact via form\nFor one approved company"]
    AddContact -->|"Bulk"| ContactCSV["Upload contact CSV\nFor approved companies"]

    ContactForm --> ContactCreated["Contact created\nStatus: Uploaded"]
    ContactCSV --> CSVPipeline["CSV validation pipeline\n(see Section 2)"]
    CSVPipeline --> ContactCreated

    Workbench --> MyUploads["My Uploads\n(companies + contacts by status)"]
    MyUploads --> FilterByStatus["Filter: Pending, Approved,\nRejected, Uploaded, etc."]
