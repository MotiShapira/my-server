const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const app = express();

const BOOKMARKS_FILE = path.join(__dirname, 'bookmarks.json');
function readBookmarks() {
  if (!fs.existsSync(BOOKMARKS_FILE)) return [];
  return JSON.parse(fs.readFileSync(BOOKMARKS_FILE, 'utf8'));
}
function writeBookmarks(bookmarks) {
  fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
}
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const port = 3000;

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
  const all = readBookmarks();
  res.json(browserId ? all.filter(bm => bm.browserId === browserId) : all);
});

app.post('/api/bookmarks', (req, res) => {
  const { title, url, browserId } = req.body;
  const all = readBookmarks();
  all.unshift({ id: randomUUID(), title, url, browserId });
  writeBookmarks(all);
  res.json(all.filter(bm => bm.browserId === browserId));
});

app.delete('/api/bookmarks/:id', (req, res) => {
  const { browserId } = req.query;
  const all = readBookmarks();
  writeBookmarks(all.filter(bm => bm.id !== req.params.id));
  res.json(readBookmarks().filter(bm => bm.browserId === browserId));
});

app.get('/calendar', (req, res) => {
  res.sendFile('calendar.html', { root: 'public' });
});

const EVENTS_FILE = path.join(__dirname, 'events.json');
function readEvents() {
  if (!fs.existsSync(EVENTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
}
function writeEvents(events) {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
}

app.get('/api/events', (req, res) => {
  const { month } = req.query;
  const all = readEvents();
  res.json(month ? all.filter(e => e.date.startsWith(month)) : all);
});

app.post('/api/events', (req, res) => {
  const { date, title } = req.body;
  if (!date || !title) return res.status(400).json({ error: 'date and title required' });
  const all = readEvents();
  const event = { id: randomUUID(), date, title };
  all.push(event);
  writeEvents(all);
  res.json(event);
});

app.delete('/api/events/:id', (req, res) => {
  writeEvents(readEvents().filter(e => e.id !== req.params.id));
  res.json({ ok: true });
});

app.get('/api/time', (req, res) => {
  res.json({
    time: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString()
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
