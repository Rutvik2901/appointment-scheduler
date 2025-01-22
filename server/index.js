const express = require('express');
const cors = require('cors');
const {port, hostUrl} = require('./config/config.js');
const router = require('./routes/routes.js');
const path = require('path');
const app = express();

app.use(express.static(path.resolve(__dirname, '../client/build')));

app.use(cors());
app.use(express.json());

app.use('/api/v1', router);

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.listen(port, () =>
  console.log(`Server is live @ ${hostUrl}`),
);
