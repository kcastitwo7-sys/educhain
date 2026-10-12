/**
 * EduChain - Storage Management Module (LocalStorage)
 * Handles client-side persistence for scholarship application tracking.
 * Safe JSON parsing, event notifications, export & reset features.
 */

const STORAGE_KEYS = {
  APPLICATIONS: 'educhain_applications_v1',
  PREFERENCES: 'educhain_preferences_v1',
  WALLET_STATE: 'educhain_wallet_cache_v1'
};

// Available application lifecycle statuses
export const APPLICATION_STATUSES = [
  'Interested',
  'Preparing',
  'Applied',
  'Interview',
  'Accepted',
  'Rejected',
  'Withdrawn'
];

/**
 * Retrieve all saved scholarship applications
 * @returns {Array<Object>} List of application records
 */
export function getApplications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[EduChain Storage] Failed to read applications from localStorage:', error);
    return [];
  }
}

/**
 * Check if a scholarship is currently saved in tracker
 * @param {string} scholarshipId
 * @returns {boolean}
 */
export function isScholarshipSaved(scholarshipId) {
  const apps = getApplications();
  return apps.some(app => app.scholarshipId === scholarshipId);
}

/**
 * Get single application entry
 * @param {string} scholarshipId
 * @returns {Object|null}
 */
export function getApplication(scholarshipId) {
  const apps = getApplications();
  return apps.find(app => app.scholarshipId === scholarshipId) || null;
}

/**
 * Save or update a scholarship application in tracker
 * @param {string} scholarshipId
 * @param {Object} data
 */
export function saveApplication(scholarshipId, data = {}) {
  try {
    const apps = getApplications();
    const index = apps.findIndex(app => app.scholarshipId === scholarshipId);
    
    const now = new Date().toISOString();
    
    if (index >= 0) {
      // Update existing
      apps[index] = {
        ...apps[index],
        ...data,
        updatedAt: now
      };
    } else {
      // Add new
      apps.push({
        scholarshipId,
        status: data.status || 'Interested',
        notes: data.notes || '',
        appliedDate: data.appliedDate || '',
        reminderDate: data.reminderDate || '',
        createdAt: now,
        updatedAt: now
      });
    }

    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    emitStorageChangeEvent();
    return true;
  } catch (error) {
    console.error('[EduChain Storage] Failed to save application:', error);
    return false;
  }
}

/**
 * Update the application status specifically
 * @param {string} scholarshipId
 * @param {string} newStatus
 */
export function updateStatus(scholarshipId, newStatus) {
  if (!APPLICATION_STATUSES.includes(newStatus)) {
    console.warn(`[EduChain Storage] Invalid status: ${newStatus}`);
    return false;
  }
  return saveApplication(scholarshipId, { status: newStatus });
}

/**
 * Update personal notes for an application
 * @param {string} scholarshipId
 * @param {string} notes
 */
export function updateNotes(scholarshipId, notes) {
  return saveApplication(scholarshipId, { notes });
}

/**
 * Update applied date and reminder date
 * @param {string} scholarshipId
 * @param {string} appliedDate
 * @param {string} reminderDate
 */
export function updateDates(scholarshipId, appliedDate, reminderDate) {
  return saveApplication(scholarshipId, { appliedDate, reminderDate });
}

/**
 * Remove an application from local tracker
 * @param {string} scholarshipId
 */
export function removeApplication(scholarshipId) {
  try {
    const apps = getApplications();
    const filtered = apps.filter(app => app.scholarshipId !== scholarshipId);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(filtered));
    emitStorageChangeEvent();
    return true;
  } catch (error) {
    console.error('[EduChain Storage] Failed to remove application:', error);
    return false;
  }
}

/**
 * Reset all local storage demo data
 */
export function clearAllStorage() {
  try {
    localStorage.removeItem(STORAGE_KEYS.APPLICATIONS);
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    localStorage.removeItem(STORAGE_KEYS.WALLET_STATE);
    emitStorageChangeEvent();
    return true;
  } catch (error) {
    console.error('[EduChain Storage] Failed to clear localStorage:', error);
    return false;
  }
}

/**
 * Export tracking data as JSON string for backup
 */
export function exportDataAsJSON() {
  const data = {
    exportedAt: new Date().toISOString(),
    applications: getApplications()
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Dispatch custom window event so UI reactive elements update
 */
function emitStorageChangeEvent() {
  window.dispatchEvent(new CustomEvent('educhain:storage-changed', {
    detail: { timestamp: Date.now() }
  }));
}
