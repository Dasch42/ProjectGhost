var Promise 	= require("bluebird");
Promise.onPossiblyUnhandledRejection(function(error,promise) { throw error });

const util 		= require('util');

// Erros - BlueBird
const OperationalError 			= Promise.OperationalError;

// Errors - Ghost
const UnauthorizedError 		= require(__base + 'errors/UnauthorizedError.js');
const UserDoesNotExistError 	= require(__base + 'errors/UserDoesNotExistError.js');
const PasswordDoesNotExistError 	= require(__base + 'errors/PasswordDoesNotExistError.js');



module.exports.types = {
	user 	: 0,
	password: 1
}


module.exports.isAuthorized = function(knex, type, userID, accessID){
	switch(type){
		case this.types.user:
			return isAuthorizedUser(knex, userID, accessID);
			break;
		case this.types.password:
			return isAuthorizedPassword(knex, userID, accessID);
			break;
	}
}




function isAuthorizedUser(knex, userID, accessID){

	if( userID === accessID ){
		// Only need a single database call
		return getUser(knex, userID)
		.then(function(user){
			return new Promise.resolve();
		});

	}else{
		// We need two database calls
		return Promise.all([getUser(knex, userID), getUser(knex, accessID)])
		.spread(function(user, access){
			if( user.isAdmin ){
				return new Promise.resolve();
			}

			return new Promise.reject( new UnauthorizedError('Insufficient privileges') );

		});

	}
}



function __isAuthorizedUser(knex, userID, accessID){
	return getUser(knex, userID)
	.then(function(user){
		if( user.id === accessID ){
			return new Promise.resolve(true);
		}

		return getUser(knex, accessID);
	})
	.then(function(accessedUser){
		if( user.isAdmin )
			return new Promise.resolve();

		return new Promise.reject( new UnauthorizedError('Insufficient privileges') );
	})
}

function _isAuthorizedUser (knex, userID, accessID){
	if( userID === accessID ){
	   //return q.promise.resolve({result:true});
	   return new Promise.resolve({result:true});
	}

	return knex
    .select('id','isAdmin')
    .from('users')
    .where('id', userID)
    .orWhere('id', accessID)
    .then(function(rows){

    	if( rows.length === 0 || ( rows.length === 1 && rows[0].id == accessID ) ){
            //return new Promise.reject(UserDoesNotExistError(userID));
            return new UserDoesNotExistError(userID);
    	}

        if( rows.length === 1 && rows[0].id == userID ){
            return new UserDoesNotExistError(accessID);
        }

        return new Promise.resolve({result: Boolean( (rows[0].id === userID &&  rows[0].isAdmin) || (rows[1].id === userID && rows[1].isAdmin) )});
    })
    .catch(function(err){
    	throw err;
    });

}

function getUser(knex, id){
	return knex('users')
	.select()
	.where('id', id)
	.then(function(rows){
		if( rows.length === 0 ){
			return new Promise.reject( new UserDoesNotExistError(id) );
		}
		if( rows.length > 1 ){
			return new Promise.reject( new OperationalError('Catatrophic database error. Multiple users with same ID found.') );
		}
		return new Promise.resolve(rows[0]);
	});
}

function getPassword(knex, id){

	return knex('passwords')
	.select()
	.where('id', id)
	.then(function(rows){
		if( rows.length === 0 ){
			return new Promise.reject( new PasswordDoesNotExistError(id) );
		}
		if( rows.length > 1 ){
			return new Promise.reject( new OperationalError('Catatrophic database error. Multiple users with same ID found.') );
		}

		return new Promise.resolve(rows[0]);
	});
}

function isAuthorizedPassword(knex, userID, passwordID){
	return Promise.all([
		getUser(knex, userID), 
		getPassword(knex, passwordID)
	])
	.spread(function(user, password){
		if( user.id === password.owner )
			return new Promise.resolve(true);

		return new Promise.reject( new UnauthorizedError('Insufficient privileges') );
	});
}

module.exports.getUser = getUser;
module.exports.isAuthorizedUser = isAuthorizedUser;