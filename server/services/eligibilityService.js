const Scholarship = require('../models/Scholarship');
const Student = require('../models/Student');

/**
 * Check if a student is eligible for a scholarship
 * Returns detailed eligibility result per criterion
 */
const checkEligibility = async (studentId, scholarshipId) => {
  const student = await Student.findById(studentId);
  const scholarship = await Scholarship.findById(scholarshipId);

  if (!student) {
    return { eligible: false, reason: 'Student profile not found' };
  }

  if (!scholarship) {
    return { eligible: false, reason: 'Scholarship not found' };
  }

  if (scholarship.status !== 'active') {
    return { eligible: false, reason: 'Scholarship is not currently active' };
  }

  const now = new Date();
  if (now < scholarship.applicationStartDate || now > scholarship.applicationEndDate) {
    return { eligible: false, reason: 'Scholarship application period has ended or not started' };
  }

  if (!student.course || student.cgpa === undefined || student.familyIncome === undefined) {
    return {
      eligible: false,
      reason: 'Student profile is incomplete. Please complete your academic details, CGPA, and family income.',
      criteria: {},
      scholarship: {
        id: scholarship._id,
        name: scholarship.name,
        amount: scholarship.amount,
      },
    };
  }

  const criteria = scholarship.eligibilityCriteria;
  const results = {};
  let allEligible = true;

  // CGPA check
  if (criteria.minimumCgpa > 0) {
    const cgpaMet = student.cgpa >= criteria.minimumCgpa;
    results.cgpa = {
      required: criteria.minimumCgpa,
      actual: student.cgpa,
      met: cgpaMet,
      message: cgpaMet
        ? `CGPA requirement met (${student.cgpa} ≥ ${criteria.minimumCgpa})`
        : `CGPA too low (${student.cgpa} < ${criteria.minimumCgpa} required)`,
    };
    if (!cgpaMet) allEligible = false;
  } else {
    results.cgpa = { met: true, message: 'No CGPA requirement' };
  }

  // Family income check
  if (criteria.maximumFamilyIncome > 0) {
    const incomeMet = student.familyIncome <= criteria.maximumFamilyIncome;
    results.income = {
      required: criteria.maximumFamilyIncome,
      actual: student.familyIncome,
      met: incomeMet,
      message: incomeMet
        ? `Income requirement met`
        : `Family income exceeds limit (₹${student.familyIncome} > ₹${criteria.maximumFamilyIncome})`,
    };
    if (!incomeMet) allEligible = false;
  } else {
    results.income = { met: true, message: 'No income requirement' };
  }

  // Course eligibility
  if (criteria.eligibleCourses && criteria.eligibleCourses.length > 0) {
    const courseMet = criteria.eligibleCourses.some(
      (c) => c.toLowerCase() === (student.course || '').toLowerCase()
    );
    results.course = {
      required: criteria.eligibleCourses,
      actual: student.course,
      met: courseMet,
      message: courseMet
        ? `Course eligible`
        : `Your course '${student.course}' is not in the eligible courses list`,
    };
    if (!courseMet) allEligible = false;
  } else {
    results.course = { met: true, message: 'All courses eligible' };
  }

  // Category eligibility
  if (
    criteria.eligibleCategories &&
    criteria.eligibleCategories.length > 0 &&
    !criteria.eligibleCategories.includes('all')
  ) {
    const categoryMet = criteria.eligibleCategories.includes(student.category);
    results.category = {
      required: criteria.eligibleCategories,
      actual: student.category,
      met: categoryMet,
      message: categoryMet
        ? `Category eligible`
        : `Your category '${student.category}' is not eligible for this scholarship`,
    };
    if (!categoryMet) allEligible = false;
  } else {
    results.category = { met: true, message: 'All categories eligible' };
  }

  // Year eligibility
  if (criteria.eligibleYears && criteria.eligibleYears.length > 0) {
    const yearMet = criteria.eligibleYears.includes(student.year);
    results.year = {
      required: criteria.eligibleYears,
      actual: student.year,
      met: yearMet,
      message: yearMet
        ? `Year eligible`
        : `Year ${student.year} is not eligible (eligible: ${criteria.eligibleYears.join(', ')})`,
    };
    if (!yearMet) allEligible = false;
  } else {
    results.year = { met: true, message: 'All years eligible' };
  }

  // Department eligibility
  if (criteria.eligibleDepartments && criteria.eligibleDepartments.length > 0) {
    const deptMet = criteria.eligibleDepartments.some(
      (d) => d.toLowerCase() === (student.department || '').toLowerCase()
    );
    results.department = {
      required: criteria.eligibleDepartments,
      actual: student.department,
      met: deptMet,
      message: deptMet
        ? `Department eligible`
        : `Department '${student.department}' is not in eligible departments`,
    };
    if (!deptMet) allEligible = false;
  } else {
    results.department = { met: true, message: 'All departments eligible' };
  }

  let failureReason;
  if (!allEligible) {
    const unmet = Object.values(results).filter((r) => !r.met).map((r) => r.message);
    failureReason = unmet.join('. ') || 'You do not meet the eligibility criteria for this scholarship';
  }

  return {
    eligible: allEligible,
    reason: failureReason,
    criteria: results,
    scholarship: {
      id: scholarship._id,
      name: scholarship.name,
      amount: scholarship.amount,
    },
  };
};

module.exports = { checkEligibility };
