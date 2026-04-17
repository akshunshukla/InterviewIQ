import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "./AppError.js";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadToS3 = async (fileBuffer, originalName, mimetype) => {
  try {
    const fileExtension = originalName.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimetype,
    });

    await s3Client.send(command);

    // Return the public URL
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    throw new AppError("Failed to upload file to S3", 500);
  }
};
