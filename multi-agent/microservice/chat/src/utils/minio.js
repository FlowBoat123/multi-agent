require("dotenv").config();
const Minio = require("minio");
const logger = require("./logger");

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT, 10),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
});

const bucketName = process.env.MINIO_BUCKET;

const setBucketPublic = async () => {
    const policy = {
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:GetObject"],
                Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
        ],
    };

    try {
        await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
        logger.info(`Bucket "${bucketName}" set to public-read.`);
    } catch (error) {
        logger.error(`Error setting bucket policy: ${error.message}`);
        throw error;
    }
};

const ensureBucketExists = async () => {
    try {
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            await minioClient.makeBucket(bucketName);
            await setBucketPublic();
            logger.info(`Bucket "${bucketName}" created.`);
        }
    } catch (error) {
        logger.error(`Error ensuring bucket exists: ${error.message}`);
        throw new Error(`Error ensuring bucket exists: ${error.message}`);
    }
};

const uploadFile = async (folderName, fileBuffer, fileName) => {
    try {
        await ensureBucketExists();

        const safeFileName = fileName.normalize("NFC");
        const objectName = `${folderName}/${safeFileName}`;

        // Upload file from memory buffer
        await minioClient.putObject(bucketName, objectName, fileBuffer);
        logger.info(`File "${objectName}" uploaded successfully to bucket "${bucketName}".`);

        return `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/${objectName}`;
    } catch (error) {
        logger.error(`Error uploading file: ${error.message}`);
        throw new Error(`Error uploading file: ${error.message}`);
    }
};

const getFile = async (folderName, fileName, expiry = 3600) => {
    try {
        if (!bucketName || !fileName) {
            throw new Error("Missing bucketName or fileName");
        }

        const objectName = folderName ? `${folderName}/${fileName}` : fileName;

        const presignedUrl = `http://localhost:9000/${bucketName}/${objectName}`;

        logger.info(`Presigned URL generated for file "${objectName}".`);
        return presignedUrl;
    } catch (error) {
        logger.error(`Error fetching file: ${error.message}`);
        throw new Error(`Error fetching file: ${error.message}`);
    }
};

const deleteFile = async (folderName, fileName) => {
    try {
        const objectName = `${folderName}/${fileName}`;
        await minioClient.removeObject(bucketName, objectName);
        logger.info(`File "${objectName}" has been deleted.`);
        return { success: true };
    } catch (error) {
        logger.error(`Error deleting file: ${error.message}`);
        throw new Error(`Error deleting file: ${error.message}`);
    }
};

module.exports = {
    uploadFile,
    getFile,
    deleteFile,
};