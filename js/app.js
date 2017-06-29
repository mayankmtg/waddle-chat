var Waddle = angular.module('Waddle', ['ngRoute', 'ngAnimate']);

Waddle.config(['$routeProvider', function($routeProvider){

	$routeProvider
		.when('/home', {
			templateUrl: 'views/home.html',
			controller: 'waddleHome',
		})
		.when('/chat', {
			templateUrl: 'views/chat.html',
			controller: 'waddleChat',
		}).otherwise({
			redirectTo: '/home'
		})
}]);

Waddle.controller('waddleHome', ['$scope', '$location', function($scope, $location){
	$scope.waddleStart = function(){
		console.log("clicked");
		$location.path('/chat');
	}
}]);

Waddle.controller('waddleChat', ['$scope', function($scope){

}]);