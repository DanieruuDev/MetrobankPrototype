# 📧 Email Templates Documentation

This document provides comprehensive information about the email templates implemented in the Metrobank Scholarship System.

## 🎯 Overview

The email system has been designed to match the notification system across all modules. Each email template is categorized by module and includes proper branding, testing indicators, and module-specific information.

## 📋 Available Email Templates

### 1. Scholarship Renewal Module

#### 1.1 Renewal Process Initialized

- **Function**: `sendRenewalInitializedEmail()`
- **Trigger**: When HR initializes a new renewal process
- **Recipients**: HR Team
- **Subject**: `[SCHOLARSHIP RENEWAL] Renewal Process Initialized - {schoolYear} {semester}`
- **Parameters**:
  - `to`: Email address
  - `initiatorName`: Name of the person who initialized
  - `schoolYear`: School year (e.g., "2024-2025")
  - `semester`: Semester number (1 or 2)

#### 1.2 Branch Validation Complete

- **Function**: `sendBranchValidationCompleteEmail()`
- **Trigger**: When branch validation is completed
- **Recipients**: HR Team
- **Subject**: `[SCHOLARSHIP RENEWAL] Branch Validation Complete - {schoolYear} {semester}`
- **Parameters**:
  - `to`: Email address
  - `schoolYear`: School year
  - `semester`: Semester number
  - `yearLevel`: Year level (e.g., "3rd Year")
  - `branchName`: Branch name (e.g., "STI Ortigas-Cainta")

#### 1.3 New Renewal Process (DO/Registrar)

- **Function**: `sendNewRenewalProcessEmail()`
- **Trigger**: When DO or Registrar needs to be notified of new renewal
- **Recipients**: DO Team, Registrar Team
- **Subject**: `[SCHOLARSHIP RENEWAL] New Renewal Process - {schoolYear} {semester}`
- **Parameters**:
  - `to`: Email address
  - `initiatorName`: Name of the initiator
  - `schoolYear`: School year
  - `semester`: Semester number
  - `recipientRole`: Role of recipient ("DO" or "Registrar")

### 2. Invoice Upload Module

#### 2.1 Tuition Fee Process Finalized

- **Function**: `sendTuitionFeeProcessFinalizedEmail()`
- **Trigger**: When tuition fee process is completed
- **Recipients**: HR Team
- **Subject**: `[INVOICE UPLOAD] Tuition Fee Process Finalized - {schoolYear} {semester}`
- **Parameters**:
  - `to`: Email address
  - `schoolYear`: School year
  - `semester`: Semester (e.g., "1st Semester")
  - `processedBy`: Name of the person who processed

#### 2.2 Academic Award Process Finalized

- **Function**: `sendAcademicAwardProcessFinalizedEmail()`
- **Trigger**: When academic award process is completed
- **Recipients**: HR Team
- **Subject**: `[INVOICE UPLOAD] Academic Award Process Finalized - {schoolYear} {semester}`
- **Parameters**:
  - `to`: Email address
  - `schoolYear`: School year
  - `semester`: Semester
  - `processedBy`: Name of the person who processed

#### 2.3 Thesis Fee Upload Complete

- **Function**: `sendThesisFeeUploadCompleteEmail()`
- **Trigger**: When thesis fee upload is completed
- **Recipients**: HR Team
- **Subject**: `[INVOICE UPLOAD] Thesis Fee Upload Completed`
- **Parameters**:
  - `to`: Email address
  - `processedBy`: Name of the person who processed

### 3. Disbursement Module

#### 3.1 Disbursement Schedule Created

- **Function**: `sendDisbursementScheduleCreatedEmail()`
- **Trigger**: When a new disbursement schedule is created
- **Recipients**: HR Team
- **Subject**: `[DISBURSEMENT] New Disbursement Schedule Created - {scheduleTitle}`
- **Parameters**:
  - `to`: Email address
  - `scheduleTitle`: Title of the schedule
  - `dueDate`: Due date
  - `amount`: Amount in PHP
  - `studentCount`: Number of students
  - `createdBy`: Name of the creator

#### 3.2 Disbursement Status Update

- **Function**: `sendDisbursementStatusUpdateEmail()`
- **Trigger**: When disbursement status is updated
- **Recipients**: HR Team
- **Subject**: `[DISBURSEMENT] Disbursement Status Update - {studentName}`
- **Parameters**:
  - `to`: Email address
  - `studentName`: Name of the student
  - `status`: New status
  - `amount`: Amount
  - `updatedBy`: Name of the person who updated

### 4. Analytics Module

#### 4.1 Analytics Report Generated

- **Function**: `sendAnalyticsReportGeneratedEmail()`
- **Trigger**: When an analytics report is generated
- **Recipients**: HR Team
- **Subject**: `[ANALYTICS] Analytics Report Generated - {reportType}`
- **Parameters**:
  - `to`: Email address
  - `reportType`: Type of report
  - `generatedBy`: Name of the person who generated
  - `dateRange`: Date range of the report

## 🧪 Testing Functionality

### Test All Email Templates

- **Endpoint**: `POST /api/email-test/test-all`
- **Description**: Sends all email templates to HR user (ID: 7) for testing
- **Response**: Success message with list of tested modules

### Test Specific Module Email

- **Endpoint**: `POST /api/email-test/test-module`
- **Description**: Tests a specific email template
- **Request Body**:
  ```json
  {
    "module": "SCHOLARSHIP_RENEWAL",
    "action": "initialized",
    "details": {
      "initiatorName": "Test HR User",
      "schoolYear": "2024-2025",
      "semester": 1
    }
  }
  ```

### Get Available Email Templates

- **Endpoint**: `GET /api/email-test/templates`
- **Description**: Returns all available email templates with their parameters
- **Response**: JSON object with all modules and their available actions

## 🎨 Email Design Features

### Visual Elements

- **Module Headers**: Each email has a colored header indicating the module
- **Testing Indicators**: All emails include a testing mode warning
- **Responsive Design**: Emails are designed to work on desktop and mobile
- **Professional Styling**: Clean, modern design with proper spacing

### Color Coding by Module

- **Scholarship Renewal**: Blue theme (#1976d2)
- **Invoice Upload**: Green theme (#2e7d32)
- **Disbursement**: Purple theme (#7b1fa2)
- **Analytics**: Blue theme (#1976d2)

### Content Structure

1. **Header**: Module name and icon
2. **Main Content**: Clear description of the action
3. **Details Box**: Structured information with key details
4. **Testing Warning**: Clear indication this is for testing
5. **Footer**: Professional closing

## 🔧 Integration Points

### Notification System Integration

- All email templates are triggered by the existing notification system
- Emails are sent alongside in-app notifications
- Real-time updates via Socket.io are maintained

### Database Integration

- HR user (ID: 7) is used for testing emails
- Email addresses are retrieved from `administration_adminaccounts` table
- All email sending is logged for debugging

### Resend Integration

- Uses Resend service for email delivery
- Requires `RESEND_API_KEY` environment variable
- Requires verified sender domain in Resend dashboard

## 📝 Usage Examples

### Testing All Templates

```bash
curl -X POST http://localhost:5000/api/email-test/test-all
```

### Testing Specific Template

```bash
curl -X POST http://localhost:5000/api/email-test/test-module \
  -H "Content-Type: application/json" \
  -d '{
    "module": "SCHOLARSHIP_RENEWAL",
    "action": "initialized",
    "details": {
      "initiatorName": "John Doe",
      "schoolYear": "2024-2025",
      "semester": 1
    }
  }'
```

### Getting Available Templates

```bash
curl -X GET http://localhost:5000/api/email-test/templates
```

## 🚀 Production Considerations

### For Production Deployment

1. **Remove Testing Warnings**: Remove or modify the testing mode indicators
2. **Update Recipients**: Modify recipient logic to include all relevant stakeholders
3. **Email Validation**: Add proper email validation before sending
4. **Error Handling**: Implement comprehensive error handling and retry logic
5. **Rate Limiting**: Consider rate limiting for email sending

### Approval Workflow Emails

- **Authors**: Will receive notifications when their workflows are created, approved, or rejected
- **Approvers**: Will receive notifications when it's their turn to approve, when workflows are completed, or when they're replaced
- **Testing**: Currently limited to HR users for testing purposes

## 🔍 Monitoring and Debugging

### Resend Dashboard

- Check the Resend dashboard to verify email delivery
- Monitor email open rates and delivery status
- Debug any delivery issues through Resend logs

### Console Logging

- All email sending attempts are logged to console
- Success and error messages are clearly indicated
- Email content can be logged for debugging (in development)

## 📞 Support

For questions or issues with email templates:

1. Check the Resend dashboard for delivery status
2. Review console logs for error messages
3. Verify environment variables are properly set
4. Test individual templates using the test endpoints

---

**Note**: All email templates are currently configured for testing purposes and will only be sent to HR users. In production, the recipient logic should be updated to include all relevant stakeholders based on the notification system requirements.
