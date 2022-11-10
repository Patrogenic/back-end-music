const router = require('express').Router();
const userService = require('../services/userService');

router.get('/login', userService.login);
router.get('/callback', userService.callback);

module.exports = router;