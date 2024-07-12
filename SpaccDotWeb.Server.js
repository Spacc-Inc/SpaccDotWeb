/* TODO:
 * built-in logging
 * configure to embed linked styles and scripts into the HTML output, or just link to file
 * relative URL root
 * utility functions for rewriting url query parameters?
 * fix hash navigation to prevent no-going-back issue
 * other things listed in the file
 */
(() => {

const envIsNode = (typeof module === 'object' && typeof module.exports === 'object');
const envIsBrowser = (typeof window !== 'undefined' && typeof window.document !== 'undefined');
const allOpts = {};
let fs, path, mime, multipart;

const setup = (globalOptions={}) => {
	allOpts.global = globalOptions;
	//allOpts.global.appName ||= 'Untitled SpaccDotWeb App';
	allOpts.global.staticPrefix ||= '/static/';
	allOpts.global.staticFiles ||= [];
	allOpts.global.linkStyles ||= [];
	allOpts.global.linkScripts ||= [];
	for (const item of [...allOpts.global.linkStyles, ...allOpts.global.linkScripts]) {
		const itemLow = item.toLowerCase();
		if (!(itemLow.startsWith('http://') || itemLow.startsWith('https://') || itemLow.startsWith('/'))) {
			allOpts.global.staticFiles.push(item);
		}
	}
	allOpts.global.pageTitler ||= (title) => `${title || ''}${title && allOpts.global.appName ? ' — ' : ''}${allOpts.global.appName || ''}`,
	allOpts.global.appPager ||= (content, title) => content,
	allOpts.global.htmlPager ||= (content, title, opts={}) => `<!DOCTYPE html><html><head><!--
		--><meta charset="utf-8"/><!--
		--><meta name="viewport" content="width=device-width, initial-scale=1.0"/><!--
		--><title>${(opts.pageTitler || allOpts.global.pageTitler)(title)}</title><!--
		-->${allOpts.global.linkStyles.map((item) => {
			return `<link rel="stylesheet" href="${allOpts.global.staticFiles.includes(item) ? (allOpts.global.staticPrefix + item) : item}"/>`;
		}).join('')}<!--
	--></head><body><!--
		--><div id="transition"></div><!--
		--><div id="app">${(opts.appPager || allOpts.global.appPager)(content, title)}</div><!--
	--></body></html>`;
	const result = {};
	result.initServer = (serverOptions={}) => initServer(serverOptions);
	if (envIsNode) {
		result.writeStaticHtml = writeStaticHtml;
	}
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
		allOpts.server.handleHttpHead ||= true;
		require('http').createServer(handleRequest).listen(allOpts.server.port, allOpts.server.address);
	}
	if (envIsBrowser) {
		allOpts.server.appElement ||= 'div#app';
		allOpts.server.transitionElement ||= 'div#transition';
		const navigatePage = () => handleRequest({ url: window.location.hash.slice(1), method: 'GET' });
		window.addEventListener('hashchange', () => {
			window.location.hash ||= '/';
			navigatePage();
		});
		navigatePage();
	}
	return allOpts.server;
};

const writeStaticHtml = () => {
	// TODO: fix script paths
	// TODO: this should somehow set envIsBrowser to true to maybe allow for correct template rendering, but how to do it without causing race conditions? maybe we should expose another variable
	const fileName = (process.mainModule.filename.split('.').slice(0, -1).join('.') + '.html');
	fs.writeFileSync(fileName, allOpts.global.htmlPager(`
		<script src="./${path.basename(__filename)}"></script>
		<script src="./SpaccDotWeb.Alt.js"></script>
		<script>
			window.require = () => {
				window.require = async (src, type) => {
					await SpaccDotWeb.RequireScript((src.startsWith('./') ? src : ('node_modules/' + src)), type);
				};
				return window.SpaccDotWebServer;
			};
			window.SpaccDotWebServer.staticFilesData = { ${allOpts.global.staticFiles.map((file) => {
				const filePath = (process.mainModule.filename.split(path.sep).slice(0, -1).join(path.sep) + path.sep + file);
				return `"${file}":"data:${mime.lookup(filePath)};base64,${fs.readFileSync(filePath).toString('base64')}"`;
			})} };
		</script>
		<script src="./${path.basename(process.mainModule.filename)}"></script>
	`));
	return fileName;
};

const handleRequest = async (request, response={}) => {
	// build request context and handle special tasks
	let result = allOpts.server.defaultResponse;
	const context = {
		request,
		response,
		urlPath: request.url.slice(1).toLowerCase().split('?')[0],
		urlQuery: request.url.split('?')?.slice(1)?.join('?'),
		bodyParameters: (['POST', 'PUT', 'PATCH'].includes(request.method) && await parseBodyParams(request)), // TODO which other methods need body?
		getCookie: (cookie) => getCookie(request, cookie),
		setCookie: (cookie) => setCookie(response, cookie),
		//storageApi: (key,value, opts) => storageApi(key, value, opts),
		renderPage: (content, title, opts) => renderPage(response, content, title, opts),
		redirectTo: (url) => redirectTo(response, url),
		clientLanguages: parseclientLanguages(request),
	};
	context.urlSections = context.urlPath.split('/');
	context.urlParameters = Object.fromEntries(new URLSearchParams(context.urlQuery));
	setClientTransition(true);
	// TODO check if this is respected even when using renderPage?
	const handlingHttpHead = (allOpts.server.handleHttpHead && request.method === 'HEAD')
	if (handlingHttpHead) {
		request.method = 'GET';
	}
	// serve static files
	if (envIsNode && request.method === 'GET' && request.url.toLowerCase().startsWith(allOpts.global.staticPrefix)) {
		const resPath = request.url.split(allOpts.global.staticPrefix).slice(1).join(allOpts.global.staticPrefix);
		const filePath = (process.mainModule.path + path.sep + resPath); // TODO i think we need to read this another way if the module is in a different directory from the importing program
		if (allOpts.global.staticFiles.includes(resPath) && fs.existsSync(filePath)) {
			result = { code: 200, headers: { 'content-type': mime.lookup(filePath) }, body: fs.readFileSync(filePath) };
		} else {
			result = { code: 404 };
		}
	} else {
		// handle custom endpoints
		for (const [check, procedure] of allOpts.server.endpoints) {
			if (await requestCheckFunction(check, context)) {
				result = await procedure(context);
				if (!allOpts.server.endpointsFalltrough) {
					break;
				}
			}
		}
	}
	// finalize a normal response
	if (result) {
		response.statusCode = result.code;
		for (const name in result.headers) {
			response.setHeader(name, result.headers[name]);
		}
		response.end(!handlingHttpHead && result.body);
	}
};

const requestCheckFunction = (check, context) => {
	if (typeof check == 'function') {
		return check(context);
	} else if (typeof check == 'string') {
		let [method, ...urlSections] = check.trim().split(' ');
		urlSections = urlSections.join(' ').trim().split('/').slice(1, -1);
		const methodCheck = (method === '*' || method.split('|').includes(context.request.method));
		let urlCheck = true;
		for (const sectionIndex in urlSections) {
			const urlSection = urlSections[sectionIndex];
			const checkSection = context.urlSections[sectionIndex];
			if (!['', '*', checkSection].includes(urlSection)) {
				urlCheck = false;
				break;
			}
		}
		return (methodCheck && urlCheck);
	}
};

const renderPage = (response, content, title, opts={}) => {
	// TODO titles and things
	// TODO status code could need to be different in different situations and so should be set accordingly? (but we don't handle it here?)
	if (envIsNode) {
		response.setHeader('content-type', 'text/html; charset=utf-8');
		response.end((opts.htmlPager || allOpts.global.htmlPager)(content, title));
	}
	if (envIsBrowser) {
		document.title = (opts.pageTitler || allOpts.global.pageTitler)(title);
		document.querySelector(allOpts.server.appElement).innerHTML = ((opts.appPager || allOpts.global.appPager)(content, title));
		for (const srcElem of document.querySelectorAll(`[src^="${allOpts.global.staticPrefix}"]`)) {
			srcElem.src = window.SpaccDotWebServer.staticFilesData[srcElem.getAttribute('src')];
		}
		for (const linkElem of document.querySelectorAll(`link[rel="stylesheet"][href^="${allOpts.global.staticPrefix}"]`)) {
			linkElem.href = window.SpaccDotWebServer.staticFilesData[linkElem.getAttribute('href').slice(allOpts.global.staticPrefix.length)];
		}
		for (const aElem of document.querySelectorAll('a[href^="/"]')) {
			aElem.href = `#${aElem.getAttribute('href')}`;
		}
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
		}
		setClientTransition(false);
	};
};

const setClientTransition = (status) => {
	let transitionElement;
	if (envIsBrowser && (transitionElement = document.querySelector(allOpts.server.transitionElement))) {
		transitionElement.hidden = !status;
		transitionElement.style.display = (status ? 'block' : 'none');
	}
}

const redirectTo = (response, url) => {
	if (envIsNode) {
		response.statusCode = 302;
		response.setHeader('location', url);
		response.end();
	}
	if (envIsBrowser) {
		location.hash = url;
	}
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
				}
			});
			await new Promise((resolve) => request.on('end', () => resolve()));
		}
		const [contentMime, contentEnc] = request.headers['content-type'].split(';');
		if (envIsNode && contentMime === 'application/x-www-form-urlencoded') {
			for (const [key, value] of (new URLSearchParams(request.body.toString())).entries()) {
				if (key in params) {
					params[key] = [].concat(params[key], value);
				} else {
					params[key] = value;
				}
			}
		} else if (envIsNode && contentMime === 'multipart/form-data') {
			for (const param of multipart.parse(request.body, contentEnc.split('boundary=')[1])) {
				params[param.name] = (param.type && param.filename !== undefined ? param : param.data.toString());
			}
		} else if (envIsBrowser && ['application/x-www-form-urlencoded', 'multipart/form-data'].includes(contentMime)) {
			for (const [key, value] of request.body) {
				params[key] = value;
				params[key].filename = params[key].name;
			}
		}
		return params;
	} catch (err) {
		console.log(err);
		request.connection?.destroy();
	}
};

const getCookie = (request, name) => {
	let cookies;
	if (envIsNode) {
		cookies = (request.headers?.cookie || '');
	} else if (envIsBrowser) {
		cookies = clientCookieApi();
	}
	if (name) {
		// get a specific cookie
		for (const cookie of (cookies?.split(';') || [])) {
			// TODO ensure this is good, whitespace must be removed at the start but idk about the end
			const [key, ...rest] = cookie.trim().split('=');
			if (key === name) {
				return rest.join('=');
			}
		}
	} else {
		// get all cookies
		return cookies;
	}
};

const setCookie = (response, cookie) => {
	if (envIsNode) {
		response.setHeader('Set-Cookie', cookie);
		// TODO update current cookie list in existing request to reflect new assignment
	} else if (envIsBrowser) {
		clientCookieApi(cookie);
	}
};

// try to use the built-in cookie API, fallback to a Storage-based wrapper in case it fails (for example on file:///)
const clientCookieApi = (envIsBrowser && (document.cookie || (!document.cookie && (document.cookie = '_=_') && document.cookie)
? (set) => (set ? (document.cookie = set) : document.cookie)
: (set) => {
	const gid = allOpts.global.appName; // TODO: introduce a conf field that is specifically a GID for less potential problems?
	// also, TODO: what to do when no app name or any id is set?
	if (set) {
		let api = sessionStorage;
		const tokens = set.split(';');
		let [key, ...rest] = tokens[0].split('=');
		for (let token of tokens) {
			token = token.trim();
			if (['expires', 'max-age'].includes(token.split('=')[0].toLowerCase())) {
				api = localStorage;
				break;
			}
		}
		key = `${gid}/${key}`;
		const value = rest.join('=');
		if (value) {
			api.setItem(key, value);
		} else {
			sessionStorage.removeItem(key);
			localStorage.removeItem(key);
		}
	} else /*(get)*/ {
		let items = '';
		for (const item of Object.entries({ ...localStorage, ...sessionStorage })) {
			if (item[0].startsWith(`${gid}/`)) {
				items += (item.join('=') + ';').slice(gid.length + 1);
			}
		}
		return items.slice(0, -1);
	}
}));

const parseclientLanguages = (request) => {
	if (envIsNode) {
		const languages = [];
		const languageTokens = request.headers['accept-language']?.split(',');
		if (languageTokens) {
			for (const language of languageTokens) {
				languages.push(language.split(';')[0].trim());
			}
		}
		return languages;
	} else if (envIsBrowser) {
		return (navigator.languages || [navigator.language /* || navigator.userLanguage */]);
	}
};

const exportObj = { envIsNode, envIsBrowser, setup };
if (envIsNode) {
	fs = require('fs');
	path = require('path');
	mime = require('mime-types');
	multipart = require('parse-multipart-data');
	module.exports = exportObj;
};
if (envIsBrowser) {
	window.SpaccDotWebServer = exportObj;
};

})();
