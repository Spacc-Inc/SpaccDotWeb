(function(){

if (window.URL) {
	var _URL = window.URL;
	window.URL = (function URL (url, base) {
		try {
			return new (Function.prototype.bind.apply(_URL, [{}].concat([url, base])));
		} catch (err) {
			url = (
				window.SpaccDotWebServer.staticFilesData[url] ||
				window.SpaccDotWebServer.staticFilesData[`./${url}`] ||
			url);
			return { href: url, toString: (function(){ return url; }) };
		}
	});
}

if (window.fetch) {
	var _fetch = window.fetch;
	window.fetch = (function fetch (resource, options) {
		return _fetch((
			window.SpaccDotWebServer.staticFilesData[resource] ||
			window.SpaccDotWebServer.staticFilesData[`./${resource}`] ||
		resource), options);
	});
}

})();
