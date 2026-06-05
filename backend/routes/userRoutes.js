const express = require('express');
const router = express.Router();
const { loginOrRegister } = require('../controllers/userController');

router.post('/auth', loginOrRegister);

module.exports = router;
