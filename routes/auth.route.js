const express= require('express');
const router= express.Router();

// Validation
const {
  validSignUp,
  validLogin,
  forgotPasswordValidator,
  resetPasswordValidator
} = require('../helpers/valid')
// Load Controllers
const {
  registerController,
  activationController,
  signinController,
  forgetController,
  resetController,
  googleController,
  facebookController
} = require('../controllers/auth.controller.js')

router.post('/register', validSignUp, registerController);

router.post('/login',validLogin, signinController);

router.post('/activation', activationController);
router.put('/password/forget', forgotPasswordValidator,forgetController);
router.put('/password/reset', resetPasswordValidator,resetController);
// Social login google and facebook
// first routes
router.post('/googlelogin',googleController);
router.post('/facebooklogin',facebookController);

module.exports= router;