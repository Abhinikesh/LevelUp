/**
 * examScheduler.js
 * Calculates exam mode schedule, urgency levels, and daily targets
 */

/**
 * Get the number of days between two dates (positive if future)
 */
function daysBetween(from, to) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(0, 0, 0, 0);
  return Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
}

/**
 * Get today's date at midnight
 */
function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get tomorrow's date at midnight
 */
function tomorrowStart() {
  const d = todayStart();
  d.setDate(d.getDate() + 1);
  return d;
}

/**
 * calculateExamSchedule
 * @param {Object} roadmap - Roadmap document (with examDate, totalLevels)
 * @param {Array} levels - Array of Level documents
 * @param {Array} completionsToday - Level completions done today by user
 * @returns {Object} Full exam schedule status
 */
function calculateExamSchedule(roadmap, levels, completionsToday = []) {
  const now = new Date();
  const examDate = roadmap.examDate ? new Date(roadmap.examDate) : null;

  // Guard: if no valid exam date, return a safe default
  if (!examDate || isNaN(examDate.getTime())) {
    return {
      examDate: null,
      totalDays: null,
      totalLevels: levels.length,
      completedLevels: levels.filter(l => l.isCompleted).length,
      remainingLevels: levels.filter(l => !l.isCompleted).length,
      dailyTarget: 1,
      levelsCompletedToday: completionsToday.length,
      levelsNeededToday: 1,
      onTrack: true,
      urgencyLevel: 'comfortable',
      dailyHours: 1,
      intensity: 'Easy',
      daysUsed: 0,
      isExamOver: false,
      isExamToday: false,
    };
  }

  // Days remaining from today to exam day
  const totalDays = daysBetween(now, examDate);
  const totalLevels = levels.length;
  const completedLevels = levels.filter(l => l.isCompleted).length;
  const remainingLevels = totalLevels - completedLevels;

  // Levels completed today
  const levelsCompletedToday = completionsToday.length;

  // How many days we've used since roadmap creation
  const daysUsed = daysBetween(new Date(roadmap.createdAt), now);

  // Daily target calculation
  const dailyTarget = totalDays > 0
    ? Math.ceil(remainingLevels / Math.max(totalDays, 1))
    : remainingLevels; // All remaining needed today if exam is today

  const levelsNeededToday = Math.max(0, dailyTarget - levelsCompletedToday);
  const onTrack = levelsCompletedToday >= dailyTarget || remainingLevels === 0;

  // Urgency level
  let urgencyLevel;
  if (remainingLevels === 0) {
    urgencyLevel = 'comfortable'; // All done!
  } else if (totalDays <= 0) {
    urgencyLevel = 'critical'; // Exam is today or passed
  } else if (totalDays === 1) {
    urgencyLevel = 'critical'; // Exam tomorrow
  } else if (totalDays <= 3 || !onTrack) {
    urgencyLevel = 'urgent';
  } else if (totalDays <= 7) {
    urgencyLevel = 'normal';
  } else {
    urgencyLevel = 'comfortable';
  }

  // Hours estimate
  const avgMinutesPerLevel = levels.length > 0
    ? levels.reduce((sum, l) => sum + (l.estimatedMinutes || 60), 0) / levels.length
    : 60;
  const dailyHours = Math.round((dailyTarget * avgMinutesPerLevel) / 60 * 10) / 10;

  // Intensity label
  let intensity;
  if (dailyHours <= 1) intensity = 'Easy';
  else if (dailyHours <= 3) intensity = 'Moderate';
  else intensity = 'Intense';

  return {
    examDate: examDate.toISOString(),
    totalDays,
    totalLevels,
    completedLevels,
    remainingLevels,
    dailyTarget,
    levelsCompletedToday,
    levelsNeededToday,
    onTrack,
    urgencyLevel,
    dailyHours,
    intensity,
    daysUsed,
    isExamOver: totalDays < 0,
    isExamToday: totalDays === 0,
  };
}

module.exports = { calculateExamSchedule, daysBetween };
