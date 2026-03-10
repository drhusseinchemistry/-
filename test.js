import https from 'https';
fetch('https://api.quran.com/api/v4/verses/by_key/12:21?language=ar&words=true&word_fields=text_uthmani,audio_url')
  .then(r=>r.json())
  .then(d=>console.log(JSON.stringify(d.verse.words.map(w => ({text: w.text_uthmani, audio: w.audio_url})), null, 2)));
