require('dotenv').config();
const app = require('./app');

// start scheduled jobs only when the server launches directly
const { scheduleDailySummary } = require('./services/cronJobs');
scheduleDailySummary();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
