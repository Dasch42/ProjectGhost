(function(){

	angular
		.module('ghost')
		.controller('UserAddController', UserAddController);
		
	function UserAddController($rootScope, $q, $http, $auth, $state, EncryptionService, $mdDialog) {
		var self 				= this;

		// Config
		self.config = {
			text:{
				title: 'Create New User',
				submit: 'Create',
				password: 'Password'
			},
			edit: false,
			add: true
		}
		
		// Literals
		self.user 				= {};
		self.new 				= {};
		self.enabled 			= true;

		// Exposed Interface
		self.cancel  			= cancel;
		self.submit 			= submit;


		function cancel(){
			/*$mdDialog.show({
				controller: 'LoadingController',
				templateUrl: '/app/shared/loading/loading.template.html',
				parent: angular.element(document.body),
				clickOutsideToClose:false,
				fullscreen: false
			});		*/
			console.warn("Trying...");
		}

		self.errors = [];

		function submit(){
			/*
				Creating a new user:
				1. Generate New Encryption Key (inc. salt and IV)
				2. Generate New Key Pair
				3. Encrypt Private key from 2. using 1.
				4. Post the shit to the server
			*/

			var newUser = {}

			self.enabled = false;

			$q.all([EncryptionService.generateKeyPair(), 
				EncryptionService.createEncryptionKey(self.encryption.decryptionPassword)])
			.then(function(vals){
				newUser.pk_salt = vals[1].pk_salt;
				return EncryptionService.encryptPrivateKey(vals[0], vals[1].encryptionKey);
			})
			.then(function(encr){
				// Transfer return vals into the newUser object
				_.extend(newUser, encr);
				_.extend(newUser, self.user);

				return $http({
					method: 'POST',
					url: '/api/users',
					data: newUser
				});
			})
			.then(function(res){
				self.enabled = true;
				$rootScope.$broadcast('loading-done');
				$state.transitionTo('home');
			}, function(err){
				console.warn(err)
				$mdDialog.show(
					$mdDialog.alert()
					.parent(angular.element(document.querySelector('#popupContainer')))
					.clickOutsideToClose(true)
					.title('Error')
					.textContent(err.data)
					.ariaLabel('Alert Dialog')
					.ok('OK')
				);

			});

			
		}
	};

})();