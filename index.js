const app = require('./app/app.js');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});