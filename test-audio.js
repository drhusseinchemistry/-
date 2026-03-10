import https from 'https';

const url = 'https://audio.qurancdn.com/wbw/001_001_001.mp3';
https.get(url, (res) => {
  console.log('audio.qurancdn.com status:', res.statusCode);
});

const url2 = 'https://verses.quran.com/wbw/001_001_001.mp3';
https.get(url2, (res) => {
  console.log('verses.quran.com status:', res.statusCode);
});
