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
			controller: 'waddleContact',
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
		$scope.validUname=false;
		if($scope.waddleUname!=null){
			var wUname=""+$scope.waddleUname;
			ref2.child(wUname).once('value').then(function(snapshot){
				var corresUname= snapshot.val();
				console.log(corresUname);
				if(corresUname){
					$scope.$apply(function(){
						$scope.validUname=false;
					});
				}
				else{
					$scope.$apply(function(){
						$scope.validUname=true;
					});
				}
			});
		}

		console.log("Valid: "+ $scope.validUname);
	});
	$scope.waddleDisp= function(){
		/* TODO: write this function for profile after login */
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

Waddle.controller('waddleChat', ['$scope','Auth','$firebaseArray','$location', function($scope, Auth,$firebaseArray,$location){
	var refC=firebase.database().ref().child('Chatroom');
	var refU=firebase.database().ref().child('Users');
	var refUn=firebase.database().ref().child('usernames');
	$scope.messages=null;
	$scope.currentChatfUname=null;
	$scope.currentChatfUid=null;
	$scope.waddleFriends = $firebaseArray(refU.child(Auth.$getAuth().uid).child('Friends'));
	$scope.uname=null;
	refU.child(Auth.$getAuth().uid).child("uname").once("value")
	.then(function(snapshot){
		$scope.uname=snapshot.val();
	})
	.catch(function(error){
		console.log(error);
	});
	$scope.addWaddleFriend = function(){
		refUn.child($scope.friendUname).once('value').then(function(snapshot){
			var fUid= snapshot.val();
			if(fUid == null){
				console.log("error: No such Username found");
			}
			else if(fUid == Auth.$getAuth().uid){
				console.log("Your UID");
			}
			else{
				console.log("added");
				$scope.fwaddleFriends = $firebaseArray(refU.child(fUid).child('Friends'));
				$scope.waddleFriends.$add({
					fUid : fUid,
					fUname: $scope.friendUname
				});
				$scope.fwaddleFriends.$add({
					fUid : Auth.$getAuth().uid,
					fUname: $scope.uname
				});
				
			}
		});
			

	};
	$scope.waddleChatroom =function(fUname, fUid){
		$scope.fUname = fUname;
		$scope.messages=$firebaseArray(refC.child(Auth.$getAuth().uid).child(fUid));
		$scope.currentChatfUname=fUname;
		$scope.currentChatfUid=fUid;
	}
	$scope.waddleSend= function(){
		if($scope.currentChatfUname!=null){
			$scope.messages=$firebaseArray(refC.child(Auth.$getAuth().uid).child($scope.currentChatfUid));
			$scope.fmessages=$firebaseArray(refC.child($scope.currentChatfUid).child(Auth.$getAuth().uid));
			$scope.messages.$add({
				msg: $scope.message,
				sent: "right"
			});
			$scope.fmessages.$add({
				msg: $scope.message,
				sent: "left"
			});
			console.log("sent");
		}
		else{
			console.log("Select a Valid ChatRoom");
		}
	}
}]);

Waddle.controller('waddleContact', ['$scope','$firebaseArray', function($scope, $firebaseArray){
	var refS=firebase.database().ref().child('Suggestions');
	$scope.suggest=$firebaseArray(refS);
	$scope.message=null;
	$scope.contactForm=function(){
		$scope.suggest.$add({
			suggest_email: $scope.contactEmail,
			suggest_subject: $scope.contactSubject,
			suggest_message: $scope.contactMessage
		});
		$scope.message=$scope.contactMessage;

	}
}]);

