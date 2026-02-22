import http from 'http';

function testServer() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`サーバーレスポンス: ${res.statusCode}`);
    console.log(`ヘッダー: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ サーバーは正常に応答しています');
      console.log('レスポンスサイズ:', data.length, 'バイト');
      process.exit(0);
    });
  });

  req.on('error', (err) => {
    console.error('❌ サーバー接続エラー:', err.message);
    console.log('サーバーが起動していない可能性があります');
    process.exit(1);
  });

  req.setTimeout(5000, () => {
    console.error('❌ タイムアウト: サーバーが応答しません');
    req.destroy();
    process.exit(1);
  });

  req.end();
}

testServer();