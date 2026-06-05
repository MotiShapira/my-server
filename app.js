const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const app = express();

const BOOKMARKS_FILE = path.join(__dirname, 'bookmarks.json');
function readBookmarks() {
  if (!fs.existsSync(BOOKMARKS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(BOOKMARKS_FILE, 'utf8'));
  } catch {
    return [];
  }
}
function writeBookmarks(bookmarks) {
  fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
}
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const port = 8080;

app.get('/', (req, res) => {
  res.send('Hello, World! This is my first server.');
});

app.get('/about', (req, res) => {
  res.send('This is the about page. I built this server myself!');
});

app.get('/contact', (req, res) => {
  res.sendFile('contact.html', { root: 'public' });
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  console.log('Contact form submission:', { name, email, message });
  res.json({ success: true });
});

app.get('/bookmarks', (req, res) => {
  res.sendFile('bookmarks.html', { root: 'public' });
});

app.get('/api/bookmarks', (req, res) => {
  const { browserId } = req.query;
  if (!browserId) return res.status(400).json({ error: 'browserId is required.' });
  const all = readBookmarks();
  res.json(all.filter(bm => bm.browserId === browserId));
});

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

app.post('/api/bookmarks', (req, res) => {
  const { title, url, browserId } = req.body;
  if (!title || !url || !browserId) return res.status(400).json({ error: 'title, url, and browserId are required.' });
  let parsed;
  try { parsed = new URL(url); } catch { return res.status(400).json({ error: 'url must be a valid URL.' }); }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return res.status(400).json({ error: 'url must use http or https.' });
  const all = readBookmarks();
  all.unshift({ id: randomUUID(), title, url, browserId });
  writeBookmarks(all);
  res.json(all.filter(bm => bm.browserId === browserId));
});

app.delete('/api/bookmarks/:id', (req, res) => {
  const { browserId } = req.query;
  if (!browserId) return res.status(400).json({ error: 'browserId is required.' });
  const all = readBookmarks();
  const updated = all.filter(bm => !(bm.id === req.params.id && bm.browserId === browserId));
  writeBookmarks(updated);
  res.json(updated.filter(bm => bm.browserId === browserId));
});

app.get('/calendar', (req, res) => {
  res.sendFile('calendar.html', { root: 'public' });
});

const EVENTS_FILE = path.join(__dirname, 'events.json');
function readEvents() {
  if (!fs.existsSync(EVENTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
  } catch {
    return [];
  }
}
function writeEvents(events) {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
}

app.get('/api/events', (req, res) => {
  const { month, browserId } = req.query;
  if (!browserId) return res.status(400).json({ error: 'browserId is required.' });
  let all = readEvents().filter(e => e.browserId === browserId);
  res.json(month ? all.filter(e => e.date.startsWith(month)) : all);
});

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function toMins(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function overlaps(a, b) {
  if (!a.startTime || !b.startTime) return false;
  const aS = toMins(a.startTime), bS = toMins(b.startTime);
  if (a.endTime && b.endTime) return aS < toMins(b.endTime) && bS < toMins(a.endTime);
  if (a.endTime) return bS >= aS && bS < toMins(a.endTime);
  if (b.endTime) return aS >= bS && aS < toMins(b.endTime);
  return aS === bS;
}

app.post('/api/events', (req, res) => {
  const { date, title, startTime, endTime, browserId } = req.body;
  if (!date || !title) return res.status(400).json({ error: 'date and title required' });
  if (startTime && !TIME_RE.test(startTime)) return res.status(400).json({ error: 'Invalid startTime format.' });
  if (endTime && !TIME_RE.test(endTime)) return res.status(400).json({ error: 'Invalid endTime format.' });
  if (startTime && endTime && toMins(endTime) <= toMins(startTime))
    return res.status(400).json({ error: 'endTime must be after startTime.' });
  const all = readEvents();
  const newEv = { date, title, startTime: startTime || '', endTime: endTime || '', browserId: browserId || '' };
  const sameSource = all.filter(e => e.date === date && e.browserId === (browserId || ''));
  if (startTime && sameSource.some(e => overlaps(e, newEv)))
    return res.status(409).json({ error: 'This event overlaps with an existing one.' });
  const event = { id: randomUUID(), ...newEv };
  all.push(event);
  writeEvents(all);
  res.json(event);
});

app.delete('/api/events/:id', (req, res) => {
  const { browserId } = req.query;
  if (!browserId) return res.status(400).json({ error: 'browserId is required.' });
  writeEvents(readEvents().filter(e => !(e.id === req.params.id && e.browserId === browserId)));
  res.json({ ok: true });
});

app.get('/api/time', (req, res) => {
  const now = new Date();
  res.json({
    time: now.toLocaleTimeString(),
    date: now.toLocaleDateString()
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
