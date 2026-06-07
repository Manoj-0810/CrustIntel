const API_KEY = process.env.CRUSTDATA_API_KEY || 'YOUR_API_KEY_HERE';

async function test(endpoint) {
  try {
    const res = await fetch(`https://api.crustdata.com${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${API_KEY}`,
        'x-api-version': '2025-11-01',
        'X-Crustdata-Version': '2025-11-01'
      },
      body: JSON.stringify({ page: 1, limit: 1 })
    });
    console.log(`Endpoint: ${endpoint} | Status: ${res.status}`);
  } catch (err) {
    console.error(err);
  }
}

async function run() {
  await test('/screener/company/search');
  await test('/screener/person/search');
  await test('/screener/job/search');
}

run();
