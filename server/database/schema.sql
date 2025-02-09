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

CREATE TABLE Approval_Workflow (
    Workflow_ID SERIAL PRIMARY KEY,
    Document_ID INT NOT NULL,
    Author_ID INT NOT NULL,
    State VARCHAR(100),
    Due_Date DATE,
    Approved_at TIMESTAMP,
    FOREIGN KEY (Document_ID) REFERENCES Document(Document_ID) ON DELETE CASCADE,
    FOREIGN KEY (Author_ID) REFERENCES Admin(Admin_ID) ON DELETE CASCADE
);

CREATE TABLE Approvers (
    Approver_Record_ID SERIAL PRIMARY KEY,
    Approver_id INT NOT NULL,
    Workflow_ID INT NOT NULL,
    Approver_Order INT NOT NULL,
    State VARCHAR(100),
    Comments TEXT,
    FOREIGN KEY (Workflow_ID) REFERENCES Approval_Workflow(Workflow_ID) ON DELETE CASCADE,
    FOREIGN KEY (Approver_id) REFERENCES Admin(Admin_ID)
);


CREATE TABLE Approvers_Timeline (
    Approver_Record_ID INT NOT NULL,
    Apr_Due_Date DATE,
    FOREIGN KEY (Approver_Record_ID) REFERENCES Approvers(Approver_Record_ID) ON DELETE CASCADE
);

CREATE TABLE Schedule (
    Schedule_ID SERIAL PRIMARY KEY,
    Schedule_Date DATE NOT NULL,
    Status VARCHAR(100),
    Coordinator INT NOT NULL,
    FOREIGN KEY (Coordinator) REFERENCES Admin(Admin_ID) ON DELETE CASCADE
);