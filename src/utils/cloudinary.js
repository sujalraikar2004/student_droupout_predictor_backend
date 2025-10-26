import {v2 as cloudinary} from "cloudinary"
import fs from "fs"



cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dvesn2uo2', 
  api_key: process.env.CLOUDINARY_API_KEY || '358616653826452', 
  api_secret: process.env.CLOUDINARY_API_SECRET || 'fG1p-QgktVdPtMTFVAZIFsJ0wwQ'
});

const uploadOnCloudinary = async (fileInput, filename = null) => {
    try {
        if (!fileInput) return null
        
        // Handle both file path (local dev) and buffer (Vercel)
        let uploadOptions = {
            resource_type: "auto"
        };
        
        if (filename) {
            uploadOptions.public_id = filename.split('.')[0];
        }
        
        let response;
        
        // If fileInput is a buffer (from multer memory storage)
        if (Buffer.isBuffer(fileInput)) {
            response = await cloudinary.uploader.upload(
                `data:image/jpeg;base64,${fileInput.toString('base64')}`,
                uploadOptions
            );
        } else {
            // If fileInput is a file path (local development)
            response = await cloudinary.uploader.upload(fileInput, uploadOptions);
            // Clean up local file only if it exists
            if (fs.existsSync(fileInput)) {
                fs.unlinkSync(fileInput);
            }
        }
        
        return response;

    } catch (error) {
        console.error("Cloudinary upload error:", error);
        // Clean up local file only if it's a path and exists
        if (typeof fileInput === 'string' && fs.existsSync(fileInput)) {
            fs.unlinkSync(fileInput);
        }
        return null;
    }
}



export {uploadOnCloudinary}