// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION — set these in Apps Script → Project Settings → Script Properties
//   SPREADSHEET_ID  — ID from your Google Sheet URL
//   DRIVE_FOLDER_ID — ID of the Drive folder for checkpoint photos
//   API_KEY         — any strong random string; must match REACT_APP_API_KEY
// ─────────────────────────────────────────────────────────────────────────────

function cfg(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

const MAX_PHOTO_B64_LEN = 20 * 1024 * 1024; // ~15 MB decoded

function checkKey(e) {
  const expected = cfg('API_KEY');
  if (!expected) return; // not configured → open (setup mode only)
  const provided = (e && e.parameter && e.parameter.key) || '';
  if (provided !== expected) throw new Error('Unauthorized');
}

// ─────────────────────────────────────────────────────────────────────────────
// SHEET HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const SHEET_HEADERS = {
  activities:  ['id','type','name','date','time','duration','sets','reps','weight','notes','source','createdAt'],
  exercises:   ['id','name','category','instructions'],
  templates:   ['id','name','description','exercises'],
  checkpoints: ['id','date','photoUrl','weight','bodyFat','chest','waist','hips','arms','notes','createdAt'],
};

function getSheet(name) {
  const ss = SpreadsheetApp.openById(cfg('SPREADSHEET_ID'));
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const h = SHEET_HEADERS[name];
    if (h) sheet.getRange(1, 1, 1, h.length).setValues([h]);
  }
  return sheet;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      const v = row[i];
      if (v instanceof Date) {
        // 'date' columns → YYYY-MM-DD; timestamps (createdAt) → ISO string
        obj[h] = h === 'date'
          ? Utilities.formatDate(v, 'UTC', 'yyyy-MM-dd')
          : v.toISOString();
      } else {
        obj[h] = v;
      }
    });
    return obj;
  });
}

function writeObjects(sheet, name, objects) {
  const headers = SHEET_HEADERS[name];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (objects.length > 0) {
    const rows = objects.map(obj => headers.map(h => obj[h] !== undefined ? obj[h] : ''));
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITIES
// ─────────────────────────────────────────────────────────────────────────────

function getActivities() {
  return sheetToObjects(getSheet('activities'));
}

function createActivity(d) {
  const sheet = getSheet('activities');
  const act = {
    id: Date.now().toString(),
    type: d.type || '', name: d.name || '', date: d.date || '',
    time: d.time || '', duration: d.duration || '',
    sets: d.sets || '', reps: d.reps || '', weight: d.weight || '',
    notes: d.notes || '', source: 'manual',
    createdAt: new Date().toISOString()
  };
  sheet.appendRow(SHEET_HEADERS.activities.map(h => act[h]));
  return act;
}

function updateActivity(id, d) {
  const sheet = getSheet('activities');
  const all = sheetToObjects(sheet);
  const idx = all.findIndex(a => String(a.id) === String(id));
  if (idx === -1) return { error: 'Not found' };
  const e = all[idx];
  all[idx] = {
    ...e,
    type:     d.type     !== undefined ? d.type     : e.type,
    name:     d.name     !== undefined ? d.name     : e.name,
    date:     d.date     !== undefined ? d.date     : e.date,
    time:     d.time     !== undefined ? d.time     : e.time,
    duration: d.duration !== undefined ? d.duration : e.duration,
    sets:     d.sets     !== undefined ? d.sets     : e.sets,
    reps:     d.reps     !== undefined ? d.reps     : e.reps,
    weight:   d.weight   !== undefined ? d.weight   : e.weight,
    notes:    d.notes    !== undefined ? d.notes    : e.notes,
  };
  writeObjects(sheet, 'activities', all);
  return all[idx];
}

function deleteActivity(id) {
  const sheet = getSheet('activities');
  const all = sheetToObjects(sheet);
  writeObjects(sheet, 'activities', all.filter(a => String(a.id) !== String(id)));
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISES
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_EXERCISES = [
  { id: 'bench-press',       name: 'Bench Press',         category: 'Push', instructions: '' },
  { id: 'overhead-press',    name: 'Overhead Press',       category: 'Push', instructions: '' },
  { id: 'incline-bench',     name: 'Incline Bench Press',  category: 'Push', instructions: '' },
  { id: 'push-ups',          name: 'Push-ups',             category: 'Push', instructions: '' },
  { id: 'dips',              name: 'Dips',                 category: 'Push', instructions: '' },
  { id: 'pull-ups',          name: 'Pull-ups',             category: 'Pull', instructions: '' },
  { id: 'chin-ups',          name: 'Chin-ups',             category: 'Pull', instructions: '' },
  { id: 'barbell-row',       name: 'Barbell Row',          category: 'Pull', instructions: '' },
  { id: 'dumbbell-row',      name: 'Dumbbell Row',         category: 'Pull', instructions: '' },
  { id: 'lat-pulldown',      name: 'Lat Pulldown',         category: 'Pull', instructions: '' },
  { id: 'face-pull',         name: 'Face Pull',            category: 'Pull', instructions: '' },
  { id: 'squat',             name: 'Squat',                category: 'Legs', instructions: '' },
  { id: 'deadlift',          name: 'Deadlift',             category: 'Legs', instructions: '' },
  { id: 'rdl',               name: 'Romanian Deadlift',    category: 'Legs', instructions: '' },
  { id: 'leg-press',         name: 'Leg Press',            category: 'Legs', instructions: '' },
  { id: 'lunges',            name: 'Lunges',               category: 'Legs', instructions: '' },
  { id: 'hip-thrust',        name: 'Hip Thrust',           category: 'Legs', instructions: '' },
  { id: 'calf-raises',       name: 'Calf Raises',          category: 'Legs', instructions: '' },
  { id: 'bicep-curl',        name: 'Bicep Curl',           category: 'Arms', instructions: '' },
  { id: 'hammer-curl',       name: 'Hammer Curl',          category: 'Arms', instructions: '' },
  { id: 'tricep-pushdown',   name: 'Tricep Pushdown',      category: 'Arms', instructions: '' },
  { id: 'skull-crusher',     name: 'Skull Crusher',        category: 'Arms', instructions: '' },
  { id: 'plank',             name: 'Plank',                category: 'Core', instructions: '' },
  { id: 'ab-wheel',          name: 'Ab Wheel',             category: 'Core', instructions: '' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise',    category: 'Core', instructions: '' },
];

function getExercises() {
  const sheet = getSheet('exercises');
  const all = sheetToObjects(sheet);
  if (all.length === 0) {
    const rows = DEFAULT_EXERCISES.map(e => SHEET_HEADERS.exercises.map(h => e[h] || ''));
    sheet.getRange(2, 1, rows.length, SHEET_HEADERS.exercises.length).setValues(rows);
    return DEFAULT_EXERCISES;
  }
  return all;
}

function createExercise(d) {
  const sheet = getSheet('exercises');
  const ex = {
    id: Date.now().toString(),
    name: (d.name || '').trim(),
    category: (d.category || 'Other').trim(),
    instructions: (d.instructions || '').trim()
  };
  sheet.appendRow(SHEET_HEADERS.exercises.map(h => ex[h]));
  return ex;
}

function updateExercise(id, d) {
  const sheet = getSheet('exercises');
  const all = sheetToObjects(sheet);
  const idx = all.findIndex(e => String(e.id) === String(id));
  if (idx === -1) return { error: 'Not found' };
  all[idx] = {
    ...all[idx],
    name:         d.name         ? d.name.trim()         : all[idx].name,
    category:     d.category     ? d.category.trim()     : all[idx].category,
    instructions: d.instructions !== undefined ? d.instructions.trim() : (all[idx].instructions || ''),
  };
  writeObjects(sheet, 'exercises', all);
  return all[idx];
}

function deleteExercise(id) {
  const sheet = getSheet('exercises');
  const all = sheetToObjects(sheet);
  writeObjects(sheet, 'exercises', all.filter(e => String(e.id) !== String(id)));
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

function getTemplates() {
  return sheetToObjects(getSheet('templates')).map(t => ({
    ...t,
    exercises: t.exercises ? JSON.parse(t.exercises) : []
  }));
}

function createTemplate(d) {
  const sheet = getSheet('templates');
  const t = {
    id: Date.now().toString(),
    name: (d.name || '').trim(),
    description: (d.description || '').trim(),
    exercises: JSON.stringify(d.exercises || [])
  };
  sheet.appendRow(SHEET_HEADERS.templates.map(h => t[h]));
  return { ...t, exercises: d.exercises || [] };
}

function updateTemplate(id, d) {
  const sheet = getSheet('templates');
  const all = sheetToObjects(sheet);
  const idx = all.findIndex(t => String(t.id) === String(id));
  if (idx === -1) return { error: 'Not found' };
  const e = all[idx];
  all[idx] = {
    ...e,
    name:        d.name        ? d.name.trim()        : e.name,
    description: d.description !== undefined ? d.description.trim() : e.description,
    exercises:   d.exercises   !== undefined ? JSON.stringify(d.exercises) : e.exercises,
  };
  writeObjects(sheet, 'templates', all);
  return { ...all[idx], exercises: JSON.parse(all[idx].exercises) };
}

function deleteTemplate(id) {
  const sheet = getSheet('templates');
  const all = sheetToObjects(sheet);
  writeObjects(sheet, 'templates', all.filter(t => String(t.id) !== String(id)));
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

function getProfile() {
  const sheet = getSheet('profile');
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { height: '' };
  // Stored as key/value pairs: row1=[key,value], row2=[height,175], ...
  const profile = {};
  data.slice(1).forEach(row => { if (row[0]) profile[row[0]] = row[1]; });
  return profile;
}

function updateProfile(d) {
  const sheet = getSheet('profile');
  const current = getProfile();
  const updated = { ...current, ...d };
  sheet.clearContents();
  sheet.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
  const rows = Object.entries(updated).map(([k, v]) => [k, v]);
  if (rows.length > 0) sheet.getRange(2, 1, rows.length, 2).setValues(rows);
  return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECKPOINTS + DRIVE PHOTOS
// ─────────────────────────────────────────────────────────────────────────────

function uploadPhoto(base64Data, mimeType) {
  if (base64Data.length > MAX_PHOTO_B64_LEN) throw new Error('Photo exceeds 15 MB limit');
  const folder = DriveApp.getFolderById(cfg('DRIVE_FOLDER_ID'));
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    mimeType,
    'checkpoint_' + Date.now() + '.' + ext
  );
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1000';
}

function trashDrivePhoto(url) {
  try {
    const match = url && url.match(/id=([^&]+)/);
    if (match) DriveApp.getFileById(match[1]).setTrashed(true);
  } catch (e) { /* ignore */ }
}

function getCheckpoints() {
  return sheetToObjects(getSheet('checkpoints')).map(cp => ({
    ...cp, photo: cp.photoUrl || ''
  }));
}

function createCheckpoint(d) {
  const sheet = getSheet('checkpoints');
  const photoUrl = d.photoData ? uploadPhoto(d.photoData, d.photoMime || 'image/jpeg') : '';
  const cp = {
    id: Date.now().toString(),
    date: d.date || '',
    photoUrl,
    weight: d.weight || '', bodyFat: d.bodyFat || '',
    chest: d.chest || '', waist: d.waist || '',
    hips: d.hips || '', arms: d.arms || '',
    notes: d.notes || '',
    createdAt: new Date().toISOString()
  };
  sheet.appendRow(SHEET_HEADERS.checkpoints.map(h => cp[h]));
  return { ...cp, photo: cp.photoUrl };
}

function updateCheckpoint(id, d) {
  const sheet = getSheet('checkpoints');
  const all = sheetToObjects(sheet);
  const idx = all.findIndex(c => String(c.id) === String(id));
  if (idx === -1) return { error: 'Not found' };
  const e = all[idx];
  let photoUrl = e.photoUrl;
  if (d.photoData) {
    trashDrivePhoto(e.photoUrl);
    photoUrl = uploadPhoto(d.photoData, d.photoMime || 'image/jpeg');
  }
  all[idx] = {
    ...e,
    date:    d.date    !== undefined ? d.date    : e.date,
    photoUrl,
    weight:  d.weight  !== undefined ? d.weight  : e.weight,
    bodyFat: d.bodyFat !== undefined ? d.bodyFat : e.bodyFat,
    chest:   d.chest   !== undefined ? d.chest   : e.chest,
    waist:   d.waist   !== undefined ? d.waist   : e.waist,
    hips:    d.hips    !== undefined ? d.hips    : e.hips,
    arms:    d.arms    !== undefined ? d.arms    : e.arms,
    notes:   d.notes   !== undefined ? d.notes   : e.notes,
  };
  writeObjects(sheet, 'checkpoints', all);
  return { ...all[idx], photo: all[idx].photoUrl };
}

function deleteCheckpoint(id) {
  const sheet = getSheet('checkpoints');
  const all = sheetToObjects(sheet);
  const cp = all.find(c => String(c.id) === String(id));
  if (!cp) return { error: 'Not found' };
  trashDrivePhoto(cp.photoUrl);
  writeObjects(sheet, 'checkpoints', all.filter(c => String(c.id) !== String(id)));
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP ROUTER
// ─────────────────────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    checkKey(e);
    const resource = e.parameter.resource;
    let result;
    switch (resource) {
      case 'activities':  result = getActivities();  break;
      case 'exercises':   result = getExercises();   break;
      case 'templates':   result = getTemplates();   break;
      case 'profile':     result = getProfile();     break;
      case 'checkpoints': result = getCheckpoints(); break;
      default: result = { error: 'Unknown resource: ' + resource };
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    checkKey(e);
    const body = JSON.parse(e.postData.contents);
    const { _resource, _method, _id, ...data } = body;
    let result;
    switch (_resource) {
      case 'activities':
        if      (_method === 'DELETE') result = deleteActivity(_id);
        else if (_method === 'PUT')    result = updateActivity(_id, data);
        else                           result = createActivity(data);
        break;
      case 'exercises':
        if      (_method === 'DELETE') result = deleteExercise(_id);
        else if (_method === 'PUT')    result = updateExercise(_id, data);
        else                           result = createExercise(data);
        break;
      case 'templates':
        if      (_method === 'DELETE') result = deleteTemplate(_id);
        else if (_method === 'PUT')    result = updateTemplate(_id, data);
        else                           result = createTemplate(data);
        break;
      case 'profile':
        result = updateProfile(data);
        break;
      case 'checkpoints':
        if      (_method === 'DELETE') result = deleteCheckpoint(_id);
        else if (_method === 'PUT')    result = updateCheckpoint(_id, data);
        else                           result = createCheckpoint(data);
        break;
      default:
        result = { error: 'Unknown resource: ' + _resource };
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
