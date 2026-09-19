# live-matchs-calendar-bot
Auto-adds your teams' football matches to Google Calendar — with opponent, league, and where to watch. Runs itself with Google Apps Script. No servers.

# ⚽ Live Match Calendar Bot

A tiny **Google Apps Script** that checks a football website (lapelotona.com),
finds your teams' matches, and adds them to your **Google Calendar** on its own —
with opponent, league, and where to watch. Nobody starts it: it runs by itself
on Monday, Wednesday, and Friday. No servers of your own required.

> **Note on language:** the event titles and descriptions come out in Spanish
> because the data source (lapelotona.com) is a Spanish-language site. The code,
> setup, and docs are in English.

## What it does

On every run, it:

1. **Downloads the page** of matches (like `requests.get(url)` in Python).
2. **Splits by day** to know each match's date.
3. **Reads each match** with regular expressions: home team, away team, time, league, and channels.
4. **Filters**: only continues if one of your teams is playing.
5. **Schedules** the event in your calendar, avoiding duplicates.

Example of the reminder it creates:

> ⚽ Elche vs Real Madrid (La Liga)
> Partido de La Liga EA Sports. Canales: DGO, DSports, Amazon Prime Video, Paramount+, DAZN. Fuente: lapelotona.com

## Why Apps Script and not Python?

The code was never the problem — **where it lives and who starts it** was.
Apps Script lives inside your Google account, Google runs it for free on its
servers via "triggers," and it reaches Calendar with no credential setup. For a
small task inside Google, it wins on convenience. For data science or heavy
analysis, the answer would be Python.

## Setup

1. Go to [script.google.com](https://script.google.com) and create a **New project**.
2. Delete the contents of `Code.gs` and paste the `Code.gs` file from this repo.
3. In `CONFIG`, change:
   - `calendarId` to **your** Google Calendar email.
   - `teams` to the teams you want to follow (use the *slug* from the lapelotona.com URL, e.g. `real-madrid`).
4. Run the **`createTriggers`** function once to schedule the run times.
5. (Optional) Run **`scheduleMatches`** by hand to test it and check the log.

## Configuration

| Setting | What it controls |
|---|---|
| `calendarId` | Your target calendar |
| `teams` | Teams to follow (slug → display name) |
| `durationHours` | Event length (default 2h) |
| `lookAheadDays` | How many days ahead it scans (4) |
| `tz` | Time zone |

Triggers are set for **Monday, Wednesday, and Friday at 10am**.

## Notes

- Written in JavaScript (the Apps Script language).
- No servers of your own: Google runs it.
- Parsing depends on lapelotona.com's HTML structure; if the site changes, the regular expressions may need adjusting.

## License

MIT — use it and modify it freely.
