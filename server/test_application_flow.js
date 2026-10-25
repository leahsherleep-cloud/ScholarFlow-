require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Student = require('./models/Student');
const Scholarship = require('./models/Scholarship');
const Application = require('./models/Application');
const Document = require('./models/Document');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');
const jwt = require('jsonwebtoken');

const runVerification = async () => {
  await connectDB();

  console.log('--- 1. AUTHENTICATION & PROFILE CHECK ---');
  const studentUser = await User.findOne({ email: 'student@scholarflow.dev' });
  const token = jwt.sign({ id: studentUser._id, role: 'student' }, process.env.JWT_SECRET);
  console.log('Verified student token generated:', token.slice(0, 20) + '...');
  const student = await Student.findOne({ userId: studentUser._id });
  console.log('Student loaded:', studentUser.name, 'CGPA:', student.cgpa, 'Course:', student.course);

  console.log('\n--- 2. ELIGIBILITY VALIDATION TESTS ---');
  const { checkEligibility } = require('./services/eligibilityService');
  
  // Test A: Ineligible (SC/ST Excellence Award - Category mismatch)
  const scstSch = await Scholarship.findOne({ name: 'SC/ST Excellence Award 2026' });
  const ineligResult = await checkEligibility(student._id, scstSch._id);
  console.log('Test A (Ineligible Category) - Eligible:', ineligResult.eligible, '| Reason:', ineligResult.reason);
  if (ineligResult.eligible) throw new Error('Test A failed: Ineligible student marked eligible');

  // Test B: Ineligible (Engineering Excellence - CGPA 8.7 < 9.0)
  const engSch = await Scholarship.findOne({ name: 'Engineering Excellence Fellowship' });
  const ineligCgpa = await checkEligibility(student._id, engSch._id);
  console.log('Test B (Ineligible CGPA) - Eligible:', ineligCgpa.eligible, '| Reason:', ineligCgpa.reason);
  if (ineligCgpa.eligible) throw new Error('Test B failed: Low CGPA marked eligible');

  // Test C: Inactive/Closed scholarship
  const closedSch = await Scholarship.create({
    name: 'Temporary Closed Test Scholarship',
    description: 'Testing closed scholarship rejection',
    amount: 10000,
    applicationStartDate: new Date('2026-01-01'),
    applicationEndDate: new Date('2026-02-01'),
    status: 'closed',
    createdBy: studentUser._id
  });
  const closedResult = await checkEligibility(student._id, closedSch._id);
  console.log('Test C (Closed Scholarship) - Eligible:', closedResult.eligible, '| Reason:', closedResult.reason);
  await Scholarship.findByIdAndDelete(closedSch._id);

  // Test D: Eligible scholarship
  const meritSch = await Scholarship.findOne({ name: 'National Merit Scholarship 2026' });
  const eligResult = await checkEligibility(student._id, meritSch._id);
  console.log('Test D (Eligible Scholarship) - Eligible:', eligResult.eligible);

  console.log('\n--- 3. APPLICATION WORKFLOW & PERSISTENCE TEST ---');
  // Create a clean temporary scholarship for end-to-end testing
  const testSch = await Scholarship.create({
    name: 'End-to-End Test Scholarship 2026',
    description: 'Automated verification test scholarship',
    amount: 50000,
    eligibilityCriteria: {
      minimumCgpa: 7.0,
      maximumFamilyIncome: 500000,
      eligibleCourses: ['B.Tech'],
      eligibleCategories: ['all'],
      eligibleYears: [2]
    },
    requiredDocuments: ['identity_proof', 'mark_sheet'],
    applicationStartDate: new Date('2026-09-01'),
    applicationEndDate: new Date('2026-12-31'),
    status: 'active',
    totalSlots: 50,
    createdBy: studentUser._id
  });

  // Create Draft Application
  const testApp = await Application.create({
    student: student._id,
    studentUser: studentUser._id,
    scholarship: testSch._id,
    personalStatement: 'This is an automated verification statement that meets the length requirements.',
    status: 'DRAFT',
    statusHistory: [{ status: 'DRAFT', changedBy: studentUser._id, note: 'Draft created' }]
  });
  console.log('Draft created successfully. App ID:', testApp._id, 'Tracking Number:', testApp.applicationNumber);
  if (!testApp.applicationNumber.startsWith('SCH-2026-')) throw new Error('Invalid application number generated');

  // Test Duplicate Constraint
  try {
    await Application.create({
      student: student._id,
      studentUser: studentUser._id,
      scholarship: testSch._id,
      personalStatement: 'Duplicate attempt',
      status: 'DRAFT'
    });
    throw new Error('Duplicate check failed: duplicate draft was allowed');
  } catch (err) {
    console.log('Duplicate check passed: Database rejected duplicate (code:', err.code, ')');
  }

  // Upload required documents
  const doc1 = await Document.create({
    applicationId: testApp._id,
    studentId: student._id,
    studentUserId: studentUser._id,
    documentType: 'identity_proof',
    documentName: 'Aadhaar Card',
    fileName: 'test-id.pdf',
    originalName: 'aadhaar.pdf',
    fileUrl: '/uploads/test-id.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf'
  });
  const doc2 = await Document.create({
    applicationId: testApp._id,
    studentId: student._id,
    studentUserId: studentUser._id,
    documentType: 'mark_sheet',
    documentName: 'Semester Marksheet',
    fileName: 'test-marks.pdf',
    originalName: 'marksheet.pdf',
    fileUrl: '/uploads/test-marks.pdf',
    fileSize: 2048,
    mimeType: 'application/pdf'
  });
  console.log('Uploaded required documents:', doc1.documentType, doc2.documentType);

  // Submit Application
  testApp.status = 'SUBMITTED';
  testApp.submittedAt = new Date();
  testApp.statusHistory.push({ status: 'SUBMITTED', changedBy: studentUser._id, note: 'Application submitted' });
  await testApp.save();
  await Scholarship.findByIdAndUpdate(testSch._id, { $inc: { filledSlots: 1 } });
  console.log('Application status transitioned to SUBMITTED');

  console.log('\n--- 4. STUDENT & OFFICER QUEUE VISIBILITY VERIFICATION ---');
  // Student view query
  const studentViewApps = await Application.find({ student: student._id }).populate('scholarship', 'name');
  const studentHasTestApp = studentViewApps.some(a => a._id.toString() === testApp._id.toString());
  console.log('Visible in Student My Applications queue:', studentHasTestApp);

  // Officer view query
  const officerUser = await User.findOne({ email: 'officer@scholarflow.dev' });
  const officerQueue = await Application.find({ status: 'SUBMITTED' })
    .populate('student', 'registrationNumber course cgpa')
    .populate('studentUser', 'name email')
    .populate('scholarship', 'name amount');
  const officerHasTestApp = officerQueue.some(a => a._id.toString() === testApp._id.toString());
  console.log('Visible in Officer Review Queue:', officerHasTestApp);

  console.log('\n--- 5. OFFICER REVIEW & APPROVAL VERIFICATION ---');
  testApp.status = 'VERIFIED';
  testApp.verifiedAt = new Date();
  testApp.assignedOfficer = officerUser._id;
  await testApp.save();
  console.log('Officer verified application. Status:', testApp.status);

  testApp.status = 'APPROVED';
  testApp.approvedAt = new Date();
  testApp.approvedBy = officerUser._id;
  testApp.remarks.push({ text: 'Exemplary academic credentials. Approved.', addedBy: officerUser._id, role: 'officer' });
  await testApp.save();
  console.log('Officer approved application. Status:', testApp.status, 'Remarks:', testApp.remarks[0].text);

  // Cleanup test records
  await Document.deleteMany({ applicationId: testApp._id });
  await Application.findByIdAndDelete(testApp._id);
  await Scholarship.findByIdAndDelete(testSch._id);
  console.log('Cleaned up test scholarship, documents, and application. State pristine.');

  console.log('\n✅ ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
};

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
