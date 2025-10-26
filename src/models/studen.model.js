import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  usn: { type: String, required: true, unique: true },
  gender: { type: String, required: true },
  extracurricular: { type: String, required: false },
  current_sem: { type: Number, required: true },
 
  probability: { type: Number }, 
  
    dropout_probability: {
    type: Number,
    default: null,
  },
  dropout_reason: {
    type: String,
    default: '',
  },
  dropout_suggestions: {
    type: String,
    default: '',
  },
  semesters: [
    {
      semester_number: { type: Number, required: true },
      subjects: [
        {
          name: { type: String, required: true },
          marks: { type: Number, required: true },
          attendance: { type: Number, required: true }
        }
      ]
    }
  ]
});

export const Student = mongoose.model('Student', studentSchema);

