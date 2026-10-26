import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime,
  formatDurationHuman,
  calculateWeightDelta,
  generatePTSummary,
  reorderItems,
  validateImportData,
  evaluateSetTarget,
  evaluateExerciseTarget,
  evaluateSessionTargets,
} from './workoutUtils';
import { WeightEntry, WorkoutSession, LoggedExercise, LoggedSet } from '../types';

test('formatTime correctly formats seconds', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(45), '00:45');
  assert.equal(formatTime(90), '01:30');
  assert.equal(formatTime(3600), '01:00:00');
  assert.equal(formatTime(3665), '01:01:05');
  assert.equal(formatTime(-10), '00:00');
});

test('formatDurationHuman formats friendly strings', () => {
  assert.equal(formatDurationHuman(45), '45s');
  assert.equal(formatDurationHuman(60), '1m');
  assert.equal(formatDurationHuman(90), '1m 30s');
  assert.equal(formatDurationHuman(120), '2m');
});

test('calculateWeightDelta computes chronological differences', () => {
  const entries: WeightEntry[] = [
    { id: '1', userId: 'u1', date: '2026-10-01', weightKg: 75.0, createdAt: '' },
    { id: '2', userId: 'u1', date: '2026-10-08', weightKg: 74.6, createdAt: '' },
    { id: '3', userId: 'u1', date: '2026-10-15', weightKg: 74.2, createdAt: '' },
    { id: '4', userId: 'u1', date: '2026-10-22', weightKg: 74.5, createdAt: '' },
  ];

  const result = calculateWeightDelta(entries);
  // Returns descending order (most recent first)
  assert.equal(result.length, 4);
  assert.equal(result[0].date, '2026-10-22');
  assert.equal(result[0].delta, 0.3); // 74.5 - 74.2 = +0.3
  assert.equal(result[1].date, '2026-10-15');
  assert.equal(result[1].delta, -0.4); // 74.2 - 74.6 = -0.4
  assert.equal(result[2].date, '2026-10-08');
  assert.equal(result[2].delta, -0.4); // 74.6 - 75.0 = -0.4
  assert.equal(result[3].date, '2026-10-01');
  assert.equal(result[3].delta, null); // first entry has no delta
});

test('generatePTSummary outputs properly formatted Italian text', () => {
  const mockSession: WorkoutSession = {
    id: 's1',
    userId: 'u1',
    dayName: 'Giorno A - Spinta',
    date: '2026-10-25',
    startTime: '10:00',
    durationSeconds: 3600,
    notes: 'Ottime sensazioni alle parallele',
    completedItems: [
      {
        itemId: 'abs-1',
        name: 'Hollow Body Hold',
        section: 'abs',
        sets: [
          { setNumber: 1, target: '3x30s', completedRepsOrSec: 30, completed: true },
          { setNumber: 2, target: '3x30s', completedRepsOrSec: 30, completed: true },
        ],
      },
      {
        itemId: 'w-1',
        name: 'Dip alle parallele',
        section: 'workout',
        sets: [
          { setNumber: 1, target: '4x8', completedRepsOrSec: 8, weightKg: 10, completed: true },
          { setNumber: 2, target: '4x8', completedRepsOrSec: 8, weightKg: 10, completed: true },
        ],
      },
    ],
    createdAt: '2026-10-25T11:00:00Z',
  };

  const summary = generatePTSummary(mockSession);
  assert.ok(summary.includes('REPORT ALLENAMENTO CALISTHENICS'));
  assert.ok(summary.includes('Giorno A - Spinta'));
  assert.ok(summary.includes('01:00:00'));
  assert.ok(summary.includes('Hollow Body Hold'));
  assert.ok(summary.includes('Dip alle parallele'));
  assert.ok(summary.includes('+10kg'));
  assert.ok(summary.includes('Ottime sensazioni alle parallele'));
});

test('reorderItems moves elements without mutating input', () => {
  const original = ['A', 'B', 'C', 'D'];
  const moved = reorderItems(original, 0, 2);
  assert.deepEqual(moved, ['B', 'C', 'A', 'D']);
  assert.deepEqual(original, ['A', 'B', 'C', 'D']);
});

test('validateImportData validates correct and corrupt payloads', () => {
  const validJson = JSON.stringify({
    version: 1,
    days: [{ id: '1', name: 'Giorno 1' }],
    sessions: [],
    weightEntries: [],
  });

  const validRes = validateImportData(validJson);
  assert.equal(validRes.valid, true);
  assert.equal(validRes.data?.days.length, 1);

  const invalidJson = 'not a json';
  const invalidRes = validateImportData(invalidJson);
  assert.equal(invalidRes.valid, false);

  const missingFieldsJson = JSON.stringify({ something: 'random' });
  const missingRes = validateImportData(missingFieldsJson);
  assert.equal(missingRes.valid, false);
});

test('evaluateSetTarget accurately detects reached vs below target', () => {
  const setExact: LoggedSet = {
    setNumber: 1,
    target: '8 rip',
    completedRepsOrSec: 8,
    completed: true,
  };
  const evalExact = evaluateSetTarget(setExact);
  assert.equal(evalExact.isReached, true);
  assert.equal(evalExact.targetNum, 8);
  assert.equal(evalExact.diff, 0);

  const setSurpassed: LoggedSet = {
    setNumber: 2,
    target: '8 rip',
    completedRepsOrSec: 10,
    completed: true,
  };
  const evalSurpassed = evaluateSetTarget(setSurpassed);
  assert.equal(evalSurpassed.isReached, true);
  assert.equal(evalSurpassed.diff, 2);

  const setMissed: LoggedSet = {
    setNumber: 3,
    target: '8 rip',
    completedRepsOrSec: 6,
    completed: true,
  };
  const evalMissed = evaluateSetTarget(setMissed);
  assert.equal(evalMissed.isReached, false);
  assert.equal(evalMissed.diff, -2);

  const setDuration: LoggedSet = {
    setNumber: 1,
    target: '30 s',
    completedRepsOrSec: 30,
    completed: true,
  };
  const evalDuration = evaluateSetTarget(setDuration);
  assert.equal(evalDuration.isReached, true);
  assert.equal(evalDuration.unit, 'sec');
});

test('evaluateExerciseTarget checks all sets and flags fully reached', () => {
  const fullExercise: LoggedExercise = {
    itemId: 'ex-1',
    name: 'Dip',
    section: 'workout',
    sets: [
      { setNumber: 1, target: '8 rip', completedRepsOrSec: 8, completed: true },
      { setNumber: 2, target: '8 rip', completedRepsOrSec: 8, completed: true },
    ],
  };
  const resFull = evaluateExerciseTarget(fullExercise);
  assert.equal(resFull.isFullyReached, true);
  assert.equal(resFull.reachedSetsCount, 2);
  assert.equal(resFull.totalSetsCount, 2);

  const partialExercise: LoggedExercise = {
    itemId: 'ex-2',
    name: 'Pull-up',
    section: 'workout',
    sets: [
      { setNumber: 1, target: '8 rip', completedRepsOrSec: 8, completed: true },
      { setNumber: 2, target: '8 rip', completedRepsOrSec: 6, completed: true },
    ],
  };
  const resPartial = evaluateExerciseTarget(partialExercise);
  assert.equal(resPartial.isFullyReached, false);
  assert.equal(resPartial.reachedSetsCount, 1);
  assert.equal(resPartial.totalSetsCount, 2);
});

