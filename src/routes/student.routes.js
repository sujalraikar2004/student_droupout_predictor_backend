import { Router } from "express";
import { registerStudent ,getStudentById,getAllStudents } from "../controllers/student.controller.js";
import { upload } from "../middlewares/multer.middleware.js";



const router = Router();

// Route for registering students by uploading CSV file
router.route("/register").post(
  upload.single('file'),  // Handles file upload
  registerStudent        // Controller that processes the file and stores data in DB
);
router.route("/").get(
  getAllStudents
);
router.route("/:studentId").get(
  getStudentById
);



export default router
