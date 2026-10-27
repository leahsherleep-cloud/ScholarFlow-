require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');

const demoUsers = [
  {
    name: 'Administrator',
    email: 'admin@scholarflow.dev',
    password: 'Admin@1234',
    role: 'admin',
  },
  {
    name: 'Scholarship Officer',
    email: 'officer@scholarflow.dev',
    password: 'Officer@1234',
    role: 'officer',
  },
  {
    name: 'Priya Sharma',
    email: 'student@scholarflow.dev',
    password: 'Student@1234',
    role: 'student',
  },
];

async function createDemoUsers() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const demo of demoUsers) {
      let user = await User.findOne({ email: demo.email });

      if (user) {
        console.log(`Already exists: ${demo.email}`);
      } else {
        user = await User.create({
          ...demo,
          isActive: true,
        });
        console.log(`Created: ${demo.email}`);
      }

      if (demo.role === 'student') {
        const existingStudent = await Student.findOne({ userId: user._id });
        if (!existingStudent) {
          await Student.create({
            userId: user._id,
            registrationNumber: 'REG-2024-001234',
            dateOfBirth: new Date('2002-05-15'),
            gender: 'female',
            phone: '9876543210',
            address: {
              street: '24, Gandhi Nagar',
              city: 'Chennai',
              state: 'Tamil Nadu',
              pincode: '600020',
              country: 'India',
            },
            institution: 'Anna University',
            course: 'B.Tech',
            department: 'Computer Science and Engineering',
            year: 2,
            cgpa: 8.7,
            familyIncome: 250000,
            category: 'obc',
            bankDetails: {
              accountHolderName: 'Priya Sharma',
              accountNumber: '12345678901234',
              ifscCode: 'SBIN0001234',
              bankName: 'State Bank of India',
              branchName: 'Anna University Branch',
            },
            profileCompletionStatus: 95,
          });
          console.log(`Created student profile for: ${demo.email}`);
        }
      }
    }
  } catch (error) {
    console.error('Demo user creation failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createDemoUsers();
