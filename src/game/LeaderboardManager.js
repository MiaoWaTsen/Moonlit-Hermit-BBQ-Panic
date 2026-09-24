/**
 * LeaderboardManager: Manages Separate High Scores by Map and Mode (Local Storage)
 * Maps: 'map1' (月宮庭院), 'map2' (桂樹林天台)
 * Modes: '1p' (單人), '2p' (雙人)
 * Default State: Empty records (預設留空)
 */

export class LeaderboardManager {
  constructor() {
    this.prefix = 'moonlit_bbq_lb';
  }

  getStorageKey(mapId = 'map1', mode = '1p') {
    return `${this.prefix}_${mapId}_${mode}`;
  }

  getScores(mapId = 'map1', mode = '1p') {
    const key = this.getStorageKey(mapId, mode);
    try {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      return list.sort((a, b) => b.score - a.score);
    } catch (e) {
      return [];
    }
  }

  addScore(playerName, score, maxCombo = 1.0, mapId = 'map1', mode = '1p') {
    if (score <= 0) return this.getScores(mapId, mode);

    const key = this.getStorageKey(mapId, mode);
    const scores = this.getScores(mapId, mode);
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;
    const cleanName = (playerName || (mode === '2p' ? '玉兔 & 吳剛' : '玉兔大廚')).trim().slice(0, 20);

    const newEntry = {
      name: cleanName,
      score: score,
      combo: `x${maxCombo.toFixed(1)}`,
      date: dateStr
    };

    scores.push(newEntry);
    scores.sort((a, b) => b.score - a.score);

    // Keep top 50 scores
    const trimmed = scores.slice(0, 50).map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));

    localStorage.setItem(key, JSON.stringify(trimmed));
    return trimmed;
  }
}
