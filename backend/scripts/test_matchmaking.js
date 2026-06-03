require('dotenv').config({ path: __dirname + '/../.env' });
const axios = require('axios');
const jwtUtil = require('../dist/utils/jwt');

const API = 'http://localhost:3000/api/game';

async function join(userId, username, elo) {
  const token = jwtUtil.generateToken({ userId, email: username + '@example.com', username });
  const res = await axios.post(`${API}/join-queue`, { username, elo }, { headers: { Authorization: `Bearer ${token}` } });
  return { token, data: res.data };
}

async function queueStatus(userId) {
  const res = await axios.get(`${API}/queue-status`, { params: { userId } });
  return res.data;
}

async function getActiveGame(token) {
  try {
    const res = await axios.get(`${API}/active-game`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  } catch (e) {
    return null;
  }
}

(async () => {
  try {
    console.log('Joining player A...');
    const a = await join('player-a-id', 'playerA', 1200);
    console.log('A joined:', a.data);

    console.log('Joining player B...');
    const b = await join('player-b-id', 'playerB', 1200);
    console.log('B joined:', b.data);

    // poll for matchmaking
    for (let i = 0; i < 10; i++) {
      const sa = await queueStatus('player-a-id');
      const sb = await queueStatus('player-b-id');
      console.log('Status A:', sa, 'Status B:', sb);

      const agA = await getActiveGame(a.token);
      const agB = await getActiveGame(b.token);
      if (agA || agB) {
        console.log('Active game found for A:', agA);
        console.log('Active game found for B:', agB);
        break;
      }

      await new Promise(r => setTimeout(r, 1000));
    }
  } catch (e) {
    console.error('Test error', e && e.response ? e.response.data : e.message);
  }
})();
