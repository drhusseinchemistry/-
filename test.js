import https from 'https';
https.get('https://audio.qurancdn.com/wbw/012_021_015.mp3', (res) => {
  console.log('015 size:', res.headers['content-length'], 'status:', res.statusCode);
});
https.get('https://audio.qurancdn.com/wbw/012_021_016.mp3', (res) => {
  console.log('016 size:', res.headers['content-length'], 'status:', res.statusCode);
});
