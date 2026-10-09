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

  const formattedTime = formatTime(hour, min);

  // Once / One Time: M H D Mo *
  if (!min.includes('*') && !hour.includes('*') && !dayMonth.includes('*') && !month.includes('*') && dayWeek === '*') {
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mName = monthNames[parseInt(month, 10)] || `Month ${month}`;
    return `Once on ${mName} ${getOrdinalSuffix(parseInt(dayMonth, 10))} at ${formattedTime}`;
  }

  // Semi-Annually (Every 6 months): M H D 1,7 *
  if (month === '1,7' || month === '6,12') {
    return `Semi-Annually on the ${getOrdinalSuffix(parseInt(dayMonth, 10))} at ${formattedTime}`;
  }

  // Annually / Yearly: M H D Mo *
  if (!min.includes('*') && !hour.includes('*') && !dayMonth.includes('*') && !month.includes('*') && dayWeek === '*') {
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `Annually on ${monthNames[parseInt(month, 10)]} ${getOrdinalSuffix(parseInt(dayMonth, 10))} at ${formattedTime}`;
  }

  // Annually Relative: e.g. 0 9 1-7 1 1 (First Mon of Jan)
  if (!min.includes('*') && !hour.includes('*') && dayMonth.includes('-') && !month.includes('*') && !dayWeek.includes('*')) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dName = dayNames[parseInt(dayWeek, 10) % 7];
    const mName = monthNames[parseInt(month, 10)];
    const pos = getRelativePositionLabel(dayMonth);
    return `Annually on the ${pos} ${dName} of ${mName} at ${formattedTime}`;
  }

  // Monthly Relative: e.g. 0 9 1-7 * 1 (First Mon of month)
  if (!min.includes('*') && !hour.includes('*') && dayMonth.includes('-') && month === '*' && !dayWeek.includes('*')) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dName = dayNames[parseInt(dayWeek, 10) % 7];
    const pos = getRelativePositionLabel(dayMonth);
    return `Monthly on the ${pos} ${dName} at ${formattedTime}`;
  }

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
    return `Daily at ${formattedTime}`;
  }

  // Weekly on Day at HH:MM: M H * * D
  if (!min.includes('*') && !hour.includes('*') && dayMonth === '*' && month === '*' && !dayWeek.includes('*')) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayList = dayWeek.split(',').map((d) => dayNames[parseInt(d, 10) % 7] || d).join(', ');
    return `Weekly on ${dayList} at ${formattedTime}`;
  }

  // Monthly on Day D at HH:MM: M H D * *
  if (!min.includes('*') && !hour.includes('*') && !dayMonth.includes('*') && month === '*' && dayWeek === '*') {
    const ordinal = getOrdinalSuffix(parseInt(dayMonth, 10));
    return `Monthly on the ${ordinal} at ${formattedTime}`;
  }

  return cronStr;
}

function getRelativePositionLabel(rangeStr) {
  if (rangeStr === '1-7') return '1st';
  if (rangeStr === '8-14') return '2nd';
  if (rangeStr === '15-21') return '3rd';
  if (rangeStr === '22-28') return '4th';
  return 'selected';
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
  if (isNaN(d)) return '';
  if (d > 3 && d < 21) return `${d}th`;
  switch (d % 10) {
    case 1:  return `${d}st`;
    case 2:  return `${d}nd`;
    case 3:  return `${d}rd`;
    default: return `${d}th`;
  }
}
