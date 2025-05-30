const {server, app} = require('./app/app.js');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 8080;

app.locals.db = mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });