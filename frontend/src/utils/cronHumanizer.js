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

  // Semi-Annually (Every 6 months): M H D 1,7 * or 6,12
  if (month === '1,7' || month === '6,12') {
    return `Semi-Annually on the ${getOrdinalSuffix(parseInt(dayMonth, 10))} at ${formattedTime}`;
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

  // Annually / Specific Month & Date: M H D Mo *
  if (!min.includes('*') && !hour.includes('*') && !dayMonth.includes('*') && !month.includes('*') && dayWeek === '*') {
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mName = monthNames[parseInt(month, 10)] || `Month ${month}`;
    return `Annually on ${mName} ${getOrdinalSuffix(parseInt(dayMonth, 10))} at ${formattedTime}`;
  }

  // Weekdays Only: M H * * 1-5
  if (!min.includes('*') && !hour.includes('*') && dayMonth === '*' && month === '*' && (dayWeek === '1-5' || dayWeek === 'MON-FRI')) {
    return `Every weekday (Mon - Fri) at ${formattedTime}`;
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
  const displayM = String(m).padStart(2, '0');
  return `${displayH}:${displayM} ${period}`;
}

function getOrdinalSuffix(num) {
  if (!num || isNaN(num)) return '';
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return `${num}st`;
  if (j === 2 && k !== 12) return `${num}nd`;
  if (j === 3 && k !== 13) return `${num}rd`;
  return `${num}th`;
}
