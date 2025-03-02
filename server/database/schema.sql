
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
    rq_type_id VARCHAR,
    school_year VARCHAR NOT NULL,
    semester VARCHAR NOT NULL,
    scholar_level VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Ongoing', 'Completed')),
    due_date DATE NOT NULL,
    completed_at DATE,
    rq_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'missed', 'current', 'reassigned', 'finish', 'replaced')),
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
    response VARCHAR NOT NULL DEFAULT 'pending' CHECK (response IN ('pending', 'approved', 'reject')),
    comment TEXT,
    response_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- No ON UPDATE here
    CONSTRAINT fk_approver FOREIGN KEY (approver_id) REFERENCES wf_approver(approver_id) ON DELETE CASCADE
);

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


CREATE TABLE Schedule (
    Schedule_ID SERIAL PRIMARY KEY,
    Schedule_Date DATE NOT NULL,
    Status VARCHAR(100),
    Coordinator INT NOT NULL,
    FOREIGN KEY (Coordinator) REFERENCES Admin(Admin_ID) ON DELETE CASCADE
);