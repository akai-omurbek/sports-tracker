import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, '../data/activities.csv');

// Ensure data directory exists
const dataDir = path.dirname(CSV_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export async function readActivities() {
  try {
    if (!fs.existsSync(CSV_PATH)) {
      return [];
    }

    const content = fs.readFileSync(CSV_PATH, 'utf-8');
    if (!content.trim()) {
      return [];
    }

    const records = parse(content, {
      columns: true,
      skip_empty_lines: true
    });

    return records;
  } catch (error) {
    console.error('Error reading CSV:', error);
    return [];
  }
}

export async function writeActivities(activities) {
  try {
    const csv = stringify(activities, {
      header: true,
      columns: ['id', 'type', 'name', 'date', 'time', 'duration', 'sets', 'reps', 'weight', 'notes', 'source', 'createdAt']
    });

    fs.writeFileSync(CSV_PATH, csv);
  } catch (error) {
    console.error('Error writing CSV:', error);
    throw error;
  }
}
