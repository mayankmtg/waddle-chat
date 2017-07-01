var Waddle = angular.module('Waddle', ['ngRoute', 'ngAnimate', 'firebase']);

Waddle.run(["$rootScope", "$location", function($rootScope, $location) {
	$rootScope.$on("$routeChangeError", function(event, next, previous, error) {
		// We can catch the error thrown when the $requireSignIn promise is rejected
		// and redirect the user back to the home page
		if (error === "AUTH_REQUIRED") {
			$location.path("/auth");
		}
	});
}]);


Waddle.config(['$routeProvider', function($routeProvider){

	$routeProvider
		.when('/home', {
			templateUrl: 'views/home.html',
			controller: 'waddleHome',
		})
		.when('/auth', {
			templateUrl: 'views/auth.html',
			controller:'waddleAuth',
			 resolve: {
				// controller will not be loaded until $waitForSignIn resolves
				// Auth refers to our $firebaseAuth wrapper in the factory below
				"currentAuth": ["Auth", function(Auth) {
					// $waitForSignIn returns a promise so the resolve waits for it to complete
					return Auth.$waitForSignIn();
				}]
			}
		})
		.when('/chat', {
			templateUrl: 'views/chat.html',
			controller: 'waddleChat',
			resolve: {
				// controller will not be loaded until $requireSignIn resolves
				// Auth refers to our $firebaseAuth wrapper in the factory below
				"currentAuth": ["Auth", function(Auth) {
					// $requireSignIn returns a promise so the resolve waits for it to complete
					// If the promise is rejected, it will throw a $routeChangeError (see above)
					return Auth.$requireSignIn();
				}]
			}
		})
		.when('/about',{
			templateUrl: 'views/about.html',
		})
		.when('/contact',{
			templateUrl: 'views/contact.html',
		})
		.when('/profile',{
			templateUrl: 'views/profile.html',
			controller: 'waddleProfile',
			 resolve: {
				// controller will not be loaded until $waitForSignIn resolves
				// Auth refers to our $firebaseAuth wrapper in the factory below
				"currentAuth": ["Auth", function(Auth) {
					// $waitForSignIn returns a promise so the resolve waits for it to complete
					return Auth.$waitForSignIn();
				}]
			}
		}).otherwise({
			redirectTo: '/home'
		})
}]);


Waddle.factory("Auth", ["$firebaseAuth",
	function($firebaseAuth) {
		return $firebaseAuth();
	}
]);

Waddle.controller('waddleAuth', ['$scope','$location', "Auth", function($scope, $location,Auth){
	$scope.auth = Auth;

	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
      		if (firebaseUser) {
	      		$scope.firebaseUser = firebaseUser;
	      		console.log($scope.firebaseUser);
		}
    	});
	$scope.waddleStart=function(){
		$location.path('/chat');
	}
	$scope.waddleSignup = function() {
		$location.path('/profile');
	};
	$scope.waddleSignin=function(){
		$scope.error=null;
		Auth.$signInWithEmailAndPassword($scope.waddleEmail, $scope.waddlePassword)
			.catch(function(error) {
				$scope.error=error;
			});

	};
	$scope.waddleSignout=function(){
		$scope.message = "SignOut Successful";
		$location.path('/home');
		console.log("SignOut");
	}

}]);

Waddle.controller('waddleHome', ['$scope', '$location', function($scope, $location){
	$scope.waddleStart = function(){
		console.log("clicked");
		$location.path('/chat');
	}
}]);

Waddle.controller('waddleProfile', ['$scope','Auth','$firebaseArray','$location',function($scope, Auth,$firebaseArray,$location){
	$scope.auth = Auth;

	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
      		if (firebaseUser) {
	      		$scope.firebaseUser = firebaseUser;
	      		$scope.waddleDisp();
	      		console.log($scope.firebaseUser);
		}
    	});

	var ref=firebase.database().ref().child('Users');
	var ref2=firebase.database().ref().child('usernames');
	$scope.$watch("waddleUname", function(){
		$scope.validUname=true;
		ref2.once('value', function(snapshot){
			var stringUname=""+$scope.waddleUname;
			if (snapshot.hasChild(stringUname) || $scope.waddleUname=="") {
				$scope.$apply(function() {
					$scope.validUname=false;
				});
			}
		})
		console.log("Valid: "+ $scope.validUname);
	});
	$scope.waddleDisp= function(){

	}
	$scope.waddleRegister = function(){
		$scope.message = null;
		$scope.error = null;
		// Create a new user
		if($scope.waddlePassword === $scope.waddleConfirm){
			Auth.$createUserWithEmailAndPassword($scope.waddleEmail, $scope.waddlePassword)
				.then(function(firebaseUser) {
					$scope.message = "Sign Up Successful!! You can now Sign In Easily";
					ref.child(Auth.$getAuth().uid).child("name").set($scope.waddleName);
					ref.child(Auth.$getAuth().uid).child("uname").set($scope.waddleUname);
					ref2.child($scope.waddleUname).set(Auth.$getAuth().uid);
					$location.path('/auth');

				}).catch(function(error) {
					console.log(error);
					$scope.error = error;
				});	
		}
		else{
			$scope.error.code="Password Mismatch";
			$scope.error.message="Please re-enter Passwords in both fields";
			$scope.waddlePassword="";
			$scope.waddleConfirm="";

		}
			
	}
	

}]);

Waddle.controller('waddleChat', ['$scope','$firebaseArray', function($scope, $firebaseArray){

}]);