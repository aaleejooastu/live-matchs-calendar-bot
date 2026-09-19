const CONFIG = {
  url: 'https://www.lapelotona.com/partidos-de-futbol-para-hoy-en-vivo/',
  calendarId: 'YOUR_EMAIL@gmail.com',   // <-- put your Google Calendar email here
  durationHours: 2,
  lookAheadDays: 4,
  tz: 'America/Bogota',

  // slug on lapelotona.com => used as a filter (only these teams get scheduled)
  teams: {
    'chelsea': 'Chelsea',
    'deportivo-cali': 'Deportivo Cali',
    'bayern-munich': 'Bayern Múnich',
    'real-madrid': 'Real Madrid'
  }
};

// Run THIS function ONCE to schedule the timer (Mon, Wed, Fri at 10am)
function createTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  [ScriptApp.WeekDay.MONDAY, ScriptApp.WeekDay.WEDNESDAY, ScriptApp.WeekDay.FRIDAY].forEach(day => {
    ScriptApp.newTrigger('scheduleMatches').timeBased()
      .onWeekDay(day).atHour(10).inTimezone(CONFIG.tz).create();
  });
  Logger.log('Triggers created: Monday, Wednesday and Friday at 10am.');
}

// Main function (the one the timer runs)
function scheduleMatches() {
  const html = UrlFetchApp.fetch(CONFIG.url, {muteHttpExceptions: true}).getContentText();
  const cal = CalendarApp.getCalendarById(CONFIG.calendarId);
  const now = new Date();
  const limit = new Date(now.getTime() + CONFIG.lookAheadDays * 864e5);

  // Split the HTML into day sections: "... sábado, 19 septiembre - 2026"
  const secRe = /Partidos[^<]*?(\d{1,2})\s+([a-záéíóú]+)\s*-\s*(\d{4})/gi;
  const months = {enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,julio:6,
                  agosto:7,septiembre:8,octubre:9,noviembre:10,diciembre:11};
  const secs = [];
  let m;
  while ((m = secRe.exec(html)) !== null) {
    const month = months[m[2].toLowerCase()];
    if (month === undefined) continue;
    secs.push({start: m.index, day: +m[1], month, year: +m[3]});
  }

  // Capture a full match row: home, away, time, league, and the block after it (channels)
  const rowRe = /\/equipos\/([a-z0-9-]+)\/[^>]*>([^<]+)<\/a>[\s\S]*?\/equipos\/([a-z0-9-]+)\/[^>]*>([^<]+)<\/a>[\s\S]*?(\d{1,2}):(\d{2})\s*(am|pm)[\s\S]*?\/ligas\/[a-z0-9-]+\/[^>]*>([^<]+)<\/a>([\s\S]*?)(?=\/equipos\/|Partidos para|Partidos |$)/gi;

  const myTeams = Object.keys(CONFIG.teams); // used only as a filter
  let created = 0, scheduled = [];

  secs.forEach((sec, i) => {
    const end = i + 1 < secs.length ? secs[i + 1].start : html.length;
    const block = html.slice(sec.start, end);
    const baseDate = new Date(sec.year, sec.month, sec.day);
    if (baseDate < new Date(now.getFullYear(), now.getMonth(), now.getDate()) ||
        baseDate > limit) return;

    let f;
    rowRe.lastIndex = 0;
    while ((f = rowRe.exec(block)) !== null) {
      const slugHome = f[1], homeName = clean(f[2]);
      const slugAway = f[3], awayName = clean(f[4]);

      // Only schedule if one of YOUR teams is playing
      if (myTeams.indexOf(slugHome) === -1 && myTeams.indexOf(slugAway) === -1) continue;

      let h = +f[5] % 12; if (f[7].toLowerCase() === 'pm') h += 12;
      const start = new Date(sec.year, sec.month, sec.day, h, +f[6]);
      const finish = new Date(start.getTime() + CONFIG.durationHours * 36e5);

      const league = clean(f[8]);

      // CHANNELS: strip HTML tags first, then look for "Canales:"
      const rest = f[9]
        .replace(/&nbsp;|\u00a0/g, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&');
      let channels = '';
      const chM = rest.match(/Canales:\s*([^\n<]+)/i);
      if (chM) channels = chM[1].trim().replace(/\s*,\s*/g, ', ');

      const title = '⚽ ' + homeName + ' vs ' + awayName + ' (' + shortLeague(league) + ')';
      const desc = 'Partido de ' + league + '.' +
                   (channels ? ' Canales: ' + channels + '.' : '') +
                   ' Fuente: lapelotona.com';

      // Avoid duplicates
      const existing = cal.getEvents(start, finish).filter(e => e.getTitle() === title);
      if (existing.length) continue;

      cal.createEvent(title, start, finish, {description: desc});
      created++;
      scheduled.push(title + ' ' + start);
    }
  });
  Logger.log('Events created: ' + created + '\n' + scheduled.join('\n'));
}

// Cleans HTML entities and extra whitespace
function clean(s) {
  return s.replace(/&amp;/g, '&').replace(/&#8217;|&#039;/g, "'").replace(/\s+/g, ' ').trim();
}

// Shortens the league name for the title only (e.g. "La Liga")
function shortLeague(l) {
  const map = { 'La Liga EA Sports': 'La Liga' };
  return map[l] || l;
}
