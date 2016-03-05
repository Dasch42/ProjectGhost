(function(){

	angular
		.module('ghost')
		.controller('addController', AddController);
		
	function AddController($http, $auth, $state, $stateParams, EncryptionService) {
		var self = this;

		self.password = {};
		self.submit = submit;
		self.title = "";
		self.categories = [];

		// Interface
		self.treeSelect = treeSelect;

		// Load Content
		$http({
			method: 'GET',
			url: '/api/users/' + $auth.getPayload().uid + '/categories'
		})
		.then(function(res){
			self.categories = createStructure(res.data);
		}, function(err){
			console.error(err);
		})


		// UI Strings
		var add = {
			title: "Create new password"
		}
		var edit = {
			title: "Edit password"
		}

		if( $stateParams.password === undefined ){
			// We're creating a new password
			self.title = add.title;
		}else{
			// We're editing a password
			self.title = edit.title;
			self.password = $stateParams.password;
			console.log("AddController: %j", self.password);

			// Decrypt the password
			EncryptionService.decrypt(self.password)
			.then(function(decrypted){
				self.password.password = decrypted;
			});
		}
		
		function treeSelect(selection){
			//$rootScope.$broadcast('category', selection);
			console.log(selection);
		}

		function submit() {
			console.log("Creating new password, %j", self.password);
			EncryptionService.encrypt(self.password)
			.then(function(encrypted){

				var password = _.clone(self.password);
				password.password = encrypted;

				return $http({
					method: 'POST',
					url: '/api/users/'+ $auth.getPayload().uid+'/passwords',
					data: password
				});
			})
			.then(function(res){
				console.log("Password added!");
				$state.transitionTo('home');
			})
			.catch(function(err){
				console.log("AddControler Error: %j", err);

				// Handle validation errors
				if( err.data.error === "validation" ){
					
				}
				
			});
		}

		function createStructure(categories){
			var map = {};
			var structure = [];

			for( var i = 0 ; i < categories.length ; i++ ){
				map[categories[i].id] = categories[i];
			}

			for( var i = 0 ; i < categories.length ; i++ ){
				// Create children list on the category
				var category = categories[i];

				// Append Values for the tree;
				category.type = 'node';

				// Create array in parent
				var parent = map[category.parent];
				if( parent !== undefined && parent !== null && category.parent !== category.id){
					// Category has a parent1
					if( parent.children === undefined ){
						parent.children = [];
					}
					parent.children.push(category);
				}else{
					// Category does not have a parent.
					structure.push(category);
				}
			}

			return structure;

		}
	};
})();
