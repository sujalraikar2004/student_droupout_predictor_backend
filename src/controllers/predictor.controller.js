import { OpenAI } from 'openai';
import cliProgress from 'cli-progress';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Student } from '../models/studen.model.js'; // Ensure this path is correct

dotenv.config();

// Initialize OpenAI client
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY in environment variables. Set it in your .env and in Vercel.");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Format student data into readable prompt
function formatStudentData(student) {
  let formattedData = `Name: ${student.name}\n`;
  formattedData += `USN: ${student.usn}\n`;
  formattedData += `Gender: ${student.gender}\n`;
  formattedData += `Extracurricular Activities Level: ${student.extracurricular}\n`;
  formattedData += `Current Semester: ${student.current_sem}\n\n`;

  student.semesters.forEach((semester) => {
    formattedData += `Semester ${semester.semester_number}:\n`;

    let totalMarks = 0;
    let totalAttendance = 0;

    semester.subjects.forEach((subject) => {
      formattedData += `  - ${subject.name}: Marks=${subject.marks}, Attendance=${subject.attendance}%\n`;
      totalMarks += subject.marks;
      totalAttendance += subject.attendance;
    });

    const avgMarks = totalMarks / semester.subjects.length;
    const avgAttendance = totalAttendance / semester.subjects.length;

    formattedData += `  Semester Average: Marks=${avgMarks.toFixed(2)}, Attendance=${avgAttendance.toFixed(2)}%\n\n`;
  });

  return formattedData;
}

// Get dropout prediction using OpenAI
async function getDropoutPrediction(student) {
  const studentData = formatStudentData(student);
  console.log(studentData)

  const prompt = `
You are an expert education analyst. Based on the following student data,
predict the risk of them dropping out as a percentage (0 to 100), explain the reasoning,
and provide specific improvement suggestions.

${studentData}

Output format:
Dropout Probability: <number>%
Reason: <detailed reason for the dropout risk assessment>
Improvement Suggestions: <specific actionable suggestions for improvement>
`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return `Error: ${error.message}`;
  }
}

// Main function to run predictions for all students
async function runDropoutPrediction() {
  try {
  

    const students = await Student.find();
    console.log(students)

    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(students.length, 0);

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const output = await getDropoutPrediction(student);
      console.log(output)

      // Extract relevant parts using regex
      const probabilityMatch = output.match(/Dropout Probability:\s*(\d+)%/i);
      const reasonMatch = output.match(/Reason:\s*(.*?)(?=Improvement Suggestions|$)/is);
      const suggestionsMatch = output.match(/Improvement Suggestions:\s*(.*)/is);

      // Update student document
      student.dropout_probability = probabilityMatch ? parseInt(probabilityMatch[1]) : null;
      student.dropout_reason = reasonMatch ? reasonMatch[1].trim() : null;
      student.dropout_suggestions = suggestionsMatch ? suggestionsMatch[1].trim() : null;
  
      await student.save();
      console.log(student)
      progressBar.update(i + 1);
    }

    progressBar.stop();
    console.log("Dropout prediction completed for all students.");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error in prediction pipeline:", error);
  }
}

export default  runDropoutPrediction
