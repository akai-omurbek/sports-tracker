export const STRENGTH_EXERCISES = [
  // Push
  'Bench Press', 'Overhead Press', 'Incline Bench Press', 'Push-ups', 'Dips',
  // Pull
  'Pull-ups', 'Chin-ups', 'Barbell Row', 'Dumbbell Row', 'Lat Pulldown', 'Face Pull',
  // Legs
  'Squat', 'Deadlift', 'Romanian Deadlift', 'Leg Press', 'Lunges', 'Hip Thrust', 'Calf Raises',
  // Arms
  'Bicep Curl', 'Hammer Curl', 'Tricep Pushdown', 'Skull Crusher',
  // Core
  'Plank', 'Ab Wheel', 'Hanging Leg Raise',
  // Other
  'Other'
];

export const ACTIVITY_TYPES = [
  'Strength Training', 'Running', 'Walking', 'Cycling',
  'Hiking', 'Swimming', 'Yoga', 'Workout', 'Other'
];

export const EMOJI = {
  'Walking': '🚶', 'Running': '🏃', 'Cycling': '🚴', 'Hiking': '🥾',
  'Workout': '💪', 'Swimming': '🏊', 'Yoga': '🧘', 'Strength Training': '🏋️',
  'Other': '🎯'
};

export function activityEmoji(type) { return EMOJI[type] || '🎯'; }

export function isStrength(type) { return type === 'Strength Training'; }

export function formatDetail(a) {
  if (a.sets && a.reps) {
    return `${a.sets} × ${a.reps} reps${a.weight ? ` @ ${a.weight}kg` : ''}`;
  }
  if (a.duration) return `${a.duration} min`;
  return '—';
}

export function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function todayDate() {
  return new Date().toISOString().split('T')[0];
}
