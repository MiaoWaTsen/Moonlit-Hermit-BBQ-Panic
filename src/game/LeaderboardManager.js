/**
 * LeaderboardManager: Manages Global & Personal High Scores with Seed Rankings
 */

export class LeaderboardManager {
  constructor() {
    this.storageKey = 'moonlit_bbq_leaderboard';
    this.initLeaderboard();
  }

  initLeaderboard() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) {
        // Seed thematic high score rankings
        const seedScores = [
          { rank: 1, name: '嫦娥仙子 🌙', score: 3250, combo: 'x2.4', date: '2026/09/24' },
          { rank: 2, name: '吳剛斧神 🪓', score: 2800, combo: 'x2.2', date: '2026/09/23' },
          { rank: 3, name: '齊天大聖 🐵', score: 2400, combo: 'x2.0', date: '2026/09/22' },
          { rank: 4, name: '廣寒宮兔王 🐰', score: 1950, combo: 'x1.8', date: '2026/09/24' },
          { rank: 5, name: '太上老君 🍶', score: 1600, combo: 'x1.6', date: '2026/09/21' },
          { rank: 6, name: '天蓬元帥 🐷', score: 1200, combo: 'x1.4', date: '2026/09/20' }
        ];
        localStorage.setItem(this.storageKey, JSON.stringify(seedScores));
      }
    } catch (e) {}
  }

  getScores() {
    try {
      const list = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      return list.sort((a, b) => b.score - a.score);
    } catch (e) {
      return [];
    }
  }

  addScore(playerName, score, maxCombo = 1.0) {
    if (score <= 0) return this.getScores();

    const scores = this.getScores();
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;

    const newEntry = {
      name: playerName || '匿名大廚',
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

    localStorage.setItem(this.storageKey, JSON.stringify(trimmed));
    return trimmed;
  }
}
