const express = require('express');
const app = express();
const fetch = require('node-fetch');

app.use(express.urlencoded({ extended: true }));

app.post('/westernbid-proxy', async (req, res) => {
  console.log('Proxying WesternBid request:', req.body);
  
  try {
    const response = await fetch('https://shop.westernbid.info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(req.body)
    });
    
    const html = await response.text();
    res.send(html);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Proxy error');
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`WesternBid proxy running on port ${PORT}`);
});