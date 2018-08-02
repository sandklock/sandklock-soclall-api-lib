var http = require('http'),
	_ = require('underscore'),
	md5 = require('MD5'),
	querystring = require('querystring'),
	php = require('phpjs');

var HOST = process.env.SOCIALALL_HOST || 'api2.socialall.io';

module.exports = function (app_id, app_secret) {

	this.getLoginUrl = function (network, callback_url, scope) {
		return 'https://'+HOST+'/login/' + network + '/?' + querystring.stringify({
			app_id: app_id,
			callback: callback_url,
			scope: scope
		});
	};

	this.getUser = function (token, callback) {
		var params = {
			token: token
		};

		sendRequest('/user', params, callback);
	};

	this.getFriends = function (token, callback) {
		var params = {
			token: token
		};

		sendRequest('/friends', params, callback);
	};

	this.postStream = function (token, message, callback) {
		var params = {
			token: token,
			message: message
		};

		sendRequest('/publish', params, callback);
	};

	this.getPages = function (token, callback) {
		var params = {
			token: token
		};

		sendRequest('/pages', params, callback);
	};

	this.postPage = function (token, page_id, page_token, message, callback) {
		var params = {
			token: token,
			page_id: page_id,
			page_token: page_token,
			message: message
		};

		sendRequest('/publish_page', params, callback);
	};

	this.summary = function (app_id, callback) {
		var params = {
			app_id: app_id
		};

		sendRequest('/summary', params, callback);
	};

	this.sendMessage = function (token, message, friends, title, callback) {

		if (!_.isArray(friends) || friends.length == 0)
			return callback && callback('Missing friends params');

		var params = {
			token: token,
			message: message,
			friend_id: friends.join(',')
		};

		if (_.isFunction(title))
			callback = title;
		else if (_.isString(title))
			params.title = title;

		sendRequest('/message', params, callback);
	}

	function sendRequest(path, params, callback) {

		var sig = signRequest(params);
		params.sig = sig;

		var queryParams = params ? querystring.stringify(params) : '';

		var headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
		};
		var options = {
			host: HOST,
			path: path,
			method: 'POST',
			headers: headers
		};
		var saRequest = http.request(options, function (response) {
			var responseString = '';
			var error = null;

			response.on('data', function (data) {
				responseString += data;
			});

			response.on('error', function (e) {
				error = e;
			});

			response.on('end', function () {
				var resJson = {};

				// try to parse response to json
				try {
					resJson = JSON.parse(responseString.trim());
				} catch (e) {
					error = e;
				}

				if (_.has(resJson, 'error')) error = new Error(resJson.error);

				callback && callback(error, resJson.result);
			});
		});

		saRequest.write(queryParams);
		saRequest.end();
	}

	function signRequest(data) {

		data = php.ksort(data);

		var str_data = '';
		for (var key in data)
			str_data += key + '=' + data[key];

		return md5(app_secret + str_data);
	}
}

