/**
 * EduChain - Student Application Tracker Dashboard Module
 * Manages metric counters, status pipeline filter tabs,
 * updating statuses, personal notes, deadline alerts, and LocalStorage updates.
 */

import {
  getApplications,
  APPLICATION_STATUSES,
  updateStatus,
  updateNotes,
  updateDates,
  removeApplication,
  clearAllStorage,
  exportDataAsJSON
} from './storage.js';
import { formatDeadlineBadge, getDaysUntilDeadline } from './filters.js';
import { showToast } from './app.js';

let allScholarships = [];
let activeStatusFilter = 'all';

/**
 * Initialize the Student Dashboard
 */
export async function initDashboard() {
  const container = document.getElementById('tracker-cards-container');
  if (!container) return; // Not on dashboard page

  try {
    const resp = await fetch('/data/scholarships.json');
    if (!resp.ok) throw new Error('Could not fetch scholarships');
    allScholarships = await resp.json();

    setupDashboardTabs();
    setupStorageActionButtons();
    renderDashboard();

    // Listen for storage changes
    window.addEventListener('educhain:storage-changed', () => {
      renderDashboard();
    });
  } catch (err) {
    console.error('[EduChain Dashboard] Init failed:', err);
  }
}

/**
 * Render complete dashboard: metrics, tabs, and application cards
 */
export function renderDashboard() {
  const applications = getApplications();
  renderMetrics(applications);
  renderTrackerList(applications);
}

/**
 * Calculate and render top metric cards
 */
function renderMetrics(applications) {
  const totalSavedEl = document.getElementById('metric-total-saved');
  const preparingEl = document.getElementById('metric-preparing');
  const appliedEl = document.getElementById('metric-applied');
  const upcomingDeadlinesEl = document.getElementById('metric-upcoming-deadlines');

  if (!totalSavedEl) return;

  const totalSaved = applications.length;
  const preparing = applications.filter(a => ['Interested', 'Preparing'].includes(a.status)).length;
  const applied = applications.filter(a => ['Applied', 'Interview', 'Accepted'].includes(a.status)).length;

  // Calculate upcoming deadlines within 60 days
  let upcomingDeadlinesCount = 0;
  applications.forEach(app => {
    const scholarship = allScholarships.find(s => s.id === app.scholarshipId);
    if (scholarship && scholarship.deadline) {
      const days = getDaysUntilDeadline(scholarship.deadline);
      if (days >= 0 && days <= 60) {
        upcomingDeadlinesCount++;
      }
    }
  });

  totalSavedEl.textContent = totalSaved;
  preparingEl.textContent = preparing;
  appliedEl.textContent = applied;
  upcomingDeadlinesEl.textContent = upcomingDeadlinesCount;
}

/**
 * Setup status filter tabs (All + 7 Statuses)
 */
function setupDashboardTabs() {
  const tabsContainer = document.getElementById('tracker-status-tabs');
  if (!tabsContainer) return;

  tabsContainer.querySelectorAll('.tracker-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tabsContainer.querySelectorAll('.tracker-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeStatusFilter = tab.getAttribute('data-status') || 'all';
      renderDashboard();
    });
  });
}

/**
 * Render the list of tracked applications
 */
function renderTrackerList(applications) {
  const container = document.getElementById('tracker-cards-container');
  if (!container) return;

  if (applications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <h3>Your Application Tracker is Empty</h3>
        <p>You haven't saved any scholarships yet. Explore our directory to find opportunities that match your education level and career aspirations.</p>
        <a href="/scholarships.html" class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          Explore Scholarships
        </a>
      </div>
    `;
    return;
  }

  // Filter by active status tab
  let filtered = applications;
  if (activeStatusFilter !== 'all') {
    filtered = applications.filter(a => a.status === activeStatusFilter);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No applications in "${activeStatusFilter}" status</h3>
        <p>You have no saved scholarships under this category. Switch to 'All' or change the status of your existing applications.</p>
      </div>
    `;
    return;
  }

  // Render tracker cards
  container.innerHTML = filtered.map(app => {
    const scholarship = allScholarships.find(s => s.id === app.scholarshipId) || {
      name: 'Unknown Scholarship Opportunity',
      provider: 'Provider information unavailable',
      deadline: null,
      country: 'Global',
      fundingType: 'Financial Aid',
      officialUrl: '#'
    };

    const deadlineInfo = formatDeadlineBadge(scholarship.deadline);

    return `
      <div class="tracker-item-card" data-id="${app.scholarshipId}">
        <div class="tracker-top">
          <div class="tracker-title-col">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
              <span class="badge badge-level">${escapeHTML(scholarship.country)}</span>
              <span class="badge badge-tuition">${escapeHTML(scholarship.fundingType)}</span>
            </div>
            <h4>${escapeHTML(scholarship.name)}</h4>
            <p>${escapeHTML(scholarship.provider)} • Deadline: <strong class="${deadlineInfo.isUrgent ? 'text-amber' : ''}">${deadlineInfo.label}</strong></p>
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <a href="${scholarship.officialUrl || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" title="Visit official application portal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              Official Portal
            </a>
            <button class="btn btn-danger-outline btn-sm btn-delete-app" data-id="${app.scholarshipId}" title="Remove from tracker">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Remove
            </button>
          </div>
        </div>

        <div class="tracker-controls">
          <div class="control-group">
            <label>Application Status</label>
            <select class="select-status" data-id="${app.scholarshipId}">
              ${APPLICATION_STATUSES.map(st => `
                <option value="${st}" ${st === app.status ? 'selected' : ''}>${st}</option>
              `).join('')}
            </select>
          </div>

          <div class="control-group">
            <label>Application Submission Date</label>
            <input type="date" class="input-date input-applied-date" data-id="${app.scholarshipId}" value="${app.appliedDate || ''}">
          </div>

          <div class="control-group">
            <label>Personal Reminder Date</label>
            <input type="date" class="input-date input-reminder-date" data-id="${app.scholarshipId}" value="${app.reminderDate || ''}">
          </div>
        </div>

        <div class="control-group" style="margin-top: 0.5rem;">
          <label>Personal Notes & Checklist</label>
          <textarea class="notes-field" data-id="${app.scholarshipId}" placeholder="Add personal notes, interview notes, or list of documents submitted...">${escapeHTML(app.notes || '')}</textarea>
        </div>
      </div>
    `;
  }).join('');

  attachTrackerEventListeners(container);
}

/**
 * Bind change listeners to status dropdowns, date inputs, notes, and remove buttons
 */
function attachTrackerEventListeners(container) {
  // Status changes
  container.querySelectorAll('.select-status').forEach(select => {
    select.addEventListener('change', (e) => {
      const id = select.getAttribute('data-id');
      const newStatus = e.target.value;
      updateStatus(id, newStatus);
      showToast('Status updated', `Changed status to "${newStatus}"`, 'info');
      renderDashboard();
    });
  });

  // Applied Date & Reminder Date
  container.querySelectorAll('.input-applied-date, .input-reminder-date').forEach(input => {
    input.addEventListener('change', () => {
      const id = input.getAttribute('data-id');
      const card = container.querySelector(`.tracker-item-card[data-id="${id}"]`);
      if (!card) return;

      const appliedDate = card.querySelector('.input-applied-date').value;
      const reminderDate = card.querySelector('.input-reminder-date').value;
      updateDates(id, appliedDate, reminderDate);
      showToast('Dates recorded', 'Application timeline dates saved.', 'info');
    });
  });

  // Notes field (save on blur)
  container.querySelectorAll('.notes-field').forEach(textarea => {
    textarea.addEventListener('blur', () => {
      const id = textarea.getAttribute('data-id');
      const notes = textarea.value;
      updateNotes(id, notes);
      showToast('Notes saved', 'Your notes have been updated in local storage.', 'info');
    });
  });

  // Remove application
  container.querySelectorAll('.btn-delete-app').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Remove this scholarship from your application tracker?')) {
        removeApplication(id);
        showToast('Scholarship removed', 'Removed from tracker.', 'info');
        renderDashboard();
      }
    });
  });
}

/**
 * Setup clear data & export buttons
 */
function setupStorageActionButtons() {
  const clearBtn = document.getElementById('btn-clear-storage');
  const exportBtn = document.getElementById('btn-export-storage');

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset and clear all local tracker data? This action cannot be undone.')) {
        clearAllStorage();
        showToast('Data reset', 'All local tracker items have been cleared.', 'warning');
        renderDashboard();
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const json = exportDataAsJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `educhain-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup Exported', 'Downloaded educhain tracking data JSON.', 'success');
    });
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
