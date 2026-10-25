/**
 * ScholarFlow Seed Script
 * Development Only — Creates sample data for testing
 *
 * Usage: npm run seed
 *
 * Development Credentials (DO NOT USE IN PRODUCTION):
 *   Admin:   admin@scholarflow.dev / Admin@1234
 *   Officer: officer@scholarflow.dev / Officer@1234
 *   Student: student@scholarflow.dev / Student@1234
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Student = require('../models/Student');
const Scholarship = require('../models/Scholarship');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const Document = require('../models/Document');
const Disbursement = require('../models/Disbursement');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
};

const clearCollections = async () => {
  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Scholarship.deleteMany({}),
    Application.deleteMany({}),
    Document.deleteMany({}),
    Disbursement.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log('🧹 Cleared existing data');
};

const seedUsers = async () => {
  // Create admin
  const admin = await User.create({
    name: 'Administrator',
    email: 'admin@scholarflow.dev',
    password: 'Admin@1234',
    role: 'admin',
    isActive: true,
  });

  // Create officer
  const officer = await User.create({
    name: 'Scholarship Officer',
    email: 'officer@scholarflow.dev',
    password: 'Officer@1234',
    role: 'officer',
    isActive: true,
  });

  // Create student
  const studentUser = await User.create({
    name: 'Priya Sharma',
    email: 'student@scholarflow.dev',
    password: 'Student@1234',
    role: 'student',
    isActive: true,
  });

  console.log('👥 Users created');
  return { admin, officer, studentUser };
};

const seedStudentProfile = async (studentUser) => {
  const student = await Student.create({
    userId: studentUser._id,
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

  console.log('📋 Student profile created');
  return student;
};

const seedScholarships = async (adminId) => {
  const scholarships = await Scholarship.insertMany([
    {
      name: 'National Merit Scholarship 2026',
      description:
        'A prestigious scholarship for academically outstanding students from economically weaker sections pursuing undergraduate programs in recognized universities.',
      amount: 75000,
      eligibilityCriteria: {
        minimumCgpa: 8.0,
        maximumFamilyIncome: 500000,
        eligibleCourses: ['B.Tech', 'B.E', 'B.Sc', 'B.Com', 'B.A', 'BCA', 'BBA'],
        eligibleCategories: ['all'],
        eligibleYears: [1, 2, 3, 4],
      },
      requiredDocuments: [
        'identity_proof',
        'income_certificate',
        'mark_sheet',
        'college_id',
        'bank_proof',
      ],
      applicationStartDate: new Date('2026-09-01'),
      applicationEndDate: new Date('2026-12-31'),
      status: 'active',
      totalSlots: 500,
      createdBy: adminId,
    },
    {
      name: 'SC/ST Excellence Award 2026',
      description:
        'Empowering students from Scheduled Castes and Scheduled Tribes communities to pursue higher education without financial barriers.',
      amount: 60000,
      eligibilityCriteria: {
        minimumCgpa: 6.5,
        maximumFamilyIncome: 800000,
        eligibleCourses: [],
        eligibleCategories: ['sc', 'st'],
        eligibleYears: [],
      },
      requiredDocuments: [
        'identity_proof',
        'community_certificate',
        'income_certificate',
        'mark_sheet',
        'college_id',
        'bank_proof',
      ],
      applicationStartDate: new Date('2026-09-01'),
      applicationEndDate: new Date('2026-12-15'),
      status: 'active',
      totalSlots: 300,
      createdBy: adminId,
    },
    {
      name: 'OBC Girls Scholarship 2026',
      description:
        'Supporting female students from Other Backward Classes in achieving their academic aspirations.',
      amount: 45000,
      eligibilityCriteria: {
        minimumCgpa: 7.0,
        maximumFamilyIncome: 600000,
        eligibleCourses: [],
        eligibleCategories: ['obc'],
        eligibleYears: [1, 2, 3, 4],
      },
      requiredDocuments: [
        'identity_proof',
        'community_certificate',
        'income_certificate',
        'mark_sheet',
        'bonafide_certificate',
        'bank_proof',
      ],
      applicationStartDate: new Date('2026-09-15'),
      applicationEndDate: new Date('2026-12-31'),
      status: 'active',
      totalSlots: 200,
      createdBy: adminId,
    },
    {
      name: 'Engineering Excellence Fellowship',
      description:
        'Recognizing and supporting top engineering talent from all categories with exceptional academic performance.',
      amount: 100000,
      eligibilityCriteria: {
        minimumCgpa: 9.0,
        maximumFamilyIncome: 1000000,
        eligibleCourses: ['B.Tech', 'B.E', 'M.Tech', 'M.E'],
        eligibleCategories: ['all'],
        eligibleYears: [2, 3, 4],
      },
      requiredDocuments: [
        'identity_proof',
        'mark_sheet',
        'college_id',
        'bank_proof',
        'scholarship_specific',
      ],
      applicationStartDate: new Date('2026-10-01'),
      applicationEndDate: new Date('2026-11-30'),
      status: 'active',
      totalSlots: 100,
      createdBy: adminId,
    },
    {
      name: 'STEM Women Scholarship 2026',
      description:
        'Encouraging women to pursue careers in Science, Technology, Engineering and Mathematics.',
      amount: 55000,
      eligibilityCriteria: {
        minimumCgpa: 7.5,
        maximumFamilyIncome: 700000,
        eligibleCourses: ['B.Tech', 'B.E', 'B.Sc', 'M.Tech', 'M.Sc', 'BCA', 'MCA'],
        eligibleCategories: ['all'],
        eligibleYears: [1, 2, 3, 4],
      },
      requiredDocuments: [
        'identity_proof',
        'income_certificate',
        'mark_sheet',
        'college_id',
        'bonafide_certificate',
        'bank_proof',
      ],
      applicationStartDate: new Date('2026-09-01'),
      applicationEndDate: new Date('2026-12-31'),
      status: 'active',
      totalSlots: 250,
      createdBy: adminId,
    },
  ]);

  console.log(`🎓 ${scholarships.length} scholarships created`);
  return scholarships;
};

const seedNotifications = async (studentUser) => {
  await Notification.insertMany([
    {
      userId: studentUser._id,
      title: 'Welcome to ScholarFlow!',
      message:
        'Your account has been created. Complete your profile to start applying for scholarships.',
      type: 'GENERAL',
      isRead: true,
    },
    {
      userId: studentUser._id,
      title: 'New Scholarship Available',
      message:
        'National Merit Scholarship 2026 is now open for applications. Check your eligibility and apply before Dec 31.',
      type: 'SCHOLARSHIP_NEW',
      isRead: false,
    },
    {
      userId: studentUser._id,
      title: 'Profile Reminder',
      message: 'Your profile is 95% complete. Add missing details to improve your scholarship matches.',
      type: 'GENERAL',
      isRead: false,
    },
  ]);

  console.log('🔔 Notifications created');
};

const seed = async () => {
  try {
    await connectDB();
    await clearCollections();

    const { admin, officer, studentUser } = await seedUsers();
    const student = await seedStudentProfile(studentUser);
    const scholarships = await seedScholarships(admin._id);
    await seedNotifications(studentUser);

    console.log('\n✅ Seed completed successfully!\n');
    console.log('─'.repeat(50));
    console.log('🔐 Development Credentials (DO NOT USE IN PRODUCTION)');
    console.log('─'.repeat(50));
    console.log(`👨‍💼 Admin:   admin@scholarflow.dev    / Admin@1234`);
    console.log(`👮 Officer: officer@scholarflow.dev / Officer@1234`);
    console.log(`👩‍🎓 Student: student@scholarflow.dev / Student@1234`);
    console.log('─'.repeat(50));
    console.log(`\n🎓 ${scholarships.length} active scholarships ready`);
    console.log('📋 Sample student profile created (Priya Sharma)\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();
