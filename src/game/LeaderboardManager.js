import { createClient } from '@supabase/supabase-js';

/**
 * LeaderboardManager: Manages Separate High Scores by Map and Mode
 * Supports Supabase Cloud Database with graceful LocalStorage fallback.
 * Maps: 'map1' (月宮庭院), 'map2' (桂樹林天台)
 * Modes: '1p' (單人), '2p' (雙人)
 */

export class LeaderboardManager {
  constructor() {
    this.prefix = 'moonlit_bbq_lb';
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    this.supabase = null;
    if (this.supabaseUrl && this.supabaseAnonKey) {
      try {
        this.supabase = createClient(this.supabaseUrl, this.supabaseAnonKey);
      } catch (e) {
        console.warn('[Leaderboard] Supabase client init failed, fallback to local:', e);
      }
    }
  }

  isCloudEnabled() {
    return !!this.supabase;
  }

  getStorageKey(mapId = 'map1', mode = '1p') {
    return `${this.prefix}_${mapId}_${mode}`;
  }

  /**
   * Get cached / local scores synchronously for instant UI render
   */
  getLocalScores(mapId = 'map1', mode = '1p') {
    const key = this.getStorageKey(mapId, mode);
    try {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      return list.sort((a, b) => b.score - a.score);
    } catch (e) {
      return [];
    }
  }

  getScores(mapId = 'map1', mode = '1p') {
    return this.getLocalScores(mapId, mode);
  }

  /**
   * Fetch top scores from Supabase Cloud Database (Async)
   */
  async fetchCloudScores(mapId = 'map1', mode = '1p', limit = 50) {
    if (!this.supabase) {
      return this.getLocalScores(mapId, mode);
    }

    try {
      const { data, error } = await this.supabase
        .from('leaderboard')
        .select('*')
        .eq('map_id', mapId)
        .eq('mode', mode)
        .order('score', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('[Leaderboard] Supabase fetch error:', error.message);
        return this.getLocalScores(mapId, mode);
      }

      const formatted = (data || []).map((row, idx) => ({
        id: row.id,
        name: row.name,
        score: row.score,
        combo: row.combo || 'x1.0',
        date: row.date || new Date(row.created_at).toLocaleDateString('zh-TW'),
        rank: idx + 1
      }));

      // Cache cloud scores locally
      const key = this.getStorageKey(mapId, mode);
      localStorage.setItem(key, JSON.stringify(formatted));

      return formatted;
    } catch (err) {
      console.warn('[Leaderboard] Network error fetching scores:', err);
      return this.getLocalScores(mapId, mode);
    }
  }

  /**
   * Add a new score (saves locally and uploads to Supabase)
   */
  async addScore(playerName, score, maxCombo = 1.0, mapId = 'map1', mode = '1p') {
    if (score <= 0) return this.getLocalScores(mapId, mode);

    const now = new Date();
    const dateStr = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;
    const cleanName = (playerName || (mode === '2p' ? '玉兔 & 吳剛' : '玉兔大廚')).trim().slice(0, 20);

    const newEntry = {
      name: cleanName,
      score: score,
      combo: `x${maxCombo.toFixed(1)}`,
      date: dateStr,
      map_id: mapId,
      mode: mode
    };

    // 1. Update local cache immediately
    const key = this.getStorageKey(mapId, mode);
    const localList = this.getLocalScores(mapId, mode);
    localList.push(newEntry);
    localList.sort((a, b) => b.score - a.score);
    const trimmedLocal = localList.slice(0, 50).map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
    localStorage.setItem(key, JSON.stringify(trimmedLocal));

    // 2. Upload to Supabase if configured
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('leaderboard')
          .insert([
            {
              name: newEntry.name,
              score: newEntry.score,
              combo: newEntry.combo,
              map_id: mapId,
              mode: mode,
              date: dateStr
            }
          ]);
        if (error) {
          console.warn('[Leaderboard] Supabase upload failed:', error.message);
        } else {
          console.log('[Leaderboard] Successfully uploaded score to Supabase cloud!');
        }
      } catch (err) {
        console.warn('[Leaderboard] Supabase network error:', err);
      }
    }

    return trimmedLocal;
  }
}
