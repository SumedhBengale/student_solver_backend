import express from 'express';
import auth from '../middlewares/auth';

const router = express.Router();

import { registerController, loginController, userController, refreshController, questionController } from '../controllers';

router.get('/', (req, res) => {
    res.send('Hello World!');
});

//Auth Routes

router.post('/api/register', registerController.register);

router.post('/api/login', loginController.login);

router.get('/api/me',auth, userController.me)

router.post('/api/refresh', refreshController.refresh)

router.post('/api/logout', auth, loginController.logout)


//Question Routes

router.post('/api/ask', auth, questionController.createQuestion);

export default router;