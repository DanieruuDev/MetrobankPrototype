const { DocumentProcessorServiceClient } =
  require("@google-cloud/documentai").v1;
const { JWT } = require("google-auth-library");

// Load your service account JSON file
const serviceAccount = process.env.GOOGLE_KEY_JSON;

const authClient = new JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

// ✅ Must be passed as `auth`, not `authClient`
const client = new DocumentProcessorServiceClient({ auth: authClient });

module.exports = client;
