(() => {
	const envIsNode = (typeof module === 'object' && typeof module.exports === 'object');
	const envIsBrowser = (typeof window !== 'undefined' && typeof window.document !== 'undefined');
	let fs, path, mime, multipart;
	const allOpts = {};

	const main = (globalOptions={}) => {
		allOpts.global = globalOptions;
		allOpts.global.staticPrefix ||= '/static/';
		allOpts.global.staticFiles ||= [];
		allOpts.global.linkStyles ||= [];
		allOpts.global.linkScripts ||= [];
		for (const item of [...allOpts.global.linkStyles, ...allOpts.global.linkScripts]) {
			const itemLow = item.toLowerCase();
			if (!(itemLow.startsWith('http://') || itemLow.startsWith('https://') || itemLow.startsWith('/'))) {
				allOpts.global.staticFiles.push(item);
			};
		};
		allOpts.global.htmlPager ||= (content) => `<!DOCTYPE html><html><head><!--
			--><meta charset="utf-8"/><!--
			--><meta name="viewport" content="width=device-width, initial-scale=1.0"/><!--
			-->${allOpts.global.linkStyles.map((item) => {
				return `<link rel="stylesheet" href="${allOpts.global.staticFiles.includes(item) ? (allOpts.global.staticPrefix + item) : item}"/>`;
			}).join('')}<!--
		--></head><body><!--
			--><div id="transition"></div><!--
			--><div id="app">${content}</div><!--
		--></body></html>`;
		const result = {};
		result.initServer = (serverOptions={}) => initServer(serverOptions);
		if (envIsNode) {
			result.writeStaticHtml = (mainScriptPath) => writeStaticHtml(mainScriptPath);
		};
		return result;
	};

	const initServer = (serverOptions) => {
		allOpts.server = serverOptions;
		allOpts.server.defaultResponse ||= { code: 500, headers: {} };
		allOpts.server.endpointsFalltrough ||= false;
		if (envIsNode) {
			allOpts.server.port ||= 3000;
			allOpts.server.address ||= '127.0.0.1';
			allOpts.server.maxBodyUploadSize = (parseInt(allOpts.server.maxBodyUploadSize) || undefined);
			require('http').createServer(handleRequest).listen(allOpts.server.port, allOpts.server.address);
		};
		if (envIsBrowser) {
			allOpts.server.appElement ||= 'div#app';
			allOpts.server.transitionElement ||= 'div#transition';
			const navigatePage = () => handleRequest({ url: window.location.hash.slice(1), method: 'GET' });
			window.addEventListener('hashchange', () => {
				window.location.hash ||= '/';
				navigatePage();
			});
			navigatePage();
		};
	};

	const writeStaticHtml = (mainScriptPath) => {
		fs.writeFileSync((mainScriptPath.split('.').slice(0, -1).join('.') + '.html'), allOpts.global.htmlPager(`
			<script>
				window.process = null;
				window.require = () => window.SpaccDotWebServer;
				window.resFilesData = { ${allOpts.global.staticFiles.map((file) => {
					const filePath = (mainScriptPath.split(path.sep).slice(0, -1).join(path.sep) + path.sep + file);
					return `"${file}": "data:${mime.lookup(filePath)};base64,${fs.readFileSync(filePath).toString('base64')}"`;
				})} };
			</script>
			<script src="./${path.basename(__filename)}"></script>
			<script src="./${path.basename(mainScriptPath)}"></script>
		`));
	};

	const handleRequest = async (request, response={}) => {
		// build request context and handle special tasks
		let result = allOpts.server.defaultResponse;
		const context = {
			request,
			response,
			urlParameters: (new URLSearchParams(request.url.split('?')[1]?.join('?'))),
			bodyParameters: (request.method === 'POST' && await parseBodyParams(request)), // TODO which other methods need body?
			getCookie: (cookie) => getCookie(request, cookie),
			setCookie: (cookie) => setCookie(response, cookie),
			renderPage: (content) => renderPage(response, content),
			redirectTo: (url) => redirectTo(response, url),
		};
		// serve static files
		if (envIsNode && request.method === 'GET' && request.url.toLowerCase().startsWith(allOpts.global.staticPrefix)) {
			const resPath = request.url.split(allOpts.global.staticPrefix).slice(1).join(allOpts.global.staticPrefix);
			const filePath = (__dirname + path.sep + resPath); // TODO i think we need to read this another way if the module is in a different directory from the importing program
			if (allOpts.global.staticFiles.includes(resPath) && fs.existsSync(filePath))  {
				result = { code: 200, headers: { 'content-type': mime.lookup(filePath) }, body: fs.readFileSync(filePath) };
			} else {
				result = { code: 404 };
			};
		} else {
			// handle custom endpoints
			for (const [check, procedure] of allOpts.server.endpoints) {
				if (check(context)) {
					result = await procedure(context);
					if (!allOpts.server.endpointsFalltrough) {
						break;
					};
				};
			};
		};
		// finalize a normal response
		if (result) {
			response.statusCode = result.code;
			for (const name in result.headers) {
				response.setHeader(name, result.headers[name]);
			};
			response.end(result.body);
		};
	};

	const renderPage = (response, content) => {
		// TODO titles and things
		// TODO status code could need to be different in different situations and so should be set accordingly?
		if (envIsNode) {
			response.setHeader('content-type', 'text/html; charset=utf-8');
			response.end(allOpts.global.htmlPager(content));
		};
		if (envIsBrowser) {
			document.querySelector(allOpts.server.appElement).innerHTML = content;
			for (const srcElem of document.querySelectorAll(`[src^="${allOpts.global.staticPrefix}"]`)) {
				srcElem.src = resFilesData[srcElem.getAttribute('src')];
			};
			for (const linkElem of document.querySelectorAll(`link[rel="stylesheet"][href^="${allOpts.global.staticPrefix}"]`)) {
				linkElem.href = resFilesData[linkElem.getAttribute('href').slice(allOpts.global.staticPrefix.length)];
			};
			for (const aElem of document.querySelectorAll('a[href^="/"]')) {
				aElem.href = `#${aElem.getAttribute('href')}`;
			};
			for (const formElem of document.querySelectorAll('form')) {
				formElem.onsubmit = (event) => {
					event.preventDefault();
					const formData = (new FormData(formElem));
					formData.append(event.submitter.getAttribute('name'), (event.submitter.value || 'Submit'));
					handleRequest({
						method: (formElem.getAttribute('method') || 'GET'),
						url: (formElem.getAttribute('action') || location.hash.slice(1)),
						headers: { 'content-type': (formElem.getAttribute('enctype') || "application/x-www-form-urlencoded") },
						body: formData,
					});
				};
			};
		};
	};

	const redirectTo = (response, url) => {
		if (envIsNode) {
			response.statusCode = 302;
			response.setHeader('location', url);
			response.end();
		};
		if (envIsBrowser) {
			location.hash = url;
		};
	};

	const parseBodyParams = async (request) => {
		try {
			let params = {};
			if (envIsNode) {
				request.body = Buffer.alloc(0);
				request.on('data', (data) => {
					request.body = Buffer.concat([request.body, data]);
					if (request.body.length > allOpts.server.maxBodyUploadSize) {
						request.connection?.destroy();
						// TODO handle this more gracefully? maybe an error callback or something?
					};
				});
				await new Promise((resolve) => request.on('end', () => resolve()));
			};
			const [contentMime, contentEnc] = request.headers['content-type'].split(';');
			if (envIsNode && contentMime === 'application/x-www-form-urlencoded') {
				for (const [key, value] of (new URLSearchParams(request.body.toString())).entries()) {
					params[key] = value;
				};
			} else if (envIsNode && contentMime === 'multipart/form-data') {
				for (const param of multipart.parse(request.body, contentEnc.split('boundary=')[1])) {
					params[param.name] = (param.type && param.filename !== undefined ? param : param.data.toString());
				};
			} else if (envIsBrowser && ['application/x-www-form-urlencoded', 'multipart/form-data'].includes(contentMime)) {
				for (const [key, value] of request.body) {
					params[key] = value;
					params[key].filename = params[key].name;
				};
			};
			return params;
		} catch (err) {
			console.log(err);
			request.connection?.destroy();
		};
	};

	const getCookie = (request, name) => {
		let cookies;
		if (envIsNode) {
			cookies = request.headers?.cookie;
		};
		if (envIsBrowser) {
			cookies = clientCookieApi();
		};
		if (name) {
			// get a specific cookie
			for (const cookie of (cookies?.split(';') || [])) {
				const [key, ...rest] = cookie.split('=');
				if (key === name) {
					return rest.join('=');
				};
			};
		} else {
			// get all cookies
			return cookies;
		};
	};

	const setCookie = (response, cookie) => {
		if (envIsNode) {
			response.setHeader('Set-Cookie', cookie);
			// TODO update current cookie list in existing request to reflect new assignment
		};
		if (envIsBrowser) {
			clientCookieApi(cookie);
		};
	};

	// try to use the built-in cookie API, fallback to a Storage-based wrapper in case it fails (for example on file:///)
	const clientCookieApi = (envIsBrowser && (document.cookie || (!document.cookie && (document.cookie = '_=_') && document.cookie) ? (set) => (set ? (document.cookie = set) : document.cookie) : (set) => {
		const gid = allOpts.global.appName; // TODO: introduce a conf field that is specifically a GID for less potential problems?
		if (set) {
			let api = sessionStorage;
			const tokens = set.split(';');
			const [key, ...rest] = tokens[0].split('=');
			for (let token of tokens) {
				token = token.trim();
				if (['expires', 'max-age'].includes(token.split('=')[0].toLowerCase())) {
					api = localStorage;
					break;
				};
			};
			api.setItem(`${gid}/${key}`, rest.join('='));
		} else /*(get)*/ {
			let items = '';
			for (const item of Object.entries({ ...localStorage, ...sessionStorage })) {
				if (item[0].startsWith(`${gid}/`)) {
					items += (item.join('=') + ';').slice(gid.length + 1);
				};
			}
			return items.slice(0, -1);
		};
	}));

	if (envIsNode) {
		fs = require('fs');
		path = require('path');
		mime = require('mime-types');
		multipart = require('parse-multipart-data');
		module.exports = main;
	};
	if (envIsBrowser) {
		window.SpaccDotWebServer = main;
	};
})();
