import routerUser from './user/index.js';
import routerProfile from './test/index.js';
import middleware from '../middleware/index.js';

export default function(app) {
  app.use('/api/user', routerUser);
  app.use('/api/test', middleware.auth, routerProfile);
}
