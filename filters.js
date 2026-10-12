/**
 * EduChain - Filtering & Search Logic Module
 * Provides multi-criteria filtering, search matching, and deadline calculations.
 */

/**
 * Filter an array of scholarships based on query and filter parameters
 * @param {Array<Object>} scholarships
 * @param {Object} filters
 * @returns {Array<Object>}
 */
export function filterScholarships(scholarships, filters) {
  const {
    query = '',
    country = 'all',
    educationLevel = 'all',
    fundingType = 'all',
    deadlineStatus = 'all'
  } = filters;

  const normalizedQuery = query.trim().toLowerCase();

  return scholarships.filter(item => {
    // 1. Text Search matching name, provider, subject, country, eligibility
    if (normalizedQuery) {
      const matchName = item.name.toLowerCase().includes(normalizedQuery);
      const matchProvider = item.provider.toLowerCase().includes(normalizedQuery);
      const matchSubject = (item.subject || '').toLowerCase().includes(normalizedQuery);
      const matchCountry = item.country.toLowerCase().includes(normalizedQuery);
      const matchEligibility = (item.eligibility || []).some(e => e.toLowerCase().includes(normalizedQuery));

      if (!matchName && !matchProvider && !matchSubject && !matchCountry && !matchEligibility) {
        return false;
      }
    }

    // 2. Country filter
    if (country !== 'all') {
      if (country === 'Nepal' && !item.country.includes('Nepal')) {
        return false;
      } else if (country !== 'Nepal' && item.country !== country) {
        return false;
      }
    }

    // 3. Education Level filter
    if (educationLevel !== 'all' && item.educationLevel !== educationLevel) {
      return false;
    }

    // 4. Funding Type filter
    if (fundingType !== 'all' && item.fundingType !== fundingType) {
      return false;
    }

    // 5. Deadline status filter
    if (deadlineStatus !== 'all') {
      const days = getDaysUntilDeadline(item.deadline);
      if (deadlineStatus === 'urgent' && (days < 0 || days > 60)) {
        return false;
      } else if (deadlineStatus === 'active' && days < 0) {
        return false;
      } else if (deadlineStatus === 'passed' && days >= 0) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort scholarships according to selected sort rule
 * @param {Array<Object>} scholarships
 * @param {string} sortBy - 'deadline-soonest' | 'recently-added' | 'alpha'
 * @returns {Array<Object>}
 */
export function sortScholarships(scholarships, sortBy = 'deadline-soonest') {
  const cloned = [...scholarships];

  switch (sortBy) {
    case 'deadline-soonest':
      return cloned.sort((a, b) => {
        const timeA = new Date(a.deadline).getTime();
        const timeB = new Date(b.deadline).getTime();
        return timeA - timeB;
      });

    case 'recently-added':
      return cloned.sort((a, b) => {
        const dateA = a.lastChecked ? new Date(a.lastChecked).getTime() : 0;
        const dateB = b.lastChecked ? new Date(b.lastChecked).getTime() : 0;
        return dateB - dateA;
      });

    case 'alpha':
      return cloned.sort((a, b) => a.name.localeCompare(b.name));

    default:
      return cloned;
  }
}

/**
 * Calculate the number of days until the given deadline
 * @param {string} deadlineStr - 'YYYY-MM-DD'
 * @returns {number}
 */
export function getDaysUntilDeadline(deadlineStr) {
  if (!deadlineStr) return 999;
  const deadlineDate = new Date(deadlineStr);
  const now = new Date();
  
  // Set both to midnight for pure day comparison
  deadlineDate.setHours(0, 0, 0, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Return user-friendly badge data for a deadline
 * @param {string} deadlineStr
 * @returns {{ label: string, isUrgent: boolean, isPassed: boolean }}
 */
export function formatDeadlineBadge(deadlineStr) {
  if (!deadlineStr) {
    return { label: 'Deadline: Rolling / Open', isUrgent: false, isPassed: false };
  }

  const days = getDaysUntilDeadline(deadlineStr);
  const formattedDate = new Date(deadlineStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  if (days < 0) {
    return { label: `Closed on ${formattedDate}`, isUrgent: false, isPassed: true };
  } else if (days === 0) {
    return { label: 'Closes Today!', isUrgent: true, isPassed: false };
  } else if (days <= 30) {
    return { label: `${days} days left (${formattedDate})`, isUrgent: true, isPassed: false };
  } else {
    return { label: `${formattedDate} (${days} days)`, isUrgent: false, isPassed: false };
  }
}

/**
 * Count active non-default filters
 * @param {Object} filters
 * @returns {number}
 */
export function getActiveFilterCount(filters) {
  let count = 0;
  if (filters.query && filters.query.trim().length > 0) count++;
  if (filters.country && filters.country !== 'all') count++;
  if (filters.educationLevel && filters.educationLevel !== 'all') count++;
  if (filters.fundingType && filters.fundingType !== 'all') count++;
  if (filters.deadlineStatus && filters.deadlineStatus !== 'all') count++;
  return count;
}
