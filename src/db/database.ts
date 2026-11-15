import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const DB_NAME = 'k9care.db';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const MIGRATIONS_SQL = `
    CREATE TABLE IF NOT EXISTS dogs (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      photoUri TEXT,
      breed TEXT,
      dob TEXT,
      weightKg REAL,
      notes TEXT,
      primaryConditions TEXT
    );

    CREATE TABLE IF NOT EXISTS breathing_checks (
      id TEXT PRIMARY KEY NOT NULL,
      dogId TEXT NOT NULL,
      breathsPerMinute INTEGER NOT NULL,
      durationSeconds INTEGER NOT NULL,
      context TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY(dogId) REFERENCES dogs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS seizure_events (
      id TEXT PRIMARY KEY NOT NULL,
      dogId TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      durationSeconds INTEGER NOT NULL,
      severity INTEGER,
      checklistJson TEXT,
      triggers TEXT,
      notes TEXT,
      FOREIGN KEY(dogId) REFERENCES dogs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS medications (
      id TEXT PRIMARY KEY NOT NULL,
      dogId TEXT NOT NULL,
      name TEXT NOT NULL,
      dose REAL NOT NULL,
      unit TEXT NOT NULL,
      scheduleType TEXT NOT NULL,
      timesOfDayJson TEXT,
      intervalHours INTEGER,
      startDate TEXT NOT NULL,
      endDate TEXT,
      notes TEXT,
      FOREIGN KEY(dogId) REFERENCES dogs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vaccinations (
      id TEXT PRIMARY KEY NOT NULL,
      dogId TEXT NOT NULL,
      vaccineName TEXT NOT NULL,
      vaccineDate TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(dogId) REFERENCES dogs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS medication_logs (
      id TEXT PRIMARY KEY NOT NULL,
      medicationId TEXT NOT NULL,
      dogId TEXT NOT NULL,
      plannedTime TEXT NOT NULL,
      givenAt TEXT,
      status TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY(medicationId) REFERENCES medications(id) ON DELETE CASCADE,
      FOREIGN KEY(dogId) REFERENCES dogs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS event_markers (
      id TEXT PRIMARY KEY NOT NULL,
      dogId TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(dogId) REFERENCES dogs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS weight_logs (
      id TEXT PRIMARY KEY NOT NULL,
      dogId TEXT NOT NULL,
      weightKg REAL NOT NULL,
      createdAt TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY(dogId) REFERENCES dogs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mobility_logs (
      id TEXT PRIMARY KEY NOT NULL,
      dogId TEXT NOT NULL,
      stiffnessOnWaking INTEGER,
      stairsDifficulty INTEGER,
      jumpingDifficulty INTEGER,
      walkTolerance INTEGER,
      overallPain INTEGER,
      createdAt TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY(dogId) REFERENCES dogs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS allergy_logs (
      id TEXT PRIMARY KEY NOT NULL,
      dogId TEXT NOT NULL,
      itchSeverity INTEGER,
      skinLesions INTEGER,
      earIssues INTEGER,
      bodyAreas TEXT,
      triggersJson TEXT,
      createdAt TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY(dogId) REFERENCES dogs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stool_logs (
      id TEXT PRIMARY KEY NOT NULL,
      dogId TEXT NOT NULL,
      stoolScore INTEGER,
      hasBlood INTEGER,
      hasMucus INTEGER,
      vomiting INTEGER,
      diarrhea INTEGER,
      appetite TEXT,
      createdAt TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY(dogId) REFERENCES dogs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS insulin_logs (
      id TEXT PRIMARY KEY NOT NULL,
      dogId TEXT NOT NULL,
      doseUnits REAL NOT NULL,
      givenAt TEXT NOT NULL,
      relationToMeal TEXT,
      notes TEXT,
      FOREIGN KEY(dogId) REFERENCES dogs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS glucose_readings (
      id TEXT PRIMARY KEY NOT NULL,
      dogId TEXT NOT NULL,
      value REAL NOT NULL,
      takenAt TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY(dogId) REFERENCES dogs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS kidney_logs (
      id TEXT PRIMARY KEY NOT NULL,
      dogId TEXT NOT NULL,
      waterIntakeMl REAL,
      urinationCount INTEGER,
      accidentsCount INTEGER,
      createdAt TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY(dogId) REFERENCES dogs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS anxiety_logs (
      id TEXT PRIMARY KEY NOT NULL,
      dogId TEXT NOT NULL,
      trigger TEXT,
      severity INTEGER,
      durationMinutes INTEGER,
      createdAt TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY(dogId) REFERENCES dogs(id) ON DELETE CASCADE
    );
`;

async function runMigrations(database: SQLite.SQLiteDatabase) {
  await database.execAsync(MIGRATIONS_SQL);
}

/** Open DB asynchronously (required on web before sync APIs). */
export async function initDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const database = await SQLite.openDatabaseAsync(DB_NAME);
    await runMigrations(database);
    db = database;
    return database;
  })();

  try {
    return await initPromise;
  } catch (error) {
    initPromise = null;
    throw error;
  }
}

export function getDb(): SQLite.SQLiteDatabase {
  if (db) return db;

  // Native can open sync; web must call initDb() first (DogProvider does this).
  if (Platform.OS === 'web') {
    throw new Error(
      'Database is not ready yet. Wait for the app to finish loading, then try again.',
    );
  }

  db = SQLite.openDatabaseSync(DB_NAME);
  // Migrations are sync on native for first open without awaiting initDb.
  databaseExecSyncFallback(db);
  return db;
}

function databaseExecSyncFallback(database: SQLite.SQLiteDatabase) {
  database.execSync(MIGRATIONS_SQL);
}
