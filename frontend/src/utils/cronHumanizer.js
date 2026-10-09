/**
 * Translates standard 5-field cron expressions into plain, human-readable English text.
 */
export function cronToHumanReadable(cronStr) {
  if (!cronStr || typeof cronStr !== 'string') return 'Invalid schedule';
  const parts = cronStr.trim().split(/\s+/);
  if (parts.length !== 5) return cronStr;

  const [min, hour, dayMonth, month, dayWeek] = parts;

  // Exact matches
  if (cronStr === '* * * * *') return 'Every minute';
  if (cronStr === '*/5 * * * *') return 'Every 5 minutes';
  if (cronStr === '*/10 * * * *') return 'Every 10 minutes';
  if (cronStr === '*/15 * * * *') return 'Every 15 minutes';
  if (cronStr === '*/30 * * * *') return 'Every 30 minutes';

  // Every X minutes: */X * * * *
  if (min.startsWith('*/') && hour === '*' && dayMonth === '*' && month === '*' && dayWeek === '*') {
    const interval = min.replace('*/', '');
    return `Every ${interval} minutes`;
  }

  // Hourly at minute M: M * * * *
  if (!min.includes('*') && hour === '*' && dayMonth === '*' && month === '*' && dayWeek === '*') {
    return `Every hour at minute ${min.padStart(2, '0')}`;
  }

  // Daily at HH:MM: M H * * *
  if (!min.includes('*') && !hour.includes('*') && dayMonth === '*' && month === '*' && dayWeek === '*') {
    const formattedTime = formatTime(hour, min);
    return `Daily at ${formattedTime}`;
  }

  // Weekly on Day at HH:MM: M H * * D
  if (!min.includes('*') && !hour.includes('*') && dayMonth === '*' && month === '*' && !dayWeek.includes('*')) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[parseInt(dayWeek, 10) % 7] || `Day ${dayWeek}`;
    const formattedTime = formatTime(hour, min);
    return `Weekly on ${dayName} at ${formattedTime}`;
  }

  // Monthly on Day D at HH:MM: M H D * *
  if (!min.includes('*') && !hour.includes('*') && !dayMonth.includes('*') && month === '*' && dayWeek === '*') {
    const formattedTime = formatTime(hour, min);
    const ordinal = getOrdinalSuffix(parseInt(dayMonth, 10));
    return `Monthly on the ${ordinal} at ${formattedTime}`;
  }

  return cronStr;
}

function formatTime(hStr, mStr) {
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${period}`;
}

function getOrdinalSuffix(d) {
  if (d > 3 && d < 21) return `${d}th`;
  switch (d % 10) {
    case 1:  return `${d}st`;
    case 2:  return `${d}nd`;
    case 3:  return `${d}rd`;
    default: return `${d}th`;
  }
}
