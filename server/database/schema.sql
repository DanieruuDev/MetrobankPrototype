
-- CREATE TABLE Workflow (
--     Workflow_ID VARCHAR PRIMARY KEY,
--     Document_ID INT NOT NULL,
--     Requester_ID INT NOT NULL,
--     Title VARCHAR(255) NOT NULL,
--     Due_Date TIMESTAMP,
--     Completed_at TIMESTAMP,
--     Request_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     Status VARCHAR(50) CHECK (Status IN ('PENDING', 'APPROVED', 'REJECTED', 'OVER_DUE')) NOT NULL DEFAULT 'PENDING',
--     Current_Approver INT,
--     CONSTRAINT fk_document FOREIGN KEY (Document_ID) REFERENCES Document(Document_ID) ON DELETE CASCADE,
--     CONSTRAINT fk_author FOREIGN KEY (Requester_ID) REFERENCES Admin(Admin_ID) ON DELETE SET NULL
-- );


-- CREATE TABLE Approver (
--     Approver_ID VARCHAR PRIMARY KEY,
--     User_ID INT NOT NULL,
--     Workflow_ID INT NOT NULL,
--     Approver_Order INT NOT NULL,
--     Status VARCHAR(50) CHECK (Status IN ('PENDING', 'CURRENT', 'REPLACED', 'MISSED', 'DONE')),
--     Due_Date DATE,
--     Is_Reassigned BOOLEAN DEFAULT FALSE,

--     CONSTRAINT fk_user FOREIGN KEY (User_ID) REFERENCES Admin(Admin_ID) ON DELETE SET NULL,
--     CONSTRAINT fk_workflow FOREIGN KEY (Workflow_ID) REFERENCES Workflow(Workflow_ID) ON DELETE CASCADE
-- );

-- CREATE TABLE Approver_Response (
--     Response_ID VARCHAR PRIMARY KEY,
--     Approver_ID INT REFERENCES Approver(Approver_ID) ON DELETE CASCADE,
--     Response VARCHAR(50) CHECK (Response IN ('APPROVE', 'REJECT')),
--     Comment TEXT,
--     Response_Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     Update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE Reassignment_Log (
--     ReLog_ID VARCHAR PRIMARY KEY,
--     Workflow_ID INT REFERENCES Workflow(Workflow_ID) ON DELETE CASCADE,
--     Old_Approver_ID INT REFERENCES Approver(Approver_ID) ON DELETE CASCADE,
--     New_Approver_ID INT REFERENCES Approver(Approver_ID) ON DELETE CASCADE,
--     Reason TEXT,
--     Reassigned_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );


-- CREATE TABLE Workflow_Log (
--     Log_ID VARCHAR PRIMARY KEY,
--     Workflow_ID INT NOT NULL,
--     Approver_ID INT NOT NULL,
--     Action VARCHAR(255) NOT NULL,
--     Comments TEXT,
--     Old_Status VARCHAR(100),
--     New_Status VARCHAR(100),
--     Changed_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

--     CONSTRAINT fk_workflow FOREIGN KEY (Workflow_ID) REFERENCES Workflow(Workflow_ID) ON DELETE CASCADE,
--     CONSTRAINT fk_approver FOREIGN KEY (Approver_ID) REFERENCES Approver(Approver_ID) ON DELETE SET NULL
-- );




/*vIEW*/
-- CREATE VIEW vw_approval_workflows AS
-- SELECT 
--     w.workflow_id,
--     w.author_id,
--     w.title,
--     d.document_name,
--     d.doc_type,
--     d.size,
--     w.request_date AS date_of_creation,
--     w.due_date AS date_of_deadline,
--     w.status,
--     a.name AS current_approver,
--     json_agg(json_build_object(
--         'name', ad.name,
--         'duration', ap.due_date,
--         'status', ap.status
--     )) AS approvers
-- FROM workflow w
-- JOIN document d ON w.document_id = d.document_id
-- LEFT JOIN admin a ON w.current_approver = a.admin_id
-- LEFT JOIN approver ap ON w.workflow_id = ap.workflow_id
-- LEFT JOIN admin ad ON ap.user_id = ad.admin_id
-- GROUP BY w.workflow_id, w.author_id, w.title, d.document_name, d.doc_type, d.size, 
--          w.request_date, w.due_date, w.status, a.name;


-- CREATE VIEW vw_Approval_Workflow AS
-- SELECT 
--     w.Workflow_ID,
--     w.Author_ID,
--     a.Name AS Author_Name,
--     w.Title,
--     d.Document_Name,
--     d.Doc_Type,
--     d.Path AS Document_Path,
--     d.size AS Document_Size,
--     w.Request_Date AS Date_of_Creation,
--     w.Due_Date AS Date_of_Deadline,
--     w.Status,
--     ca.Admin_ID AS Current_Approver_ID,
--     ca.Name AS Current_Approver_Name,
--     ap.Approver_ID,
--     ap.Approver_Order,
--     ap.Status AS Approver_Status,
--     ap.Due_Date AS Approver_Due_Date
-- FROM Workflow w
-- JOIN Document d ON w.Document_ID = d.Document_ID
-- JOIN Admin a ON w.Author_ID = a.Admin_ID
-- LEFT JOIN Approver ap ON w.Workflow_ID = ap.Workflow_ID
-- LEFT JOIN Admin ca ON w.Current_Approver = ca.Admin_ID
-- ORDER BY w.Workflow_ID, ap.Approver_Order;


CREATE TABLE "user" (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

/*Possible change in document cascade deletion*/
CREATE TABLE request_type_maintenance (
    rq_type_id VARCHAR PRIMARY KEY,
    rq_title VARCHAR NOT NULL
);

-- Table for Documents
CREATE TABLE document (
    doc_id SERIAL PRIMARY KEY,
    doc_name VARCHAR NOT NULL,
    doc_type VARCHAR NOT NULL,
    path VARCHAR NOT NULL,
    size INT NOT NULL,
    upload_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Workflows
CREATE TABLE workflow (
    workflow_id SERIAL PRIMARY KEY,
    document_id INT,
    requester_id INT NOT NULL,
    rq_type_id VARCHAR(50), 
    school_year VARCHAR(15) NOT NULL, 
    semester VARCHAR(15) NOT NULL,
    scholar_level VARCHAR(15) NOT NULL,
    status VARCHAR(15) NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'On Progress', 'Completed')),
    due_date DATE NOT NULL,
    completed_at DATE,
    rq_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(255), 
    CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES document(doc_id) ON DELETE CASCADE,
    CONSTRAINT fk_request_type FOREIGN KEY (rq_type_id) REFERENCES request_type_maintenance(rq_type_id) ON DELETE SET NULL
);
-- Table for Workflow Approvers
CREATE TABLE wf_approver (
    approver_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    user_email VARCHAR NOT NULL,
    workflow_id INT NOT NULL,
    approver_order INT NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    status VARCHAR NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Missed', 'Replaced')),
    due_date DATE NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  
    is_reassigned BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_workflow FOREIGN KEY (workflow_id) REFERENCES workflow(workflow_id) ON DELETE CASCADE,
    CONSTRAINT unique_approver_per_workflow UNIQUE (workflow_id, user_id)  -- Prevents duplicate approvers per workflow
);
-- Table for Approver Responses
CREATE TABLE approver_response (
    response_id SERIAL PRIMARY KEY,
    approver_id INT,
    response VARCHAR NOT NULL DEFAULT 'Pending' CHECK (response IN ('Pending', 'Approved', 'Reject')),
    comment TEXT,
    response_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- No ON UPDATE here
    CONSTRAINT fk_approver FOREIGN KEY (approver_id) REFERENCES wf_approver(approver_id) ON DELETE CASCADE
);

-- workflow_display_view
CREATE OR REPLACE VIEW vw_wf_full_detail AS
SELECT 
    w.workflow_id,
    u.user_id AS requester_id,
    u.email AS requester_email,
    rtm.rq_title,
    w.description AS rq_description, -- ✅ Using workflow.description as rq_description
    w.school_year, 
    w.semester,  
    w.scholar_level, 
    w.due_date,
    w.status,
    d.doc_id, 
    d.doc_name,
    d.doc_type,
    d.path AS doc_path,
    d.size AS doc_size,
    d.upload_at AS doc_uploaded_at,
    COALESCE(
        json_agg(
            json_build_object(
                'approver_id', wa.approver_id,
                'approver_email', wa.user_email,
                'approver_status', wa.status,
                'approver_due_date', wa.due_date,
                'approver_assigned_at', wa.assigned_at,
                'approver_order', wa.approver_order,
                'response_id', ar.response_id,
                'response', ar.response,
                'comment', ar.comment,
                'response_time', ar.response_time,
                'response_updated_at', ar.updated_at,
                'is_current', wa.is_current
            ) 
        ) FILTER (WHERE wa.approver_id IS NOT NULL), 
        '[]'::json
    ) AS approvers
FROM workflow w
LEFT JOIN "user" u ON w.requester_id = u.user_id
LEFT JOIN request_type_maintenance rtm ON w.rq_type_id = rtm.rq_type_id
LEFT JOIN document d ON w.document_id = d.doc_id
LEFT JOIN wf_approver wa ON w.workflow_id = wa.workflow_id
LEFT JOIN approver_response ar ON wa.approver_id = ar.approver_id
GROUP BY 
    w.workflow_id, u.user_id, u.email, 
    rtm.rq_title, 
    w.description, -- ✅ Grouping by workflow.description
    w.due_date, w.status, 
    w.school_year, w.semester, w.scholar_level, 
    d.doc_id, d.doc_name, d.doc_type, d.path, d.size, d.upload_at;

-- approver_detailed_view
-- to add comment and descriptions here
CREATE VIEW vw_approver_detailed AS
SELECT wa.approver_id,
    wa.user_id,
    wa.user_email,
    wa.workflow_id,
    wa.approver_order,
    wa.status AS approver_status,
    w.status AS workflow_status,
    w.description,
    wa.due_date AS approver_due_date,
    wa.assigned_at,
    wa.is_reassigned,
    w.requester_id,
    (requester.first_name::text || ' '::text) || requester.last_name::text AS requester_name,
    requester.role AS requester_role,
    w.rq_date AS date_started,
    w.due_date,
    w.school_year,
    w.scholar_level AS year_level,
    w.semester,
    rtm.rq_title AS request_title,
    d.doc_id,
    d.doc_name,
    d.doc_type,
    d.path AS file_path,
    d.size AS file_size,
    d.upload_at AS document_uploaded_at,
    ar.response AS approver_response,
    ar.comment AS approver_comment,
    ar.response_time
   FROM wf_approver wa
     JOIN workflow w ON wa.workflow_id = w.workflow_id
     LEFT JOIN request_type_maintenance rtm ON w.rq_type_id::text = rtm.rq_type_id::text
     LEFT JOIN document d ON w.document_id = d.doc_id
     LEFT JOIN approver_response ar ON wa.approver_id = ar.approver_id
     LEFT JOIN "user" requester ON w.requester_id = requester.user_id;
-- approver_workflows
CREATE VIEW vw_approver_workflows AS
SELECT wa.user_id,
    wa.approver_id,
    rt.rq_title AS request_title,
    wa.status AS approver_status,
    concat(u.first_name, ' ', u.last_name) AS requester,
    wf.rq_date AS date_started,
    wa.due_date AS approver_due_date,
    wf.school_year,
    wf.scholar_level AS year_level,
    wf.semester
   FROM wf_approver wa
     JOIN workflow wf ON wa.workflow_id = wf.workflow_id
     JOIN request_type_maintenance rt ON wf.rq_type_id::text = rt.rq_type_id::text
     JOIN "user" u ON wf.requester_id = u.user_id;

CREATE VIEW vw_approver_requests AS
SELECT 
    wa.user_id,
    w.workflow_id,
    rt.rq_title AS request_title,
    w.status,
    u.requester_name AS requester,
    w.rq_date AS date_started,
    w.due_date,
    w.school_year,
    w.scholar_level AS year_level,
    w.semester
FROM wf_approver wa
JOIN workflow w ON wa.workflow_id = w.workflow_id
JOIN request_type_maintenance rt ON w.rq_type_id = rt.rq_type_id
JOIN "user" u ON w.requester_id = u.user_id;



CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_timestamp
BEFORE UPDATE ON approver_response
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Table for Reassignment Logs
CREATE TABLE reassignment_log (
    relog_id SERIAL PRIMARY KEY,
    workflow_id INT,
    old_approver_id INT,
    new_approver_id INT,
    reason TEXT NOT NULL,
    reassigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reassign_workflow FOREIGN KEY (workflow_id) REFERENCES workflow(workflow_id) ON DELETE CASCADE,
    CONSTRAINT fk_old_approver FOREIGN KEY (old_approver_id) REFERENCES wf_approver(approver_id) ON DELETE SET NULL,
    CONSTRAINT fk_new_approver FOREIGN KEY (new_approver_id) REFERENCES "user"(user_id) ON DELETE SET NULL
);

-- Table for Workflow Logs
CREATE TABLE workflow_log (
    log_id SERIAL PRIMARY KEY,
    workflow_id INT,
    approver_id INT,
    action VARCHAR NOT NULL,
    comments TEXT,
    old_status VARCHAR NOT NULL,
    new_status VARCHAR NOT NULL,
    change_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_workflow FOREIGN KEY (workflow_id) REFERENCES workflow(workflow_id) ON DELETE CASCADE,
    CONSTRAINT fk_log_approver FOREIGN KEY (approver_id) REFERENCES wf_approver(approver_id) ON DELETE CASCADE
);





-- For mock data
CREATE TABLE masterlist (
    student_id SERIAL PRIMARY KEY,
    scholar_name VARCHAR(255) NOT NULL,
    yr_lvl_code SMALLINT NOT NULL, --added
    school_year_code INT NOT NULL, --added
    semester_code SMALLINT NOT NULL, --added
    batch_code INT NOT NULL, 
    scholarship_status VARCHAR(20) NOT NULL,
    course VARCHAR(100) NOT NULL,
    campus VARCHAR(50) NOT NULL, -- to be change into campus code
    school_email VARCHAR(100) NOT NULL,
    secondary_email VARCHAR(100),
    contact_number CHAR(11), -- Fixed length for PH numbers
    internship_year SMALLINT, -- Use SMALLINT instead of YEAR (PostgreSQL doesn't have YEAR type)
    graduation_year SMALLINT,
    delistment_date DATE,
    delistment_reason TEXT,
    termination_notice_status VARCHAR(20),
    other_comments TEXT,
    absorbed BOOLEAN DEFAULT FALSE,
    hire_date DATE
);

CREATE TABLE batch_maintenance (
    batch_code SERIAL PRIMARY KEY,
    batch_number VARCHAR(50) NOT NULL,
    graduation_sy VARCHAR(20) NOT NULL
);

CREATE TABLE yr_lvl_maintenance (
    yr_lvl_code SERIAL PRIMARY KEY,
    yr_lvl VARCHAR(50) NOT NULL
);

CREATE TABLE semester_maintenance (
    semester_code SERIAL PRIMARY KEY,
    semester VARCHAR(50) NOT NULL
);

CREATE TABLE sy_maintenance (
    sy_code SERIAL PRIMARY KEY,
    school_year VARCHAR(20) NOT NULL
);



CREATE TABLE renewal_scholar (
    renewal_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES masterlist(student_id) ON DELETE CASCADE,
    batch_code INT REFERENCES batch_maintenance(batch_code),
    campus_code VARCHAR(100),
    renewal_date DATE,
    renewal_yr_lvl_basis INT REFERENCES yr_lvl_maintenance(yr_lvl_code),
    renewal_sem_basis INT REFERENCES semester_maintenance(semester_code),
    renewal_school_year_basis INT REFERENCES sy_maintenance(sy_code),
    yr_lvl INT REFERENCES yr_lvl_maintenance(yr_lvl_code),
    semester INT REFERENCES semester_maintenance(semester_code),
    school_year INT REFERENCES sy_maintenance(sy_code),
    is_initial BOOLEAN DEFAULT false
);

CREATE TABLE renewal_validation (
    validation_id SERIAL PRIMARY KEY,
    renewal_id INT REFERENCES renewal_scholar(renewal_id) ON DELETE CASCADE,
    gpa FLOAT DEFAULT NULL,
    gpa_validation_stat VARCHAR(20) DEFAULT 'Not Started' CHECK (gpa_validation_stat IN ('Not Started', 'Passed', 'Failed')),
    no_failing_grd_validation VARCHAR(20) DEFAULT 'Not Started' CHECK (no_failing_grd_validation IN ('Not Started', 'Passed', 'Failed')),
    no_other_scholar_validation VARCHAR(20) DEFAULT 'Not Started' CHECK (no_other_scholar_validation IN ('Not Started', 'Passed', 'Failed')),
    goodmoral_validation VARCHAR(20) DEFAULT 'Not Started' CHECK (goodmoral_validation IN ('Not Started', 'Passed', 'Failed')),
    no_police_record_validation VARCHAR(20) DEFAULT 'Not Started' CHECK (no_police_record_validation IN ('Not Started', 'Passed', 'Failed')),
    full_load_validation VARCHAR(20) DEFAULT 'Not Started' CHECK (full_load_validation IN ('Not Started', 'Passed', 'Failed')),
    withdrawal_change_course_validation VARCHAR(20) DEFAULT 'Not Started' CHECK (withdrawal_change_course_validation IN ('Not Started', 'Passed', 'Failed')),
    enrollment_validation VARCHAR(20) DEFAULT 'Not Started' CHECK (enrollment_validation IN ('Not Started', 'Passed', 'Failed')),
    scholarship_status VARCHAR(20) DEFAULT 'Not Started' CHECK (scholarship_status IN ('Not Started', 'Passed', 'Delisted')),
    delisted_date DATE,
    delisting_root_cause TEXT DEFAULT 'Not Started'
);

CREATE OR REPLACE VIEW vw_renewal_details AS
SELECT 
    -- Renewal Information
    rs.renewal_id,
    rs.student_id,
    m.scholar_name,
    m.campus,
    b.batch_number,
    rs.renewal_date,
    
    -- Renewal Basis
    y.yr_lvl AS renewal_year_level_basis,
    s.semester AS renewal_semester_basis,
    sy.school_year AS renewal_school_year_basis,

    -- Validation ID
    rv.validation_id,  -- Include validation_id here
    
    -- GPA and Renewal Validation Status
    rv.gpa,
    rv.gpa_validation_stat,
    rv.no_failing_grd_validation,
    rv.no_other_scholar_validation,
    rv.goodmoral_validation,
    rv.no_police_record_validation,
    rv.full_load_validation,
    rv.withdrawal_change_course_validation,
    rv.enrollment_validation,
    
    -- Scholarship Status
    rv.scholarship_status,
    y2.yr_lvl AS year_level,
    s2.semester AS semester,
    sy2.school_year AS school_year,
    -- Delisting Information
    rv.delisted_date,
    rv.delisting_root_cause
FROM renewal_scholar rs
LEFT JOIN masterlist m ON rs.student_id = m.student_id
LEFT JOIN renewal_validation rv ON rs.renewal_id = rv.renewal_id  -- Ensuring we include validation_id
LEFT JOIN batch_maintenance b ON rs.batch_code = b.batch_code
LEFT JOIN yr_lvl_maintenance y ON rs.renewal_yr_lvl_basis = y.yr_lvl_code
LEFT JOIN semester_maintenance s ON rs.renewal_sem_basis = s.semester_code
LEFT JOIN sy_maintenance sy ON rs.renewal_school_year_basis = sy.sy_code
LEFT JOIN yr_lvl_maintenance y2 ON rs.yr_lvl = y2.yr_lvl_code
LEFT JOIN semester_maintenance s2 ON rs.semester = s2.semester_code
LEFT JOIN sy_maintenance sy2 ON rs.school_year = sy2.sy_code;


--Scholarship summary
SELECT 
    m.student_id,
    m.scholar_name,
    m.scholarship_status,
    m.course,
    y.yr_lvl,
    m.campus,
    s.semester,
    sy.school_year,
    b.batch_number,
    rv.validation_id,
    rs.renewal_date,
    rv.gpa,
    rv.gpa_validation_stat,
    rv.no_failing_grd_validation,
    rv.goodmoral_validation,
    rv.full_load_validation,
    rv.enrollment_validation,
    rv.no_other_scholar_validation,
    rv.no_police_record_validation,
    rv.withdrawal_change_course_validation,
    rv.scholarship_status AS validation_scholarship_status,
    rs.renewal_id,
    rs.renewal_date AS renewal_date_history,
    yl.yr_lvl AS renewal_year_level,
    sm.semester AS renewal_semester,
    syb.school_year AS renewal_school_year,
    rv.scholarship_status AS renewal_status,
    rv.delisting_root_cause
FROM masterlist m
LEFT JOIN renewal_scholar rs ON m.student_id = rs.student_id
LEFT JOIN renewal_validation rv ON rs.renewal_id = rv.renewal_id
LEFT JOIN batch_maintenance b ON m.batch_code = b.batch_code
LEFT JOIN yr_lvl_maintenance y ON m.yr_lvl_code = y.yr_lvl_code
LEFT JOIN semester_maintenance s ON m.semester_code = s.semester_code
LEFT JOIN sy_maintenance sy ON m.school_year_code = sy.sy_code
LEFT JOIN yr_lvl_maintenance yl ON rs.yr_lvl = yl.yr_lvl_code
LEFT JOIN semester_maintenance sm ON rs.semester = sm.semester_code
LEFT JOIN sy_maintenance syb ON rs.school_year = syb.sy_code;

-----------------

CREATE TABLE valid_sy_sem(
   val_sysem_id SERIAL
);

CREATE TABLE disbursement_type (
    disbursement_type_id SERIAL PRIMARY KEY,
    disbursement_label VARCHAR(50) NOT NULL
);

CREATE TABLE disbursement_tracking(
    disbursement_id SERIAL PRIMARY KEY,
    renewal_id INTEGER REFERENCES renewal_scholar (renewal_id) ON DELETE CASCADE 
);
CREATE TABLE disbursement_detail (
    disb_detail_id SERIAL PRIMARY KEY,
    disbursement_id INTEGER REFERENCES disbursement_tracking(disbursement_id) ON DELETE CASCADE NOT NULL,
    disbursement_type_id INTEGER REFERENCES disbursement_type(disbursement_type_id) NOT NULL,
    disb_sched_id INTEGER REFERENCES disbursement_schedule(disb_sched_id),
    disbursement_status disbursement_status_enum DEFAULT 'Not Started' NOT NULL,
    required_hours INTEGER,
    completed_at TIMESTAMP
);

CREATE TABLE disbursement_schedule (
    disb_sched_id SERIAL PRIMARY KEY,
    disbursement_type_id INTEGER REFERENCES disbursement_type(disbursement_type_id),
    disb_title VARCHAR(255) NOT NULL,
    disbursement_date DATE NOT NULL,
    status disbursement_status_enum DEFAULT 'Not Started',
    amount NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    yr_lvl_code INTEGER REFERENCES yr_lvl_maintenance(yr_lvl_code) NOT NULL,
    sy_code INTEGER REFERENCES sy_maintenance(sy_code) NOT NULL,
    semester_code INTEGER REFERENCES semester_maintenance(semester_code) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    created_by INTEGER REFERENCES "user"(user_id) NOT NULL,
    updated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION handle_disbursement_tracking()
RETURNS TRIGGER AS $$
DECLARE
    new_disb_id INTEGER;
BEGIN
    
    IF NEW.scholarship_status = 'Passed' AND OLD.scholarship_status <> 'Passed' THEN
       
        INSERT INTO disbursement_tracking (renewal_id)
        VALUES (NEW.renewal_id)
        RETURNING disbursement_id INTO new_disb_id;

       
        INSERT INTO disbursement_detail (disbursement_id, disbursement_type_id, disbursement_status)
        VALUES 
            (new_disb_id, 1, 'Not Started'),
            (new_disb_id, 2, 'Not Started'), 
            (new_disb_id, 3, 'Not Started'), 
            (new_disb_id, 4, 'Not Started'); 

    ELSIF OLD.scholarship_status = 'Passed' AND NEW.scholarship_status <> 'Passed' THEN

        SELECT disbursement_id INTO new_disb_id
        FROM disbursement_tracking
        WHERE renewal_id = NEW.renewal_id;

        DELETE FROM disbursement_details
        WHERE disbursement_id = new_disb_id;

        DELETE FROM disbursement_tracking
        WHERE disbursement_id = new_disb_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_disbursement_tracking
AFTER UPDATE OF scholarship_status
ON renewal_validation
FOR EACH ROW
EXECUTE FUNCTION handle_disbursement_tracking();

-- Calendar view
CREATE OR REPLACE VIEW vw_disb_calendar_sched AS 
SELECT 
  ds.disb_sched_id,
  ds.status,
  ds.disb_title AS title,
  dt.disbursement_label AS type,
  ds.disbursement_date AS date,
  ds.quantity AS student_count
FROM disbursement_schedule ds
JOIN disbursement_type dt 
  ON ds.disbursement_type_id = dt.disbursement_type_id;



CREATE INDEX idx_sched_type_id ON disbursement_schedule(disbursement_type_id);
CREATE INDEX idx_sched_yr_lvl_code ON disbursement_schedule(yr_lvl_code);
CREATE INDEX idx_sched_sy_code ON disbursement_schedule(sy_code);
CREATE INDEX idx_sched_semester_code ON disbursement_schedule(semester_code);
CREATE INDEX idx_sched_created_by ON disbursement_schedule(created_by);
CREATE INDEX idx_sched_disbursement_date ON disbursement_schedule(disbursement_date);

CREATE INDEX idx_detail_disbursement_id ON disbursement_detail(disbursement_id);
CREATE INDEX idx_detail_type_id ON disbursement_detail(disbursement_type_id);
CREATE INDEX idx_detail_type_date ON disbursement_detail(disbursement_type_id, disbursement_date);

CREATE INDEX idx_tracking_renewal_id ON disbursement_tracking(renewal_id);

CREATE INDEX idx_validation_renewal_id ON renewal_validation(renewal_id);
CREATE INDEX idx_validation_scholarship_status ON renewal_validation(scholarship_status);

CREATE OR REPLACE VIEW vw_disb_sched_summary AS  
SELECT 
    ds.disb_sched_id,
    ds.disb_title,
    dt.disbursement_label AS disbursement_type,
    sem.semester,
    sy.school_year,
    yl.yr_lvl AS year_level,
    ds.disbursement_date,
    ds.status
FROM disbursement_schedule ds
JOIN disbursement_type dt ON ds.disbursement_type_id = dt.disbursement_type_id
JOIN semester_maintenance sem ON ds.semester_code = sem.semester_code
JOIN sy_maintenance sy ON ds.sy_code = sy.sy_code
JOIN yr_lvl_maintenance yl ON ds.yr_lvl_code = yl.yr_lvl_code
LEFT JOIN disbursement_detail dd ON dd.disbursement_type_id = ds.disbursement_type_id
LEFT JOIN disbursement_tracking dtk ON dd.disbursement_id = dtk.disbursement_id
LEFT JOIN renewal_scholar rs ON dtk.renewal_id = rs.renewal_id
GROUP BY 
    ds.disb_sched_id, ds.disb_title, dt.disbursement_label,
    sem.semester, sy.school_year, yl.yr_lvl, ds.disbursement_date, ds.status;


CREATE OR REPLACE VIEW vw_disbursement_schedule_detailed AS
SELECT 
    ds.disb_sched_id,
    dt.disbursement_label AS disbursement_type,
    ds.disbursement_date,
    ds.disb_title AS title,
    ds.status AS schedule_status,
    ds.amount,
    yl.yr_lvl,
    sm.semester,
    sy.school_year,
    ds.branch,

    -- Creator details
    u.user_id AS created_by_id,
    CONCAT(u.first_name, ' ', u.last_name) AS created_by,

    -- Use quantity directly instead of COUNT
    ds.quantity AS total_scholar

FROM disbursement_schedule ds

JOIN disbursement_type dt ON ds.disbursement_type_id = dt.disbursement_type_id
LEFT JOIN yr_lvl_maintenance yl ON ds.yr_lvl_code = yl.yr_lvl_code
LEFT JOIN semester_maintenance sm ON ds.semester_code = sm.semester_code
LEFT JOIN sy_maintenance sy ON ds.sy_code = sy.sy_code
LEFT JOIN "user" u ON ds.created_by = u.user_id;






CREATE OR REPLACE VIEW vw_student_disbursement_summary AS
SELECT
    m.scholar_name AS student_name,
    m.student_id,
    rs.yr_lvl AS student_year_lvl,
    rs.semester AS student_semester,
    rs.school_year AS student_school_year,
    rs.campus_code AS student_branch,
    dd.disbursement_status,
    ds.amount
FROM
    masterlist m
LEFT JOIN
    renewal_scholar rs ON rs.student_id = m.student_id
LEFT JOIN
    disbursement_tracking dt ON dt.renewal_id = rs.renewal_id
LEFT JOIN
    disbursement_detail dd ON dd.disbursement_id = dt.disbursement_id
LEFT JOIN
    disbursement_schedule ds ON ds.disb_sched_id = dd.disb_sched_id
WHERE
    m.scholarship_status = 'ACTIVE';



CREATE OR REPLACE VIEW vw_scholar_disbursement_history AS
WITH ranked_sched AS (
    SELECT 
        rs.student_id,
        ds.yr_lvl_code AS current_yr_lvl_code,
        ds.semester_code AS current_semester_code,
        ds.sy_code AS current_sy_code,
        ROW_NUMBER() OVER (PARTITION BY rs.student_id ORDER BY ds.sy_code DESC, ds.semester_code DESC) AS rn
    FROM disbursement_detail dd
    JOIN disbursement_schedule ds ON dd.disb_sched_id = ds.disb_sched_id
    JOIN disbursement_tracking dtr ON dd.disbursement_id = dtr.disbursement_id
    JOIN renewal_scholar rs ON dtr.renewal_id = rs.renewal_id
    WHERE dd.completed_at IS NOT NULL
),
latest_sched AS (
    SELECT * FROM ranked_sched WHERE rn = 1
)
SELECT 
    m.student_id,
    m.scholar_name,
    m.campus AS branch,

    -- Disbursement Info
    y.yr_lvl AS year_level,
    sy.school_year,
    sem.semester,
    dt.disbursement_label,
    ds.amount,
    dd.disbursement_status,
    dd.completed_at,

    -- Current Academic Info
    cy.yr_lvl AS current_year_level,
    csy.school_year AS current_school_year,
    csem.semester AS current_semester

FROM disbursement_detail dd
JOIN disbursement_tracking dtr ON dd.disbursement_id = dtr.disbursement_id
JOIN renewal_scholar rs ON dtr.renewal_id = rs.renewal_id
JOIN masterlist m ON rs.student_id = m.student_id
JOIN disbursement_schedule ds ON dd.disb_sched_id = ds.disb_sched_id
JOIN disbursement_type dt ON dd.disbursement_type_id = dt.disbursement_type_id
JOIN yr_lvl_maintenance y ON ds.yr_lvl_code = y.yr_lvl_code
JOIN sy_maintenance sy ON ds.sy_code = sy.sy_code
JOIN semester_maintenance sem ON ds.semester_code = sem.semester_code

-- Current status joins
LEFT JOIN latest_sched ls ON rs.student_id = ls.student_id
LEFT JOIN yr_lvl_maintenance cy ON ls.current_yr_lvl_code = cy.yr_lvl_code
LEFT JOIN sy_maintenance csy ON ls.current_sy_code = csy.sy_code
LEFT JOIN semester_maintenance csem ON ls.current_semester_code = csem.semester_code;




CREATE OR REPLACE PROCEDURE add_initial_scholar(
    p_scholar_name TEXT,
    p_yr_lvl_code SMALLINT,
    p_school_year_code INT,
    p_semester_code SMALLINT,
    p_batch_code INT,
    p_scholarship_status VARCHAR,
    p_course VARCHAR,
    p_campus VARCHAR,
    p_school_email VARCHAR,
    p_secondary_email VARCHAR,
    p_contact_number CHAR(11),
    p_internship_year SMALLINT,
    p_graduation_year SMALLINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_student_id INT;
    v_renewal_id INT;
BEGIN
    -- Ensure referenced keys exist


    IF NOT EXISTS (SELECT 1 FROM yr_lvl_maintenance WHERE yr_lvl_code = p_yr_lvl_code) THEN
        RAISE EXCEPTION 'Year level code % does not exist in yr_lvl_maintenance', p_yr_lvl_code;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM semester_maintenance WHERE semester_code = p_semester_code) THEN
        RAISE EXCEPTION 'Semester code % does not exist in semester_maintenance', p_semester_code;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM sy_maintenance WHERE sy_code = p_school_year_code) THEN
        RAISE EXCEPTION 'School year code % does not exist in sy_maintenance', p_school_year_code;
    END IF;

    -- Step 1: Insert into masterlist
    INSERT INTO masterlist (
        scholar_name, yr_lvl_code, school_year_code, semester_code, batch_code,
        scholarship_status, course, campus, school_email, secondary_email,
        contact_number, internship_year, graduation_year
    ) VALUES (
        p_scholar_name, p_yr_lvl_code, p_school_year_code, p_semester_code, p_batch_code,
        p_scholarship_status, p_course, p_campus, p_school_email, p_secondary_email,
        p_contact_number, p_internship_year, p_graduation_year
    )
    RETURNING student_id INTO v_student_id;

    -- Step 2: Insert into renewal_scholar
    INSERT INTO renewal_scholar (
        student_id, batch_code, campus_code,
        renewal_yr_lvl_basis, renewal_sem_basis, renewal_school_year_basis,
        yr_lvl, semester, school_year, is_initial
    ) VALUES (
        v_student_id, p_batch_code, p_campus,
        p_yr_lvl_code, p_semester_code, p_school_year_code,
        p_yr_lvl_code, p_semester_code, p_school_year_code, TRUE
    )
    RETURNING renewal_id INTO v_renewal_id;

    -- Step 3: Insert into renewal_validation
    INSERT INTO renewal_validation (
        renewal_id, scholarship_status
    ) VALUES (
        v_renewal_id, 'Passed'
    );
END;
-- $$;
-- prototype=# CALL add_initial_scholar(
-- prototype(#     'Juan Dela Cruz'::TEXT,
-- prototype(#     3::SMALLINT,
-- prototype(#     20242025::INT,
-- prototype(#     2::SMALLINT,
-- prototype(#     5::INT,
-- prototype(#     'Passed'::VARCHAR,
-- prototype(#     'BSCS'::VARCHAR,
-- prototype(#     'Ortigas-Cainta'::VARCHAR,
-- prototype(#     'juan.delacruz@school.edu'::VARCHAR,
-- prototype(#     'juandelacruz@gmail.com'::VARCHAR,
-- prototype(#     '09171234567'::CHAR(11),
-- prototype(#     2026::SMALLINT,
-- prototype(#     2027::SMALLINT
-- prototype(# );
    -- IF NOT EXISTS (SELECT 1 FROM batch_maintenance WHERE batch_code = p_batch_code) THEN
    --     RAISE EXCEPTION 'Batch code % does not exist in batch_maintenance', p_batch_code;
    -- END IF;

    CREATE OR REPLACE VIEW view_tracking_summary AS
SELECT 
    dt.disbursement_label AS disb_type,
    ds.sy_code,
    ds.semester_code,
    COUNT(DISTINCT ds.disb_sched_id) AS sched_disbursement_quantity,
    COUNT(DISTINCT ml.student_id) AS recepients,
    SUM(ds.amount * ds.quantity) AS total
FROM disbursement_schedule ds
JOIN disbursement_type dt ON dt.disbursement_type_id = ds.disbursement_type_id

LEFT JOIN disbursement_detail dd ON dd.disb_sched_id = ds.disb_sched_id
LEFT JOIN disbursement_tracking dtrack ON dtrack.disbursement_id = dd.disbursement_id
LEFT JOIN renewal_scholar rs ON rs.renewal_id = dtrack.renewal_id
LEFT JOIN masterlist ml ON ml.student_id = rs.student_id

GROUP BY dt.disbursement_label, ds.sy_code, ds.semester_code;
