import path from "path";
import fs from "fs";
import csv from "csv-parser";
import { Student } from "../models/studen.model.js";
import runDropoutPrediction from "./predictor.controller.js";// Make sure the path to student model is correct

// Register student based on uploaded CSV file
const registerStudent = async (req, res) => {
  try {
    // Check if the file is uploaded
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    // Log the uploaded file path (for debugging purposes)
    console.log(`File received: ${req.file.path}`);

    const results = [];

    // Read and parse the uploaded CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        // Extract student data from the CSV row
        const student = {
          name: data.name,
          usn: data.usn,
          gender: data.gender,
          extracurricular: data.extracurricular,
          current_sem: parseInt(data.current_sem),
          probability: calculateProbability(data), // Calculate probability based on marks and attendance
          semesters: []
        };

        // Handle Semester 1 Data
        let semester1Subjects = [
          { name: 'Mathematics-I', marks: parseInt(data['Sem1_Mathematics-I_Marks']), attendance: parseInt(data['Sem1_Mathematics-I_Attendance']) },
          { name: 'Physics', marks: parseInt(data['Sem1_Physics_Marks']), attendance: parseInt(data['Sem1_Physics_Attendance']) },
          { name: 'Chemistry', marks: parseInt(data['Sem1_Chemistry_Marks']), attendance: parseInt(data['Sem1_Chemistry_Attendance']) },
          { name: 'Basic Electronics', marks: parseInt(data['Sem1_Basic Electronics_Marks']), attendance: parseInt(data['Sem1_Basic Electronics_Attendance']) },
          { name: 'Computer Programming', marks: parseInt(data['Sem1_Computer Programming_Marks']), attendance: parseInt(data['Sem1_Computer Programming_Attendance']) }
        ];

        student.semesters.push({
          semester_number: 1,
          subjects: semester1Subjects
        });

        // Handle Semester 2 Data
        let semester2Subjects = [
          { name: 'Mathematics-II', marks: parseInt(data['Sem2_Mathematics-II_Marks']), attendance: parseInt(data['Sem2_Mathematics-II_Attendance']) },
          { name: 'Data Structures', marks: parseInt(data['Sem2_Data Structures_Marks']), attendance: parseInt(data['Sem2_Data Structures_Attendance']) },
          { name: 'Digital Electronics', marks: parseInt(data['Sem2_Digital Electronics_Marks']), attendance: parseInt(data['Sem2_Digital Electronics_Attendance']) },
          { name: 'Object-Oriented Programming', marks: parseInt(data['Sem2_Object-Oriented Programming_Marks']), attendance: parseInt(data['Sem2_Object-Oriented Programming_Attendance']) },
          { name: 'Communication Skills', marks: parseInt(data['Sem2_Communication Skills_Marks']), attendance: parseInt(data['Sem2_Communication Skills_Attendance']) }
        ];

        student.semesters.push({
          semester_number: 2,
          subjects: semester2Subjects
        });

        // Push the student data to results
        results.push(student);
      })
      .on('end', async () => {
        try {
          // Insert the parsed student data into the MongoDB database
          await Student.insertMany(results);
          console.log('Students inserted into MongoDB');
         await runDropoutPrediction();
          res.status(200).send('Students data successfully registered!');
        } catch (err) {
          console.error('Error inserting students into MongoDB', err);
          res.status(500).send('Error registering students.');
        }
      });
  } catch (err) {
    console.error('Error processing file:', err);
    res.status(500).send('Error processing file.');
  }
};

// Helper function to calculate the probability (for dropout prediction)
// This is based on marks and attendance in all semesters
const calculateProbability = (data) => {
  let totalMarks = 0;
  let totalAttendance = 0;
  let totalSubjects = 0;

  // Summing up marks and attendance from the semesters (simplified)
  for (let i = 1; i <= 2; i++) {  // We have Semester 1 and Semester 2
    for (let j = 1; j <= 5; j++) {  // 5 subjects per semester
      let marks = parseInt(data[`Sem${i}_${getSubjectName(j)}_Marks`]);
      let attendance = parseInt(data[`Sem${i}_${getSubjectName(j)}_Attendance`]);

      if (!isNaN(marks) && !isNaN(attendance)) {
        totalMarks += marks;
        totalAttendance += attendance;
        totalSubjects++;
      }
    }
  }

  // Calculate the dropout probability (you can customize the logic based on your requirements)
  // Here we're using a simple average of marks and attendance as an example
  const averageMarks = totalMarks / totalSubjects;
  const averageAttendance = totalAttendance / totalSubjects;

  // A simple probability calculation (e.g., risk of dropout could be higher if average attendance is low and marks are low)
  const probability = (1 - (averageMarks / 100)) * (1 - (averageAttendance / 100));
  return probability;
};

// Helper function to map subject index to subject name
const getSubjectName = (index) => {
  const subjects = [
    'Mathematics-I', 'Physics', 'Chemistry', 'Basic Electronics', 'Computer Programming',
    'Mathematics-II', 'Data Structures', 'Digital Electronics', 'Object-Oriented Programming', 'Communication Skills'
  ];
  return subjects[index - 1];
};

// Controller to get all students from the database
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find(); // Fetch all students from the database
    res.status(200).json(students); // Send the student data as JSON response
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).send('Error fetching students.');
  }
};

const getStudentById = async (req, res) => {
  const { studentId } = req.params;
  console.log(studentId)

  try {
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export { registerStudent, getAllStudents ,getStudentById};
