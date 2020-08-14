const User = require('../models/auth.model');
const expressJwt = require('express-jwt');
const _ = require('lodash');
const bodyParser = require('body-parser');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
// Custom error handler to get useful error from database error
const { errorHandler } = require('../helpers/doErrorHandling');
const { resetPasswordValidator } = require('../helpers/valid');

// I am going to use sendgrid for sending mail we can use nodemailer aslo
// const sgMail=require('@sendgrid/mail');
// sgMail.setApiKey(process.env.MAIL_KEY);

exports.registerController = (req, res) => {
	const { name, email, password } = req.body;
	// console.log(name,email);
	const errors = validationResult(req);
	//  Validation to req.body
	if (!errors.isEmpty()) {
		const firstError = errors.array().map((error) => error.msg)[0];
		return res.status(422).json({
			errors: firstError
		});
	} else {
		User.findOne({
			email
		}).exec((err, user) => {
			// if user exist
			if (user) {
				return res.status(400).json({
					errors: 'Email is taken'
				});
			}
		});
		// Generate Token
		const token = jwt.sign(
			{
				name,
				email,
				password
			},
			process.env.JWT_ACCOUNT_ACTIVATION,
			{
				expiresIn: '15m'
			}
		);

		// Email data sending
		const emailData = {
			from: process.env.EMAIL_FROM,
			to: email,
			subject: 'Account activation link',
			html: `
                  <h1>Please use the following to activate your account</h1>
                  <p>${process.env.CLIENT_URL}/users/activate/${token}</p>
                  <hr />
                  <p>This email may containe sensetive information</p>
                  <p>${process.env.CLIENT_URL}</p>
              `
		};

		//       sgMail
		//       .send(emailData)
		//       .then(sent => {
		//         return res.json({
		//           message: `Email has been sent to ${email}`
		//         });
		//       })
		//       .catch(err => {
		//         return res.status(400).json({
		//           success: false,
		//           errors: console.log(err)
		//         });
		//       });

		const nodemailer = require('nodemailer');
		const transport = {
			host: 'smtp.gmail.com',
			auth: {
				user: 'ks.dummy21@gmail.com',
				pass: 'dummyAccount'
			}
		};

		const transporter = nodemailer.createTransport(transport);

		transporter.verify((error, success) => {
			if (error) {
				console.log(error);
			} else {
				console.log('Server is ready to take messages');
			}
		});
		transporter.sendMail(emailData, function(error, info) {
			if (error) {
				console.log(error);
			} else {
				console.log('Email sent: ' + info.response);

				return res.json({
					message: `Email has been sent to ${email}`
				});
			}
		});
	}
};

// Register for backend done lets create frontend for that

// Activation and save to database

exports.activationController = (req, res) => {
	console.log(req.body);
	const { token } = req.body;
	//******************************************** */ here is the error resolve it tomorrow
	console.log('verified token');
	if (token) {
		// verify the token is valid or not or expired
		jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, (err, decoded) => {
			if (err) {
				console.log('Activation error');
				return res.status(401).json({
					errors: 'Expired link. Signup again'
				});
			} else {
				// if valid save to database
				// Get name email password from token
				console.log('token verified');
				const { name, email, password } = jwt.decode(token);

				console.log(email);
				const user = new User({
					name,
					email,
					password
				});

				user.save((err, user) => {
					if (err) {
						console.log('Save error', err);
						return res.status(401).json({
							errors: errorHandler(err)
						});
					} else {
						return res.json({
							success: true,
							// message: user,
							message: 'Signup success',
							user
						});
					}
				});
			}
		});
	} else {
		return res.json({
			message: 'error happening please try again'
		});
	}
};

//

exports.signinController = (req, res) => {
	const { email, password } = req.body;
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const firstError = errors.array().map((error) => error.msg)[0];
		return res.status(422).json({
			errors: firstError
		});
	} else {
		// check if user exist
		User.findOne({
			email
		}).exec((err, user) => {
			if (err || !user) {
				return res.status(400).json({
					errors: 'User with that email does not exist. Please signup'
				});
			}
			// authenticate
			if (!user.authenticate(password)) {
				return res.status(400).json({
					errors: 'Email and password do not match'
				});
			}
			// generate a token and send to client
			const token = jwt.sign(
				{
					_id: user._id
				},
				process.env.JWT_SECRET,
				{
					expiresIn: '7d'
					/**Token valid in  7day 
          and can set remember me in front and set it for 30 days*/
				}
			);
			const { _id, name, email, role } = user;

			return res.json({
				token,
				user: {
					_id,
					name,
					email,
					role
				}
			});
		});
	}
};


exports.requireSignin = expressJwt({
	secret: process.env.JWT_SECRET,
	algorithms: ['HS256'] // req.user._id
});

exports.adminMiddleware = (req, res, next) => {
  User.findById({
    _id: req.user._id
  }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User not found'
      });
    }

    if (user.role !== 'admin') {
      return res.status(400).json({
        error: 'Admin resource. Access denied.'
      });
    }

    req.profile = user;
    next();
  });
};


exports.forgetController = (req, res) => {
	const { email } = req.body;
	const errors = validationResult(req);
	// Validation to req.body we will create custom validation
	if (!errors.isEmpty()) {
		const firstError = errors.array().map((error) => error.msg)[0];
		return res.status(422).json({
			errors: firstError
		});
	} else {
		// Fine if user exists
		User.findOne({ email }, (err, user) => {
			if (err || !user) {
				return res.status(400).json({
					error: 'User with that email does not exist'
				});
			}
			//  If exist
			//  Generate token for user with this id valid for only 10 minute
			const token = jwt.sign(
				{
					_id: user._id
				},
				process.env.JWT_RESET_PASSWORD,
				{
					expiresIn: '10m'
				}
			);

			// Send email with this token
			const emailData = {
				from: process.env.EMAIL_FROM,
				to: email,
				subject: `Password Reset link`,
				html: `
                  <h1>Please use the following link to reset your password</h1>
                  <p>${process.env.CLIENT_URL}/users/password/reset/${token}</p>
                  <hr />
                  <p>This email may contain sensetive information</p>
                  <p>${process.env.CLIENT_URL}</p>
              `
			};

			return user.updateOne(
				{
					resetPasswordLink: token
				},
				(err, success) => {
					if (err) {
						return res.status(400).json({
							error: errorHandler(err)
						});
					} else {
						// Send mail using nodemailer
						const nodemailer = require('nodemailer');
						const transport = {
							host: 'smtp.gmail.com',
							auth: {
								user: 'ks.dummy21@gmail.com',
								pass: 'dummyAccount'
							}
						};

						const transporter = nodemailer.createTransport(transport);

						transporter.verify((error, success) => {
							if (error) {
								console.log(error);
							} else {
								console.log('Server is ready to take messages');
							}
						});
						transporter.sendMail(emailData, function(error, info) {
							if (error) {
								console.log(error);
							} else {
								console.log('Email sent: ' + info.response);

								return res.json({
									message: `Email has been sent to ${email}`
								});
							}
						});
					}
				}
			);
		});
	}
};

exports.resetController = (req, res) => {
	const { resetPasswordLink, newPassword } = req.body;

	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		const firstError = errors.array().map((error) => error.msg)[0];
		return res.status(422).json({
			errors: firstError
		});
	} else {
		if (resetPasswordLink) {
			jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function(err, decoded) {
				if (err) {
					return res.status(400).json({
						error: 'Expired link. Try again'
					});
				}

				User.findOne(
					{
						resetPasswordLink
					},
					(err, user) => {
						if (err || !user) {
							return res.status(400).json({
								error: 'Something went wrong. Try later'
							});
						}

						const updatedFields = {
							password: newPassword,
							resetPasswordLink: ''
						};

						user = _.extend(user, updatedFields);

						user.save((err, result) => {
							if (err) {
								return res.status(400).json({
									error: 'Error resetting user password'
								});
							}
							res.json({
								message: `Great! Now you can login with your new password`
							});
						});
					}
				);
			});
		}
	}
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT);
// Google Login
exports.googleController = (req, res) => {
	// get token from request
	const { idToken } = req.body;
	// verify token
	client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT }).then((response) => {
		// console.log('GOOGLE LOGIN RESPONSE',response)
		const { email_verified, name, email } = response.payload;
		// Check if email verified
		if (email_verified) {
			User.findOne({ email }).exec((err, user) => {
				// Fine if this email already exists
				// if exist
				if (user) {
					const token = jwt.sign(
						{ _id: user._id },
						process.env.JWT_SECRET,
						{
							// expiresIn: '7d' valid token for 7days
						}
					);
					const { _id, email, name, role } = user;
					// send response to client side(react) token and user info
					return res.json({
						token,
						user: { _id, email, name, role }
					});
				} else {
					// if user not exists we will save in database
					// and generate password for it
					let password = email + process.env.JWT_SECRET;
					// create user object with this email
					user = new User({ name, email, password });
					user.save((err, data) => {
						if (err) {
							console.log('ERROR GOOGLE LOGIN ON USER SAVE', err);
							return res.status(400).json({
								error: 'User signup failed with google'
							});
						}
						// if no error generate token
						const token = jwt.sign({ _id: data._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
						const { _id, email, name, role } = data;
						return res.json({
							token,
							user: { _id, email, name, role }
						});
					});
				}
			});
		} else {
      // if error
			return res.status(400).json({
				error: 'Google login failed. Try again'
			});
		}
	});
};

// let's implement the client side

// implement the facebook login
exports.facebookController = (req, res) => {
	console.log('FACEBOOK LOGIN REQ BODY', req.body);
	// get id and token from react
  const { userID, accessToken } = req.body;
// get from facebook
  const url = `https://graph.facebook.com/v2.11/${userID}/?fields=id,name,email&access_token=${accessToken}`;
  
  return (
    fetch(url, {
      method: 'GET'
    })
      .then(response => response.json())
      // .then(response => console.log(response))
      .then(response => {
				// get email and password from facebook
        const { email, name } = response;
        User.findOne({ email }).exec((err, user) => {
					// check if this account with this email already exists
          if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: '7d'
            });
            const { _id, email, name, role } = user;
            return res.json({
              token,
              user: { _id, email, name, role }
            });
          } else {
            let password = email + process.env.JWT_SECRET; //generate password and save to database as new user
            user = new User({ name, email, password });
            user.save((err, data) => {
              if (err) {
                console.log('ERROR FACEBOOK LOGIN ON USER SAVE', err);
                return res.status(400).json({
                  error: 'User signup failed with facebook'
                });
							}
							// If no error 
              const token = jwt.sign(
                { _id: data._id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
              );
              const { _id, email, name, role } = data;
              return res.json({
                token,
                user: { _id, email, name, role }
              });
            });
          }
        });
      })
      .catch(error => {
        res.json({
          error: 'Facebook login failed. Try later'
        });
      })
  );
};