const API_KEY = process.env.CRUSTDATA_API_KEY || 'YOUR_API_KEY_HERE';

async function test() {
  try {
    const res = await fetch(`https://api.crustdata.com/job/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${API_KEY}`,
        'x-api-version': '2025-11-01',
        'X-Crustdata-Version': '2025-11-01'
      },
      body: JSON.stringify({
        filters: {
          field: "company_name",
          type: "=",
          value: "Apollo.io"
        },
        limit: 1
      })
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text.substring(0, 1000));
  } catch (err) {
    console.error(err);
  }
}

test();
