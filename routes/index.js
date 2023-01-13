import express from 'express';
import auth from '../middlewares/auth';
import student from '../middlewares/student';
import teacher from '../middlewares/teacher';
import anybody from '../middlewares/anybody';



const router = express.Router();

import { registerController, loginController, userController, refreshController, questionController, answerController, chatController, bidController } from '../controllers';

router.get('/', (req, res) => {
    res.send('Hello World!');
});

//Auth Routes -----------------------------------------------------------------

router.post('/api/register', registerController.register);

router.post('/api/login', loginController.login);

router.get('/api/me',auth, userController.me)

router.post('/api/refresh',auth, refreshController.refresh)

router.post('/api/logout', loginController.logout)


//Question Routes -------------------------------------------------------------

router.post('/api/ask', auth, anybody, questionController.createQuestion);

router.get('/api/myQuestions',auth, anybody, questionController.myQuestions);

router.post('/api/updateQuestion',auth , anybody, questionController.updateQuestion);

router.post('/api/downloadAttachments',auth, questionController.downloadAttachments);

router.post('/api/deleteQuestion',auth, anybody, questionController.deleteQuestion);

//Bid Routes -----------------------------------------------------------------

router.post('/api/createBid',auth,teacher, bidController.createBid);

router.post('/api/deleteBid',auth,teacher, bidController.deleteBid);

router.post('/api/acceptBid',auth,anybody , bidController.acceptBid);

//Answer Routes ---------------------------------------------------------------

router.post('/api/answerQuestion',auth,teacher, answerController.answerQuestion);

router.post('/api/deleteAnswer',auth, teacher, answerController.deleteAnswer);

//Accept Answer Route ---------------------------------------------------------

router.post('/api/acceptAnswer',auth, anybody, questionController.acceptAnswer);

//Chat Routes -----------------------------------------------------------------

router.post('/api/sendMessage',auth, chatController.sendMessage);

router.post('/api/newChat',auth, chatController.newChat);

router.post('/api/getMyChats',auth, chatController.getMyChats);

router.post('/api/getChat',auth, chatController.getChat);



export default router;