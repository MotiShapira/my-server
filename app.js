const express = require('express');
const app = express();
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
app.get('/api/time', (req, res) => {
  res.json({
    time: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString()
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
