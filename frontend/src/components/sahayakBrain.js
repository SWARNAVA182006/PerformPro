/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║   SAHAYAK BRAIN  –  PerformPro Intelligent Chat Engine   ║
 * ║   Role-aware · Page-aware · Self-adaptive · Instant      ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

// ─── Intent Patterns ───────────────────────────────────────────────────────
const INTENT_PATTERNS = [
  {
    intent: 'greeting',
    patterns: [/^(hi|hello|hey|good\s*(morning|evening|afternoon|night)|namaste|salaam|namaskar|howdy|sup|yo)\b/i],
  },
  {
    intent: 'help',
    patterns: [/\b(help|what can you|what do you|capabilities|commands|options|support|guide me|assist)\b/i],
  },
  {
    intent: 'goals',
    patterns: [/\b(goal|goals|target|objective|kpi|okr|milestone|progress|task)\b/i],
  },
  {
    intent: 'appraisals',
    patterns: [/\b(apprais|review|rating|evaluation|assessment|performance review|feedback|score|grade)\b/i],
  },
  {
    intent: 'employees',
    patterns: [/\b(employee|staff|team|colleague|member|directory|find user|search user|who is|workforce)\b/i],
  },
  {
    intent: 'dashboard',
    patterns: [/\b(dashboard|overview|summary|stats|metrics|home|main page|landing)\b/i],
  },
  {
    intent: 'notifications',
    patterns: [/\b(notif|alert|bell|unread|message|update|news|reminder)\b/i],
  },
  {
    intent: 'performance',
    patterns: [/\b(my performance|my score|analytics|insight|report|rank|benchmark|trend|analysis)\b/i],
  },
  {
    intent: 'navigate',
    patterns: [/\b(go to|navigate|open|take me|show me|where is|how do i find|where can i|i want to see)\b/i],
  },
  {
    intent: 'logout',
    patterns: [/\b(logout|log out|sign out|exit|quit|bye|goodbye|see you)\b/i],
  },
  {
    intent: 'profile',
    patterns: [/\b(profile|my account|my info|my data|personal|settings|edit profile|update info)\b/i],
  },
  {
    intent: 'reports',
    patterns: [/\b(report|export|download|csv|pdf|generate report|data export)\b/i],
  },
  {
    intent: 'tips',
    patterns: [/\b(tip|tips|trick|tricks|best practice|how to|improve|suggestion|advice|recommend)\b/i],
  },
  {
    intent: 'system',
    patterns: [/\b(system log|audit|log|activity|admin panel|system)\b/i],
  },
  {
    intent: 'thanks',
    patterns: [/\b(thank|thanks|thank you|thx|ty|great|awesome|perfect|nice|good job|well done)\b/i],
  },
];

// ─── Context-Based Quick Replies ─────────────────────────────────────────────
const QUICK_REPLIES_BY_PAGE = {
  '/dashboard': ['📊 Show my stats', '🎯 My goals status', '📋 Recent appraisals', '💡 Tips for today'],
  '/goals':     ['➕ How to add a goal', '📈 Check goal progress', '✅ Approve goals', '❓ Goal workflow'],
  '/appraisals':['📝 Submit appraisal', '👁️ View my ratings', '✅ Approve reviews', '📊 Score breakdown'],
  '/employees': ['🔍 Search an employee', '📂 Filter by dept', '👤 View profile', '📧 Contact someone'],
  '/reports':   ['📥 Export report', '📊 View performance', '👥 Team overview', '📈 Trend analysis'],
  '/profile':   ['✏️ Edit profile', '🔒 Change password', '📷 Update avatar', '📋 View history'],
  '/logs':      ['🛡️ Recent activity', '👤 User actions', '⚠️ Error logs', '🔍 Search logs'],
  default:      ['📊 Dashboard', '🎯 My Goals', '📋 Appraisals', '🆘 Get Help'],
};

// ─── Role-Based Greetings ────────────────────────────────────────────────────
const ROLE_GREETINGS = {
  Admin: [
    "You have full command over PerformPro today! 🛡️",
    "The entire platform is at your fingertips. What would you like to manage?",
    "Ready to assist the system administrator! How can I help?"
  ],
  Manager: [
    "Your team is counting on great leadership! 💼",
    "Let's make your team perform at their best today!",
    "Ready to help you manage your team effectively!"
  ],
  Employee: [
    "Let's make today a productive one! 🌟",
    "Ready to help you track your progress and goals!",
    "Your performance journey continues — how can I assist?"
  ],
};

// ─── Response Templates ───────────────────────────────────────────────────────
const RESPONSES = {
  greeting: ({ user }) => {
    const hour = new Date().getHours();
    const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const name = user?.name || user?.email?.split('@')[0] || 'there';
    const role = user?.role || 'User';
    const roleMsg = ROLE_GREETINGS[role]?.[Math.floor(Math.random() * 3)] || "How can I assist you today?";
    return `${timeGreet}, **${name}**! 👋\n\nI'm **Sahayak**, your intelligent PerformPro assistant. ${roleMsg}\n\nYou can ask me about goals, appraisals, your performance, team members, or anything on this platform!`;
  },

  help: ({ user, page }) => {
    const role = user?.role;
    const caps = [
      '🎯 **Goals** — Track & manage your objectives',
      '📋 **Appraisals** — Navigate performance reviews',
      '📊 **Analytics** — Understand performance data',
    ];
    if (role === 'Admin' || role === 'Manager') {
      caps.push('👥 **Team Management** — Find & manage employees');
      caps.push('📈 **Reports** — Export data & insights');
    }
    if (role === 'Admin') {
      caps.push('🛡️ **System Logs** — Audit all activity');
    }
    caps.push('🗺️ **Navigation** — Jump to any page instantly');
    caps.push('💡 **Tips** — Get platform best practices');
    return `Here's what I can help you with:\n\n${caps.join('\n')}\n\nJust ask me naturally — like *"show my goals"* or *"how do I submit an appraisal?"*`;
  },

  goals: ({ user, liveData }) => {
    const role = user?.role;
    let base = '';
    if (liveData?.goals !== undefined) {
      base = `You currently have **${liveData.goals.total || 0}** goals, with **${liveData.goals.pending || 0}** pending approval and **${liveData.goals.in_progress || 0}** in progress.\n\n`;
    }
    if (role === 'Employee') {
      return `${base}📌 **Your Goals Overview**\n\n• Navigate to **Goals** from the sidebar\n• Use **"Add Goal"** to create a new objective\n• Goals need Manager/Admin approval before they become active\n• Update your progress percentage anytime\n• Completed goals boost your performance score!\n\n💡 *Tip: Break big goals into smaller milestones for better tracking.*`;
    } else if (role === 'Manager') {
      return `${base}📌 **Team Goals Management**\n\n• View all team goals from the **Goals** page\n• **Approve or Deny** pending employee goals\n• Monitor progress across your entire team\n• Set department-wide targets through the admin panel\n\n💡 *Tip: Approve goals promptly so employees stay motivated!*`;
    } else {
      return `${base}📌 **Goals Administration**\n\n• Full visibility into all organizational goals\n• Approve, deny, or modify any goal\n• Export goal data from **Reports**\n• View goal completion rates in **Analytics**\n\n💡 *Tip: Use Analytics to spot teams with goal alignment issues.*`;
    }
  },

  appraisals: ({ user, liveData }) => {
    const role = user?.role;
    if (role === 'Employee') {
      return `📋 **Appraisal Guide for Employees**\n\n• Go to **Appraisals** in the sidebar\n• Submit a **self-assessment** for ongoing cycles\n• View your past ratings, scores & manager feedback\n• Track appraisal cycle timelines\n\n🔑 **Status meanings:**\n• 🟡 Pending — awaiting manager review\n• 🟢 Approved — finalized with score\n• 🔴 Rejected — requires revision\n\n💡 *Tip: Be specific and data-driven in your self-assessment!*`;
    } else if (role === 'Manager') {
      return `📋 **Appraisal Guide for Managers**\n\n• Open **Appraisals** to see pending reviews\n• **Approve** with a rating (1–10) and comment\n• **Reject** with clear feedback for improvement\n• Monitor your team's overall appraisal health\n\n💡 *Tip: Timely reviews signal good leadership to your team.*`;
    } else {
      return `📋 **Appraisal Administration**\n\n• Full appraisal oversight for all departments\n• Override ratings, create custom cycles\n• Export all appraisal data as CSV\n• Monitor pending reviews in **Dashboard → Metrics**`;
    }
  },

  employees: ({ user }) => {
    const role = user?.role;
    if (role === 'Employee') {
      return `👤 **Employee Directory**\n\nAs an **Employee**, you can:\n• View your own profile via top-right avatar\n• Update your skills and personal information\n\n*Directory browsing is available to Managers and Admins.*`;
    }
    return `👥 **Employee Directory**\n\n• Go to **Directory** in the sidebar\n• **Search** by name, email, or department\n• Click any employee card to view their full profile\n• Add **skills** and **feedback** from the profile page\n• Filter by **department** or **role**\n\n💡 *Tip: Use the global search bar at the top to find anyone instantly!*`;
  },

  dashboard: () =>
    `📊 **Dashboard Overview**\n\nYour Dashboard shows:\n• 🔢 **Key Metrics** — employee count, pending reviews, active goals\n• 📈 **Performance Trends** — monthly score charts\n• 🔔 **Recent Activity** — latest actions across the platform\n• 🏆 **Top Performers** — leaderboard snapshot\n\n💡 *Tip: Check the dashboard every morning for a quick pulse on org health!*`,

  notifications: ({ liveData }) => {
    const count = liveData?.notifications || 0;
    return `🔔 **Notifications Center**\n\n${count > 0 ? `You have **${count} unread** notification${count > 1 ? 's' : ''}. Click the bell 🔔 in the top bar!` : 'You\'re all caught up — no unread notifications! ✅'}\n\nNotifications alert you about:\n• Goal approvals/denials\n• Appraisal status changes\n• Manager feedback\n• System announcements`;
  },

  performance: ({ user }) =>
    `📈 **Performance Analytics**\n\n• Go to **Analytics** from the sidebar\n• See your **performance score trend** over months\n• Compare with team benchmarks (anonymized for privacy)\n• View **skill gap analysis** and recommendations\n\n${user?.role !== 'Employee' ? '• As a Manager/Admin, see **department-level performance breakdowns**\n• Identify **at-risk employees** early with trend data\n\n' : ''}💡 *Tip: A consistent upward trend matters more than a single high score!*`,

  navigate: ({ page }) => {
    const nav = {
      dashboard: '→ Click **Dashboard** in the left sidebar',
      goals: '→ Click **Goals** in the left sidebar',
      appraisals: '→ Click **Appraisals** in the left sidebar',
      employees: '→ Click **Directory** in the left sidebar',
      reports: '→ Click **Analytics** in the left sidebar',
      profile: '→ Click your **avatar / name** in the top-right corner',
      logs: '→ Click **System Logs** in the left sidebar (Admin only)',
    };
    const links = Object.entries(nav).map(([k, v]) => `• **${k.charAt(0).toUpperCase() + k.slice(1)}**: ${v}`).join('\n');
    return `🗺️ **Navigation Guide**\n\nAll main sections are accessible from the **left sidebar**:\n\n${links}\n\n💡 *Tip: Use the global **search bar** at the top to jump directly to employees, goals, or appraisals!*`;
  },

  logout: () =>
    `👋 **Ready to sign out?**\n\nTo logout safely:\n• Click the **Logout button** (→ icon) at the bottom of the left sidebar\n\nYour session will be cleared and you'll be redirected to the login page.\n\n🛡️ *Always log out on shared devices to keep your data secure.*`,

  profile: () =>
    `👤 **Your Profile**\n\n• Click your **name/avatar** in the top-right to visit your profile\n• Update your **display name**, **department**, and **designation**\n• Add or remove **skills** to keep your profile current\n• View your **performance history** and **received feedback**\n\n💡 *Tip: A complete profile helps Managers and Admins make better appraisal decisions!*`,

  reports: ({ user }) => {
    const role = user?.role;
    if (role === 'Employee') {
      return `📊 **Analytics & Reports**\n\nAs an **Employee**, you can:\n• View your personal performance charts\n• See skill assessment data\n• Track goal completion trends\n\nGo to **Analytics** from the sidebar!`;
    }
    return `📈 **Reports & Exports**\n\n• Navigate to **Analytics** for live charts\n• Use **Export** to download employee data as **CSV**\n• Filter by **department** before exporting\n• Access **appraisal summaries** for cycles\n\n💡 *Tip: Export reports at the end of each quarter for your records!*`;
  },

  tips: ({ page }) => {
    const pageTips = {
      '/goals':      ['Set measurable goals with clear deadlines', 'Update your progress % regularly', 'Break large goals into smaller milestones'],
      '/appraisals': ['Be specific and data-driven in self-assessments', 'Back claims with concrete examples', 'Review past feedback before submitting'],
      '/reports':    ['Filter by department for focused analysis', 'Export at end-of-quarter for records', 'Cross-reference goals with performance scores'],
      '/dashboard':  ['Check dashboard daily for org pulse', 'Click metric cards for deep-dives', 'Monitor the activity feed for key changes'],
    };
    const tips = pageTips[page] || ['Keep your profile up-to-date', 'Review pending notifications daily', 'Set SMART goals for best results'];
    const bullet = tips.map(t => `• ${t}`).join('\n');
    return `💡 **Platform Tips**\n\n${bullet}\n\n🔥 *Consistently using PerformPro correlates with 23% higher performance scores!*`;
  },

  system: ({ user }) => {
    if (user?.role !== 'Admin') {
      return `🔒 **System Logs** are only accessible to **Admins**.\n\nIf you need admin access, contact your system administrator.`;
    }
    return `🛡️ **System Logs**\n\n• Go to **System Logs** in the sidebar (Admin only)\n• Browse all user activity with timestamps\n• Filter by user, action type, or date range\n• Useful for auditing sensitive operations\n\n💡 *Tip: Review logs weekly for any anomalies or unauthorized actions.*`;
  },

  thanks: ({ user }) => {
    const name = user?.name || 'there';
    const responses = [
      `You're always welcome, **${name}**! 😊 Is there anything else I can help with?`,
      `Happy to help! 🌟 Let me know if you need anything else, **${name}**.`,
      `Anytime! That's what I'm here for. Anything else on your mind?`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  },

  unknown: ({ query, user }) => {
    const suggestions = [
      '"show my goals"', '"appraisal status"', '"team directory"', '"how to export report"',
    ];
    return `🤔 I'm not quite sure I understood *"${query}"*.\n\nHere are some things you can ask me:\n${suggestions.map(s => `• ${s}`).join('\n')}\n\nOr type **"help"** for a full list of my capabilities!`;
  },
};

// ─── Main Classify + Respond Function ────────────────────────────────────────
export function processMessage(text, { user, page, liveData = {} }) {
  const trimmed = text.trim();
  let matched = null;

  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some(p => p.test(trimmed))) {
      matched = intent;
      break;
    }
  }

  const fn = RESPONSES[matched] || RESPONSES.unknown;
  const response = fn({ user, page, liveData, query: trimmed });

  return {
    intent: matched || 'unknown',
    text: response,
    quickReplies: getQuickReplies(page, matched),
  };
}

// ─── Quick Reply Chips ─────────────────────────────────────────────────────
export function getQuickReplies(page, lastIntent) {
  // After certain intents, show contextual follow-ups
  const followUps = {
    greeting:  ['🆘 What can you do?', '🎯 My goals', '📋 Appraisals', '📊 Dashboard'],
    goals:     ['➕ Add a goal', '📈 Check progress', '✅ Approve goals', '📊 Analytics'],
    appraisals:['📝 Submit review', '⭐ View my score', '✅ Approve reviews', '📊 Reports'],
    help:      ['🎯 Goals guide', '📋 Appraisals guide', '📊 Analytics', '🗺️ Navigation'],
    thanks:    ['🎯 Goals', '📋 Appraisals', '📊 Dashboard', '💡 Tips'],
  };

  if (followUps[lastIntent]) return followUps[lastIntent];
  return QUICK_REPLIES_BY_PAGE[page] || QUICK_REPLIES_BY_PAGE.default;
}

// ─── Typing Delay Simulation ──────────────────────────────────────────────
export function getTypingDelay(text) {
  // Simulate natural typing — longer responses take slightly longer
  const base = 600;
  const perChar = 3;
  return Math.min(base + text.length * perChar, 2000);
}
