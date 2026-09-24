/**
 * AuthManager: Manages Player Registration, Login, Local Storage Persistence & Profiles
 */

export class AuthManager {
  constructor() {
    this.storageKeyUsers = 'moonlit_bbq_users';
    this.storageKeyCurrent = 'moonlit_bbq_current_user';
    this.currentUser = null;
    this.initSession();
  }

  initSession() {
    try {
      const saved = localStorage.getItem(this.storageKeyCurrent);
      if (saved) {
        this.currentUser = JSON.parse(saved);
      } else {
        // Create default Guest session
        const randId = Math.floor(100 + Math.random() * 900);
        this.currentUser = {
          username: `訪客大廚 #${randId}`,
          isGuest: true,
          highScore: 0,
          gamesPlayed: 0
        };
        localStorage.setItem(this.storageKeyCurrent, JSON.stringify(this.currentUser));
      }
    } catch (e) {
      this.currentUser = { username: '訪客大廚', isGuest: true, highScore: 0, gamesPlayed: 0 };
    }
  }

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKeyUsers) || '{}');
    } catch (e) {
      return {};
    }
  }

  saveUsers(users) {
    localStorage.setItem(this.storageKeyUsers, JSON.stringify(users));
  }

  register(username, password) {
    if (!username || username.trim().length < 2) {
      return { success: false, message: '暱稱長度需至少 2 個字元！' };
    }
    if (!password || password.length < 4) {
      return { success: false, message: '密碼長度需至少 4 碼！' };
    }

    const cleanUser = username.trim();
    const users = this.getUsers();

    if (users[cleanUser]) {
      return { success: false, message: '該帳號已被註冊，請直接登入！' };
    }

    // Save new user profile
    users[cleanUser] = {
      username: cleanUser,
      password: password, // Simple client-side mock
      highScore: 0,
      gamesPlayed: 0,
      registeredAt: new Date().toISOString()
    };
    this.saveUsers(users);

    this.currentUser = {
      username: cleanUser,
      isGuest: false,
      highScore: 0,
      gamesPlayed: 0
    };
    localStorage.setItem(this.storageKeyCurrent, JSON.stringify(this.currentUser));

    return { success: true, user: this.currentUser };
  }

  login(username, password) {
    const cleanUser = username.trim();
    const users = this.getUsers();

    if (!users[cleanUser] || users[cleanUser].password !== password) {
      return { success: false, message: '帳號或密碼錯誤！' };
    }

    this.currentUser = {
      username: cleanUser,
      isGuest: false,
      highScore: users[cleanUser].highScore || 0,
      gamesPlayed: users[cleanUser].gamesPlayed || 0
    };
    localStorage.setItem(this.storageKeyCurrent, JSON.stringify(this.currentUser));

    return { success: true, user: this.currentUser };
  }

  loginGuest(customName = '') {
    const name = customName.trim() || `訪客大廚 #${Math.floor(100 + Math.random() * 900)}`;
    this.currentUser = {
      username: name,
      isGuest: true,
      highScore: 0,
      gamesPlayed: 0
    };
    localStorage.setItem(this.storageKeyCurrent, JSON.stringify(this.currentUser));
    return { success: true, user: this.currentUser };
  }

  recordGame(score) {
    if (!this.currentUser) return;
    this.currentUser.gamesPlayed = (this.currentUser.gamesPlayed || 0) + 1;
    if (score > (this.currentUser.highScore || 0)) {
      this.currentUser.highScore = score;
    }
    localStorage.setItem(this.storageKeyCurrent, JSON.stringify(this.currentUser));

    // Also update registered user DB if not guest
    if (!this.currentUser.isGuest) {
      const users = this.getUsers();
      if (users[this.currentUser.username]) {
        users[this.currentUser.username].highScore = Math.max(users[this.currentUser.username].highScore || 0, score);
        users[this.currentUser.username].gamesPlayed = (users[this.currentUser.username].gamesPlayed || 0) + 1;
        this.saveUsers(users);
      }
    }
  }
}
