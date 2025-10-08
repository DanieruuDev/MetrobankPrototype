const B2 = require("backblaze-b2");
const fs = require("fs");

const b2 = new B2({
  applicationKeyId: process.env.BACKBLAZE_B2_KEY_ID,
  applicationKey: process.env.BACKBLAZE_B2_APP_KEY,
});

async function authorizeB2() {
  try {
    await b2.authorize();
  } catch (err) {
    console.error("B2 authorization failed:", err);
    throw new Error("Failed to authorize with Backblaze B2");
  }
}
const uploadFile = async (filePath, fileName, bucketId) => {
  try {
    await authorizeB2();

    const { data: uploadData } = await b2.getUploadUrl({ bucketId });
    if (!uploadData?.uploadUrl || !uploadData?.authorizationToken) {
      throw new Error("Failed to get upload URL or auth token from B2");
    }

    // Read the file into a Buffer
    const fileBuffer = fs.readFileSync(filePath);

    const result = await b2.uploadFile({
      uploadUrl: uploadData.uploadUrl,
      uploadAuthToken: uploadData.authorizationToken,
      fileName,
      data: fileBuffer, // pass Buffer instead of ReadStream
    });

    if (!result?.data) {
      throw new Error("Upload to B2 returned invalid response");
    }

    return result;
  } catch (err) {
    console.error("File upload failed:", err);
    throw new Error(`Backblaze B2 upload failed: ${err.message}`);
  }
};
async function uploadBuffer(fileBuffer, fileName, bucketId) {
  await authorizeB2();
  const { data: uploadData } = await b2.getUploadUrl({ bucketId });

  const result = await b2.uploadFile({
    uploadUrl: uploadData.uploadUrl,
    uploadAuthToken: uploadData.authorizationToken,
    fileName,
    data: fileBuffer,
  });

  return result.data;
}

async function getDownloadStream(fileName) {
  console.log(fileName);
  try {
    await authorizeB2();

    // Use responseType 'stream' so you get a readable stream
    const result = await b2.downloadFileByName({
      bucketName: process.env.B2_BUCKET_NAME,
      fileName,
      responseType: "stream",
    });

    return result.data; // result.data is a readable stream
  } catch (err) {
    // Simplify error logging
    console.error(
      "B2 download failed:",
      err?.message || err?.error || JSON.stringify(err, null, 2)
    );

    if (err?.status) {
      console.error("Status code:", err.status);
    }

    throw new Error(`Backblaze B2 download failed: ${err?.message || err}`);
  }
}

module.exports = { uploadFile, getDownloadStream, uploadBuffer };
