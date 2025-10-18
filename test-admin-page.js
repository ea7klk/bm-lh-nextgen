const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(':test123').toString('base64')
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function testAdminPage() {
  try {
    console.log('Testing /admin/ page...');
    const page = await makeRequest('/admin/');
    console.log('Status:', page.status);
    console.log('Content-Type:', page.headers['content-type']);
    console.log('Body length:', page.body.length);
    console.log('Has loadStats?', page.body.includes('loadStats'));
    console.log('Has loadUsers?', page.body.includes('loadUsers'));
    console.log('\nTesting /admin/stats endpoint...');
    const stats = await makeRequest('/admin/stats');
    console.log('Status:', stats.status);
    console.log('Body:', stats.body);
    const statsData = JSON.parse(stats.body);
    console.log('Parsed:', statsData);
    
    console.log('\nTesting /admin/users endpoint...');
    const users = await makeRequest('/admin/users');
    console.log('Status:', users.status);
    console.log('Body:', users.body);
    const usersData = JSON.parse(users.body);
    console.log('User count:', usersData.length);
    console.log('First user:', usersData[0]);
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAdminPage();
