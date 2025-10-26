import { Faculty } from "../models/faculty.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";



const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await Faculty.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
       console.log(error)
    }
}
const registerFaculty = async (req, res) => {
  try {
    const { fullName, email, username, password, collegeName } = req.body;

    if (![fullName, email, username, password, collegeName].every(Boolean)) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existingFaculty = await Faculty.findOne({
      $or: [{ email }, { username }]
    });

    if (existingFaculty) {
      return res.status(409).json({ success: false, message: "Faculty with email or username already exists" });
    }

    // Ensure req.file is available and log it
    console.log("Avatar file:", req.file);
    const avatarLocalPath = req.file?.path;  // Adjust based on how multer or express-fileupload works
    if (!avatarLocalPath) {
      return res.status(400).json({ success: false, message: "Avatar file is required" });
    }

    const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarUpload?.url) {
      return res.status(500).json({ success: false, message: "Failed to upload avatar" });
    }

    const faculty = await Faculty.create({
      fullName,
      email,
      username,
      password,
      collegeName,
      avatar: avatarUpload.url
    });

    if (!faculty) {
      return res.status(500).json({ success: false, message: "Failed to create faculty" });
    }

    res.status(201).json({ success: true, message: "Faculty registered successfully", data: faculty });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
};



 const loginFaculty = async (req, res) => {
  try {
    const { email,  password } = req.body;
    console.log("Login request body:", req.body);

    if (!email) {
      return res.status(400).json({ success: false, message: "Email or username is required" });
    }

    const faculty = await Faculty.findOne({email});
    console.log(faculty)

    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }

    const isValid = await faculty.isPasswordCorrect(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(faculty._id);

    const responseData = {
      _id: faculty._id,
      fullName: faculty.fullName,
      email: faculty.email,
      username: faculty.username,
      collegeName: faculty.collegeName,
      avatar: faculty.avatar
    };

    res
      .cookie("accessToken", accessToken, { httpOnly: true, secure: true })
      .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true })
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        data: responseData,
        accessToken,
        refreshToken
      });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
};


 const logoutFaculty = async (req, res) => {
  try {
    const facultyId = req.user?._id; 
    if (!facultyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await Faculty.findByIdAndUpdate(facultyId, {
      $unset: { refreshToken: 1 }
    });

    res
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .status(200)
      .json({ success: true, message: "Logout successful" });

  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Server error during logout" });
  }
};
 const getCurrentUser = async (req, res) => {
  try {
    const facultyId = req.user?._id;
    if (!facultyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const faculty = await Faculty.findById(facultyId).select("-password -refreshToken");

    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }

    res.status(200).json({ success: true, data: faculty });

  } catch (error) {
    console.error("Get Current User error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export{registerFaculty,loginFaculty,logoutFaculty,getCurrentUser  }
