/**
 * ClassPanel LocalStorage & Roster Manager
 * Lightweight, privacy-focused, zero external dependencies.
 * All data stays 100% on the user's device (COPPA/FERPA compliant).
 */

class StorageManager {
  constructor() {
    this.PREFIX = 'cp_';
    this.DEFAULT_ROSTER_KEY = this.PREFIX + 'rosters';
    this.ACTIVE_ROSTER_KEY = this.PREFIX + 'active_roster';
    this.initDefaults();
  }

  initDefaults() {
    // If no rosters exist yet, create a ready-to-use sample classroom roster
    if (!this.get(this.DEFAULT_ROSTER_KEY)) {
      const sampleRosters = {
        "Period 1 (Sample)": [
          "Alex Rivera", "Bella Chen", "Carlos Gomez", "David Kim",
          "Emma Watson", "Frankie Miller", "Grace Hopper", "Hassan Ali",
          "Isabella Rossi", "James Wilson", "Kavita Patel", "Lucas Silva",
          "Maya Lin", "Noah Clark", "Olivia Taylor", "Paul Becker"
        ]
      };
      this.set(this.DEFAULT_ROSTER_KEY, sampleRosters);
      this.set(this.ACTIVE_ROSTER_KEY, "Period 1 (Sample)");
    }
  }

  // Basic typed get/set
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('Storage read error for key ' + key, e);
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage write error for key ' + key, e);
      return false;
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Storage remove error for key ' + key, e);
    }
  }

  // --- Roster Management ---
  getRosters() {
    return this.get(this.DEFAULT_ROSTER_KEY, {});
  }

  getActiveRosterName() {
    const rosters = this.getRosters();
    const names = Object.keys(rosters);
    let active = this.get(this.ACTIVE_ROSTER_KEY);
    if (!active || !rosters[active]) {
      active = names.length > 0 ? names[0] : null;
      if (active) this.setActiveRosterName(active);
    }
    return active;
  }

  setActiveRosterName(name) {
    this.set(this.ACTIVE_ROSTER_KEY, name);
  }

  getActiveRosterList() {
    const rosters = this.getRosters();
    const activeName = this.getActiveRosterName();
    return (activeName && rosters[activeName]) ? rosters[activeName] : [];
  }

  saveRoster(name, students) {
    if (!name || !name.trim()) return false;
    const cleanName = name.trim();
    const cleanList = Array.isArray(students)
      ? students.map(s => String(s).trim()).filter(s => s.length > 0)
      : [];

    const rosters = this.getRosters();
    rosters[cleanName] = cleanList;
    this.set(this.DEFAULT_ROSTER_KEY, rosters);
    this.setActiveRosterName(cleanName);
    return true;
  }

  deleteRoster(name) {
    const rosters = this.getRosters();
    if (rosters[name]) {
      delete rosters[name];
      this.set(this.DEFAULT_ROSTER_KEY, rosters);
      const remainingNames = Object.keys(rosters);
      if (this.getActiveRosterName() === name) {
        this.setActiveRosterName(remainingNames.length > 0 ? remainingNames[0] : null);
      }
      return true;
    }
    return false;
  }

  // Import lines of text or comma-separated names
  parseNamesFromText(text) {
    if (!text) return [];
    return text
      .split(/[\r\n,]+/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
  }

  // --- Tool Settings & Presets ---
  getToolSetting(toolName, settingKey, fallback = null) {
    const fullKey = `${this.PREFIX}${toolName}_${settingKey}`;
    return this.get(fullKey, fallback);
  }

  saveToolSetting(toolName, settingKey, value) {
    const fullKey = `${this.PREFIX}${toolName}_${settingKey}`;
    return this.set(fullKey, value);
  }
}

// Global storage singleton
window.StorageHub = new StorageManager();
