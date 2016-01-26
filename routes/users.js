const fs 			= require('fs');
const restify 		= require('restify');
const validator 	= require('validator');
const crypto 		= require('crypto');
const bcrypt 		= require('bcrypt');
const argon2 		= require('argon2');
const schemagic 	= require('schemagic');


const validate 		= require(__base + 'helpers/validate.js');
const base64 		= require(__base + 'helpers/base64.js');
const authHelpers	= require(__base + 'helpers/authHelpers.js');
const authorized 	= require(__base + 'helpers/authorization.js');

// Errors
const UnauthorizedError 			= require(__base + 'errors/UnauthorizedError.js');
const UserDoesNotExistError 		= require(__base + 'errors/UserDoesNotExistError.js');
const PasswordDoesNotExistError 	= require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 				= require(__base + 'errors/ValidationError.js');
const SqlError 						= require(__base + 'errors/SqlError.js');

// Models
var User = require(__base + 'models/user.js');


module.exports = function(server, log){

	var knex = require(__base + 'database.js')();

	server.get('/api/users', function(req, res, next){
		log.info({ method: 'GET', path: '/api/users' });
	
		Users.findAll()
		.then(function(users){
			res.send(200, users);
			return next();
		})
		.catch(SqlError, function(err){
			console.log(err);
			res.send(500, 'Internal database error');
			return next();
		});
	});

	server.post('/api/user', function(req, res, next){
		log.info({ method: 'POST', path: '/api/user', payload: req.body.username });
		/*
			Request Content
			Username: String
			Password: String
			PrivateKey: Binary
			PublicKey: String
		*/	
		// Validate Input
		User.create(req.body)
		.then(function(user){
			res.send(200, {message: 'OK', id: user.id});
			return next();
		})
		.catch(ValidationError, function(err){
			var parsedErrors = [];
			for( var i = 0 ; i < err.errors.length ; i++ ){				
				parsedErrors.push({ field: (err.errors[i].property).split('.')[1], error: err.errors[i].message } );
			}
			res.send(400, {error:'validation', errors:parsedErrors});
			return next();
		})
		.catch(SqlError, function(err){
			res.send(400, err.message);
			return next();
		});
	});
	
	
	
	
	
	
	
	
	
	
	

	server.put('/api/user/:id', function(req, res, next){
		if( !validate.ID(req.params.id) ){
			return next(new restify.errors.BadRequestError('Incomplete request: Invalid ID'));
		}
		log.info({ method: 'PUT', path: '/api/user/'+req.params.id, payload: req.body, auth: req.user });
		
		User.find(req.params.id)
		.then(function(user){
			return user.update(req.body);
		})
		.then(function(udpdatedUser){
			res.send(200, {message: 'OK'} );
		})
		.catch(UserDoesNotExistError, function(err){
			console.log(err);
		})
		.catch(ValidationError, function(err){
			console.log(err);
		});
	});

	server.del('/api/user/:id', authHelpers.ensureAuthenticated, function(req, res, next){
		if( !validate.ID(req.params.id) ){
			return next(new restify.errors.BadRequestError('Incomplete request: Invalid ID'));
		}
		log.info({ method: 'DEL', path: '/api/user/'+req.params.id, payload: req.body, auth: req.user });
		
		User.find( parseInt(req.params.id) )
		.then(function(user){
			return user.del();
		})
		.then(function(success){
			if(success){
				res.send(200, 'OK');	
			}else{
				res.send(400, 'error');
			}
			
			return next();
		})
		.catch(UserDoesNotExistError, function(err){
			res.send(400, 'User ID ' + req.params.id + ' was not found');
			return next();
		})
		.catch(SqlError, function(){
			res.send(500, 'Internal database error');
			return next();
		})
		.catch(ValidationError, function(err){
			var parsedErrors = [];
			for( var i = 0 ; i < err.errors.length ; i++ ){				
				parsedErrors.push({ field: (err.errors[i].property).split('.')[1], error: err.errors[i].message } );
			}
			res.send(400, {error:'validation', errors:parsedErrors});
			return next();
		});
	});	

	server.get('/api/user/:id', function(req, res, next){
	
	});

	server.get('/api/user/:id/publickey', function(req, res, next){

	});
};