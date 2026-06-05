import Dexie from 'dexie'

export const db = new Dexie('stepup-offline-db')

// Declare tables and indexes
db.version(1).stores({
  roadmaps: '++id, _id, title, type, currentLevel, isCompleted',
  levels: '++id, _id, roadmapId, levelNumber, title, isCompleted, isLocked',
  completionsQueue: '++id, levelId, proofData, queuedAt',
})

/**
 * Cache list of roadmaps offline
 */
export async function cacheRoadmaps(roadmapsList) {
  try {
    await db.roadmaps.clear();
    await db.roadmaps.bulkAdd(roadmapsList);
  } catch (err) {
    console.error('Failed to cache roadmaps offline:', err);
  }
}

/**
 * Cache list of levels offline
 */
export async function cacheLevels(levelsList) {
  try {
    // Add or update levels
    for (const lvl of levelsList) {
      const existing = await db.levels.where('_id').equals(lvl._id).first();
      if (existing) {
        await db.levels.update(existing.id, lvl);
      } else {
        await db.levels.add(lvl);
      }
    }
  } catch (err) {
    console.error('Failed to cache levels offline:', err);
  }
}

/**
 * Queue completion request offline
 */
export async function queueCompletion(levelId, proofData) {
  try {
    await db.completionsQueue.add({
      levelId,
      proofData,
      queuedAt: new Date().toISOString()
    });
    
    // Update local level completion state in IndexedDB immediately for seamless UI
    const existing = await db.levels.where('_id').equals(levelId).first();
    if (existing) {
      await db.levels.update(existing.id, { isCompleted: true });
      
      // Attempt to unlock next level locally in IndexedDB
      const nextLvl = await db.levels
        .where('roadmapId').equals(existing.roadmapId)
        .and(l => l.levelNumber === existing.levelNumber + 1)
        .first();
      if (nextLvl) {
        await db.levels.update(nextLvl.id, { isLocked: false });
      }
    }
  } catch (err) {
    console.error('Failed to queue offline completion:', err);
  }
}
