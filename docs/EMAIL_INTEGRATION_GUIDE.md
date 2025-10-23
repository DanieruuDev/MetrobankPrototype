# 📧 Email Integration Guide

This guide shows how the email system now works with automatic queuing for reliable delivery.

## ✅ **Simplified Email System**

All email functions now automatically use the queue system for reliable delivery:

```javascript
// All these functions now use queuing automatically
sendApproverAddedEmail(to, workflowDetails);
sendItsYourTurnEmail(to, workflowDetails);
sendWorkflowRejectedEmail(to, workflowDetails, rejectComment);
sendWorkflowCompletedEmail(to, workflowDetails);
sendWorkflowCreatedEmail(to, workflowDetails);
```

## 🔧 **No Changes Needed!**

Your existing code will work exactly the same, but now with automatic queuing:

```javascript
// This code works exactly the same as before
const {
  sendApproverAddedEmail,
  sendItsYourTurnEmail,
  sendWorkflowCompletedEmail,
} = require("../utils/emailing.js");

// These functions now automatically use queuing
await sendApproverAddedEmail(approverEmail, workflowDetails);
await sendItsYourTurnEmail(approverEmail, workflowDetails);
```

## 🎯 **What Changed**

- **Same function names** - no code changes needed
- **Same parameters** - drop-in replacement
- **Automatic queuing** - emails are now queued with rate limiting
- **Reliable delivery** - no more rate limit errors

## 🎯 **Benefits of Queued Functions**

### **✅ Advantages:**

- **No Rate Limiting:** Emails are sent with 1-second delays
- **Reliable Delivery:** Automatic retry for failed emails
- **Better Performance:** Non-blocking email sending
- **Queue Monitoring:** Track email status and queue size
- **Production Ready:** Handles high email volumes

### **⚠️ Considerations:**

- **Slight Delay:** Emails are sent with 1-second delays (not immediate)
- **Queue Management:** Monitor queue status for high-volume scenarios
- **Memory Usage:** Queue stores emails in memory (clears after sending)

## 🔍 **Monitoring Queue Status**

### **Check Queue Status:**

```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/approval-test/queue-status" -Method GET

# Or in your code
const emailQueue = require("../utils/email-queue.js");
const status = emailQueue.getStatus();
console.log("Queue size:", status.queueSize);
console.log("Processing:", status.isProcessing);
```

### **Clear Queue (if needed):**

```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/approval-test/queue" -Method DELETE
```

## 🚀 **Production Deployment**

### **Environment Variables:**

```env
RESEND_API_KEY=your_resend_api_key
EMAIL_SENDER=Your System <noreply@yourdomain.com>
```

### **Recommended Changes:**

1. **Replace all immediate email functions** with queued versions
2. **Test thoroughly** with the test endpoints
3. **Monitor queue status** in production
4. **Set up monitoring** for queue size and processing status

## 📊 **Available Functions**

| Function Name                | Use Case                         | Status         |
| ---------------------------- | -------------------------------- | -------------- |
| `sendApproverAddedEmail`     | When adding approvers            | ✅ Auto-queued |
| `sendItsYourTurnEmail`       | When it's approver's turn        | ✅ Auto-queued |
| `sendWorkflowRejectedEmail`  | When workflow is rejected        | ✅ Auto-queued |
| `sendWorkflowCompletedEmail` | When workflow is completed       | ✅ Auto-queued |
| `sendWorkflowCreatedEmail`   | When workflow is created         | ✅ Auto-queued |
| `sendDeadlineReminder`       | When deadline is approaching     | ✅ Auto-queued |
| `sendWorkflowMovedForward`   | When workflow moves to next step | ✅ Auto-queued |
| `sendApproverReplacedEmail`  | When approver is replaced        | ✅ Auto-queued |

## 🧪 **Testing Integration**

### **Test Queued Functions:**

```bash
# Test the queued workflow
Invoke-WebRequest -Uri "http://localhost:5000/api/approval-test/test-workflow-queue" -Method POST -ContentType "application/json"
```

### **Monitor Results:**

1. Check console logs for queue processing
2. Check Resend dashboard for delivered emails
3. Verify no rate limiting errors

## 💡 **Best Practices**

1. **No code changes needed** - existing functions now use queuing automatically
2. **Monitor queue status** regularly in production
3. **Test thoroughly** with the test endpoints
4. **Handle queue errors** gracefully (automatic retry included)
5. **Check Resend dashboard** for delivery confirmation

---

**Note:** All email functions now automatically use the queue system. Your existing code will work exactly the same, but with improved reliability and no rate limiting issues.
