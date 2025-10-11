const { DocumentProcessorServiceClient } =
  require("@google-cloud/documentai").v1;

const credentials = JSON.parse(process.env.GOOGLE_KEY_JSON);

const client = new DocumentProcessorServiceClient({ credentials });

module.exports = client;
