import http from 'k6/http';
import { sleep } from 'k6';

// export default function () {
//   http.get('http://103.7.41.133:3005/docs');
//   sleep(1);
// }

export default function () {
  const url = 'http://103.7.41.133:3005/api/v1/auth/login';
  const payload = JSON.stringify({
    username: 'admin@thealist.vn',
    password: 'A51bC@2d',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  http.post(url, payload, params);
  sleep(1);
}
