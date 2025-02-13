CREATE TABLE Admin (
    Admin_ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Affiliation VARCHAR(255),
    Role VARCHAR(100),
    Password TEXT NOT NULL
);

CREATE TABLE Maintaining_Scholar (
    Student_ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Campus VARCHAR(255),
    Batch_Number INT,
    Year INT,
    Course VARCHAR(255),
    Mobile_Number VARCHAR(20),
    Email_Address VARCHAR(255) UNIQUE,
    Scholar_Status VARCHAR(100),
    Bank_Account VARCHAR(100) UNIQUE
);


CREATE TABLE Document (
    Document_ID SERIAL PRIMARY KEY,
    Document_Name VARCHAR(255) NOT NULL,
    Doc_Type VARCHAR(100),
    Path TEXT,
    size INTEGER,
    Document_File TEXT,
    Upload_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Workflow (
    Workflow_ID SERIAL PRIMARY KEY,
    Document_ID INT NOT NULL,
    Author_ID INT NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Due_Date TIMESTAMP,
    Completed_at TIMESTAMP,
    Request_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR(50) CHECK (Status IN ('PENDING', 'APPROVED', 'REJECTED', 'OVER_DUE')) NOT NULL DEFAULT 'PENDING',

    CONSTRAINT fk_document FOREIGN KEY (Document_ID) REFERENCES Document(Document_ID) ON DELETE CASCADE,
    CONSTRAINT fk_author FOREIGN KEY (Author_ID) REFERENCES Admin(Admin_ID) ON DELETE SET NULL
);

CREATE TABLE Approvers (
    Approver_ID SERIAL PRIMARY KEY,
    User_ID INT NOT NULL,
    Workflow_ID INT NOT NULL,
    Approver_Order INT NOT NULL,
    Response VARCHAR(10) CHECK (Response IN ('APPROVE', 'REJECT')) DEFAULT NULL,
    State VARCHAR(100),
    Comments TEXT,
    Due_Date TIMESTAMP,
    Response_Time TIMESTAMP,

    CONSTRAINT fk_user FOREIGN KEY (User_ID) REFERENCES Admin(Admin_ID) ON DELETE SET NULL,
    CONSTRAINT fk_workflow FOREIGN KEY (Workflow_ID) REFERENCES Workflow(Workflow_ID) ON DELETE CASCADE
); 

CREATE TABLE Workflow_Log (
    Log_ID SERIAL PRIMARY KEY,
    Workflow_ID INT NOT NULL,
    Approver_ID INT NOT NULL,
    Action VARCHAR(255) NOT NULL,
    Comments TEXT,
    Old_Status VARCHAR(100),
    New_Status VARCHAR(100),
    Changed_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_workflow FOREIGN KEY (Workflow_ID) REFERENCES Workflow(Workflow_ID) ON DELETE CASCADE,
    CONSTRAINT fk_approver FOREIGN KEY (Approver_ID) REFERENCES Approvers(Approver_ID) ON DELETE SET NULL
);


CREATE TABLE Schedule (
    Schedule_ID SERIAL PRIMARY KEY,
    Schedule_Date DATE NOT NULL,
    Status VARCHAR(100),
    Coordinator INT NOT NULL,
    FOREIGN KEY (Coordinator) REFERENCES Admin(Admin_ID) ON DELETE CASCADE
);