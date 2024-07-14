/* TODO:
 * built-in logging
 * relative URL root for redirects and internal functions? (or useless since HTML must be custom anyways?)
 * utility functions for rewriting url query parameters?
 * fix hash navigation to prevent no-going-back issue (possible?)
 * finish polishing the cookie API
 * implement some nodejs `fs` functions for client-side
 * other things listed in the file
 */
(() => {

const envIsNode = (typeof module === 'object' && typeof module.exports === 'object');
const envIsBrowser = (typeof window !== 'undefined' && typeof window.document !== 'undefined');
const allOpts = {};
let fs, path, mime, multipart;

// 2 years is a good default duration for a system cookie
// they say Firefox limits to that; Chromium forces expiry after 400 days
// (https://http.dev/set-cookie#max-age)
const cookieMaxAge2Years = (2 * 365 * 24 * 60 * 60);

const setup = (globalOptions={}) => {
	allOpts.global = globalOptions;
	//allOpts.global.appName ||= 'Untitled SpaccDotWeb App';
	//allOpts.global.appRoot ||= ''; //TODO
	allOpts.global.staticPrefix ||= '/static/';
	//allOpts.global.staticRoot ||= ''; //TODO
	allOpts.global.staticFiles ||= [];
	allOpts.global.linkStyles ||= [];
	//allOpts.global.linkRuntimeScripts ||= []; //TODO
	allOpts.global.linkClientScripts ||= [];
	for (const item of [ ...allOpts.global.linkStyles, ...allOpts.global.linkClientScripts ]) {
		const itemLow = item.toLowerCase();
		if (!(itemLow.startsWith('http://') || itemLow.startsWith('https://') || itemLow.startsWith('/'))) {
			allOpts.global.staticFiles.push(item);
		}
	}
	allOpts.global.pageTitler ||= (title, opts={}) => `${title || ''}${title && allOpts.global.appName ? ' — ' : ''}${allOpts.global.appName || ''}`,
	allOpts.global.appPager ||= (content, title, opts={}) => content,
	allOpts.global.htmlPager ||= (content, title, opts={}) => `<!DOCTYPE html><html><head><!--
		--><meta charset="utf-8"/><!--
		--><meta name="viewport" content="width=device-width, initial-scale=1.0"/><!--
		--><title>${(opts.pageTitler || allOpts.global.pageTitler)(title, opts)}</title><!--
		-->${allOpts.global.linkStyles.map((path) => makeHtmlStyleFragment(path, opts.selfContained)).join('')}<!--
		-->${allOpts.global.linkClientScripts.map((path) => makeHtmlScriptFragment(path, opts.selfContained)).join('')}<!--
	--></head><body><!--
		--><div id="transition"></div><!--
		--><div id="app">${(opts.appPager || allOpts.global.appPager)(content, title, opts)}</div><!--
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
	allOpts.server.metaCookie ||= 'spaccdotweb-meta';
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

const writeStaticHtml = (selfContained=false) => {
	// TODO fix selfContained to embed everything when true, even the runtime files
	// TODO: this should somehow set envIsBrowser to true to maybe allow for correct template rendering, but how to do it without causing race conditions? maybe we should expose another variable
	const appFilePath = process.mainModule.filename;
	const htmlFilePath = (appFilePath.split('.').slice(0, -1).join('.') + '.html');
	// path.relative seems to always append an extra '../', so we must slice it
	const libraryPath = path.relative(appFilePath, __filename).split(path.sep).slice(1).join(path.sep);
	const libraryFolder = libraryPath.split(path.sep).slice(0, -1).join(path.sep);
	fs.writeFileSync(htmlFilePath, allOpts.global.htmlPager(`
		${makeHtmlScriptFragment(libraryPath, selfContained)}
		${makeHtmlScriptFragment(((libraryFolder && (libraryFolder + '/')) + 'SpaccDotWeb.Alt.js'), selfContained)}
		<${'script'}>
			window.require = () => {
				window.require = async (src, type) => {
					await SpaccDotWeb.RequireScript((src.startsWith('./') ? src : ('node_modules/' + src)), type);
				};
				return window.SpaccDotWebServer;
			};
			window.SpaccDotWebServer.staticFilesData = { ${selfContained ? allOpts.global.staticFiles.map((file) => {
				// TODO check if these paths are correct or must still be fixed
				const filePath = (appFilePath.split(path.sep).slice(0, -1).join(path.sep) + path.sep + file);
				return `"${file}":"data:${mime.lookup(filePath)};base64,${fs.readFileSync(filePath).toString('base64')}"`;
			}).join() : ''} };
		</${'script'}>
		${makeHtmlScriptFragment(path.basename(appFilePath), selfContained)}
	`, null, { selfContained }));
	return htmlFilePath;
};

const makeHtmlStyleFragment = (path, getContent) => {
	const data = getFilePathContent(path, getContent);
	return (data[1] ? `<style>${data[1]}</style>` : `<link rel="stylesheet" href="${data[0]}"/>`);
};

const makeHtmlScriptFragment = (path, getContent) => {
	const data = getFilePathContent(path, getContent);
	return `<${'script'}${data[1] ? `>${data[1]}` : ` src="${data[0]}">`}</${'script'}>`;
};

const getFilePathContent = (path, getContent) => ([
	(allOpts.global.staticFiles.includes(path) ? (allOpts.global.staticPrefix + path) : ('./' + path)),
	(getContent && fs.existsSync(path) && fs.readFileSync(path)),
]);

const handleRequest = async (request, response={}) => {
	// build request context and handle special tasks
	let result = allOpts.server.defaultResponse;
	const context = {
		request,
		response,
		cookieString: (envIsNode ? (request.headers.cookie || '') : envIsBrowser ? clientCookieApi() : ''),
		clientLanguages: parseclientLanguages(request),
		urlPath: request.url.slice(1).toLowerCase().split('?')[0],
		urlQuery: request.url.split('?')?.slice(1)?.join('?'),
		bodyParameters: (['POST', 'PUT', 'PATCH'].includes(request.method) && await parseBodyParams(request)), // TODO which other methods need body?
		//storageApi: (key,value, opts) => storageApi(key, value, opts),
		redirectTo: (url) => redirectTo(response, url),
	};
	context.renderPage = (content, title, opts) => renderPage(response, content, title, { ...opts, context });
	context.urlSections = context.urlPath.split('/');
	context.urlParameters = Object.fromEntries(new URLSearchParams(context.urlQuery));
	context.cookieData = parseCookieString(context.cookieString);
	context.getCookie = (cookieName) => (cookieName ? context.cookieData[cookieName]?.value : context.cookieString);
	context.setCookie = (cookie, cookieValue, cookieFlags) => (context.cookieString = setCookie(context.cookieData, response, cookie, cookieValue, cookieFlags));
	if (allOpts.server.metaCookie) {
		context.renewCookie = (cookieName) => renewCookie(context.getCookie, context.setCookie, cookieName);
	}
	setClientTransition(true);
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
		response.end((opts.htmlPager || allOpts.global.htmlPager)(content, title, opts));
	}
	if (envIsBrowser) {
		document.title = (opts.pageTitler || allOpts.global.pageTitler)(title, opts);
		document.querySelector(allOpts.server.appElement).innerHTML = ((opts.appPager || allOpts.global.appPager)(content, title, opts));
		for (const srcElem of document.querySelectorAll(`[src^="${allOpts.global.staticPrefix}"]`)) {
			var fileUrl = makeStaticClientFileUrl(srcElem.getAttribute('src'));
			if (srcElem.tagName === 'SCRIPT') {
				// script elements die immediately after being first set up,
				// so we must re-create them to have them run with correct uri
				srcElem.remove();
				document.head.appendChild(Object.assign(document.createElement('script'), { src: fileUrl }));
			} else {
				srcElem.src = fileUrl;
			}
		}
		for (const linkElem of document.querySelectorAll(`link[rel="stylesheet"][href^="${allOpts.global.staticPrefix}"]`)) {
			linkElem.href = makeStaticClientFileUrl(linkElem.getAttribute('href'));
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

const makeStaticClientFileUrl = (url) => {
	url = url.slice(allOpts.global.staticPrefix.length);
	return (window.SpaccDotWebServer.staticFilesData[url] || ('./' + url));
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

const makeCookieString = (cookieData) => {
	let cookieString = '';
	for (const cookieName in cookieData) {
		cookieString += `; ${cookieName}=${cookieData[cookieName].value}`;
	}
	return cookieString.slice(2);
}

const parseCookieString = (cookieString) => {
	const cookieData = {};
	if (!cookieString) {
		return cookieData;
	}
	for (const cookie of cookieString.split('; ')) {
		const [key, ...rest] = cookie.split('=');
		cookieData[key] = { value: rest.join('=') };
	}
	if (allOpts.server.metaCookie) {
		const metaData = parseMetaCookie(cookieData[allOpts.server.metaCookie]?.value);
		for (const cookieName in cookieData) {
			cookieData[cookieName] = { ...cookieData[cookieName], ...metaData[cookieName] };
		}
	}
	return cookieData;
};

const setCookie = (cookieData, response, cookie, cookieValue, cookieFlags) => {
	const cookieSet = [];
	const setCookie = (cookie, cookieValue, cookieFlags) => {
		// TODO implement setCookie with standard raw format (current) and optional javascript object format
		let cookieString, cookieName;
		if (cookieValue === undefined) {
			cookieString = cookie;
			[cookieName, ...cookieValue] = cookieString.split('; ')[0].split('=');
			cookieValue = cookieValue.join('=');
		} else {
			cookieName = cookie;
		}
		// Expires is deprecated, but old browsers don't support Max-Age
		// (https://mrcoles.com/blog/cookies-max-age-vs-expires)
		// so, we set Expires when it is missing but Max-Age is present
		let expires = false;
		let maxAge;
		for (let flag of cookieString.split('; ').slice(1)) {
			flag = flag.toLowerCase();
			if (!expires && flag.startsWith('max-age=')) {
				maxAge = flag.split('=')[1];
			} else if (flag.startsWith('expires=')) {
				expires = true;
			}
		}
		if (!expires && maxAge) {
			cookieString += `; expires=${(new Date(Date.now() + (maxAge * 1000))).toUTCString()}`;
		}
		if (envIsNode) {
			cookieSet.push(cookieString);
		} else if (envIsBrowser) {
			clientCookieApi(cookieString);
		}
		// TODO update cookie flags inside cookieData, this just updates the value
		// because of this (?) also the value of the metaCookie is not updated in the request
		cookieData[cookieName] ||= {};
		cookieData[cookieName].value = cookieValue;
		cookieString = makeCookieString(cookieData);
		return cookieString;
	};
	const result = setCookie(cookie, cookieValue, cookieFlags);
	if (allOpts.server.metaCookie) {
		const [cookieBody, ...cookieFlags] = cookie.split('; ');
		const cookieName = cookieBody.split('=')[0];
		const metaData = parseMetaCookie(cookieData[allOpts.server.metaCookie]?.value);
		if (cookieFlags.length) {
			metaData[cookieName] = parseMetaCookie(`${cookieName}&${cookieFlags.join('&')}`)[cookieName];
		} else {
			delete metaData[cookieName];
		}
		setCookie(`${allOpts.server.metaCookie}=${makeMetaCookie(metaData)}; max-age=${cookieMaxAge2Years}`);
	}
	if (envIsNode) {
		response.setHeader('set-cookie', cookieSet);
	}
	return result;
};

// TODO handle renewal of all cookies at the same time if no name specified?
const renewCookie = (getCookie, setCookie, cookieName) => {
	const metaData = parseMetaCookie(getCookie(allOpts.server.metaCookie));
	const cookieFlags = makeMetaCookie({ [cookieName]: metaData[cookieName] }).split('|')[0].slice(cookieName.length).replaceAll('&', '; ');
	setCookie(`${cookieName}=${getCookie(cookieName)}${cookieFlags}`);
	setCookie(`${allOpts.server.metaCookie}=${makeMetaCookie(metaData)}; max-age=${cookieMaxAge2Years}`);
};

// below we use pipe ('|') to split cookies and amperstand ('&') for fields,
// no problem since as of 2024 no standard cookie flag has that in the body

const makeMetaCookie = (metaData) => {
	let metaString = '';
	metaData[allOpts.server.metaCookie] ||= {};
	metaData[allOpts.server.metaCookie]['set-date'] = (new Date()).toUTCString();
	for (const [name, flags] of Object.entries(metaData)) {
		metaString += `|${name}&`;
		for (const [key, value] of Object.entries(flags)) {
			// by standard, boolean cookie flags are named without any value if true, omitted if false
			metaString += (value === true ? `${key}&` : `${key}=${value}&`);
		}
		metaString = metaString.slice(0, -1);
	}
	return metaString.slice(1);
};

const parseMetaCookie = (metaString) => {
	const metaCookie = {};
	if (!metaString) {
		return metaCookie;
	}
	for (const cookie of metaString.split('|')) {
		const [name, ...fields] = cookie.split('&');
		metaCookie[name] = {};
		for (const field of fields) {
			if (!field) {
				continue;
			}
			const [key, ...tokens] = field.split('=');
			metaCookie[name][key] = (tokens.join('=') || true);
		}
	}
	return metaCookie;
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

const exportObj = { envIsNode, envIsBrowser, setup, makeHtmlStyleFragment, makeHtmlScriptFragment };
if (envIsNode) {
	fs = require('fs');
	path = require('path');
	mime = require('mime-types');
	multipart = require('parse-multipart-data');
	module.exports = exportObj;
}
if (envIsBrowser) {
	window.SpaccDotWebServer = exportObj;
}

})();
