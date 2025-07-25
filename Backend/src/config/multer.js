import multer from "multer";
import path from "path";
import fs from "fs";

export const getMulterUploader = (folder) => {
  
  const uploadPath = path.join("src", "upload", folder);

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = Date.now() + ext;
      cb(null, filename);
    },
  });

  return multer({ storage }); 
};
