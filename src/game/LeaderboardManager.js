/**
 * LeaderboardManager: Manages Separate 1P and 2P High Scores with Seed Rankings
 */

export class LeaderboardManager {
  constructor() {
    this.storageKey1P = 'moonlit_bbq_leaderboard_1p';
    this.storageKey2P = 'moonlit_bbq_leaderboard_2p';
    this.initLeaderboard();
  }

  initLeaderboard() {
    try {
      // 1P Seed Rankings
      const saved1P = localStorage.getItem(this.storageKey1P);
      if (!saved1P) {
        const seed1P = [
          { rank: 1, name: '嫦娥仙子 🌙', score: 3250, combo: 'x2.4', date: '2026/09/24' },
          { rank: 2, name: '廣寒宮兔王 🐰', score: 2600, combo: 'x2.2', date: '2026/09/24' },
          { rank: 3, name: '月宮掌杓小神 ✨', score: 2100, combo: 'x2.0', date: '2026/09/23' },
          { rank: 4, name: '玉兔學徒 🥕', score: 1550, combo: 'x1.6', date: '2026/09/22' },
          { rank: 5, name: '炭火新手 🍢', score: 980, combo: 'x1.2', date: '2026/09/21' }
        ];
        localStorage.setItem(this.storageKey1P, JSON.stringify(seed1P));
      }

      // 2P Seed Rankings
      const saved2P = localStorage.getItem(this.storageKey2P);
      if (!saved2P) {
        const seed2P = [
          { rank: 1, name: '玉兔 & 吳剛 🐰🪓', score: 4850, combo: 'x3.2', date: '2026/09/24' },
          { rank: 2, name: '嫦娥 & 后羿 🌙🏹', score: 4200, combo: 'x2.8', date: '2026/09/23' },
          { rank: 3, name: '齊天大聖 & 哪吒 🐵🔥', score: 3600, combo: 'x2.5', date: '2026/09/23' },
          { rank: 4, name: '太上老君 & 土地公 🍶🌾', score: 2800, combo: 'x2.0', date: '2026/09/22' },
          { rank: 5, name: '天蓬元帥 & 沙悟淨 🐷🐟', score: 2200, combo: 'x1.8', date: '2026/09/20' }
        ];
        localStorage.setItem(this.storageKey2P, JSON.stringify(seed2P));
      }
    } catch (e) {}
  }

  getScores(mode = '1p') {
    const key = mode === '2p' ? this.storageKey2P : this.storageKey1P;
    try {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      return list.sort((a, b) => b.score - a.score);
    } catch (e) {
      return [];
    }
  }

  addScore(playerName, score, maxCombo = 1.0, mode = '1p') {
    if (score <= 0) return this.getScores(mode);

    const key = mode === '2p' ? this.storageKey2P : this.storageKey1P;
    const scores = this.getScores(mode);
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;

    const newEntry = {
      name: playerName || (mode === '2p' ? '玉兔 & 吳剛' : '訪客大廚'),
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
