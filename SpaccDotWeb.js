#!/usr/bin/env node
const SpaccDotWeb = ((args) => { //////////////////////////////////////////////


let windowObject, documentObject;
let Lib = {};
let isBuildingApp = false;
let __scriptname;

const platformIsNode = (typeof module === 'object' && typeof module.exports === 'object');
const platformIsBrowser = (typeof window !== 'undefined' && typeof window.document !== 'undefined');
const __filename__ = (typeof __filename !== 'undefined' ? __filename : '');
const JsdomOptions = { /*resources: "usable",*/ runScripts: /*"dangerously"*/"outside-only" };

if (platformIsNode) {
	Lib.fs = require('fs');
	Lib.crypto = require('crypto');
	Lib.childProcess = require('child_process');
	Lib.jsdom = require('jsdom');
	Lib.Build = require('./SpaccDotWeb.Build.js').BuildScriptFile;
	__scriptname = __filename__.split('/').slice(-1)[0];
	windowObject = new Lib.jsdom.JSDOM('', JsdomOptions).window;
};

if (platformIsBrowser) {
	windowObject = window;
};

documentObject = windowObject.document;


const SpaccDotWeb = ((args) => { //////////////////////////////////////////////


let SpaccDotWeb = {};

if (platformIsNode) {
	SpaccDotWeb.AppBuildStandalone = (opts) => { // TODO: build result of dom after JS, to make base page usable without JS
		isBuildingApp = true;
		opts ||= {};
		opts.Page ||= 'index.html';
		opts.Modules && !opts.Modules.includes('Main') && (opts.Modules = [...opts.Modules, 'Main']);

		Lib.fs.mkdirSync(`${__dirname}/Build/App-${opts.Page}`, { recursive: true });
		let htmlIndex = Lib.fs.readFileSync(opts.Page, 'utf8');

		windowObject = new Lib.jsdom.JSDOM(htmlIndex, JsdomOptions).window;
		documentObject = windowObject.document;

		DomSetup(opts.Modules);
		Lib.fs.writeFileSync(`${__dirname}/Build/App-${opts.Page}/Full.html`, `<!DOCTYPE html>${documentObject.documentElement.outerHTML}`);

		isBuildingApp = false;
	};
};

SpaccDotWeb.AppInit = () => {
	try {
		DomSetup();
		return SpaccDotWeb;
	} catch(err) { console.log(err) };
};

//SpaccDotWeb.Make = () => {};

SpaccDotWeb.Create = (tag, attrs) => {
	let elem = documentObject.createElement(tag);
	for (const key in attrs) {
		elem[key] = attrs[key];
	};
	return elem;
};

SpaccDotWeb.Select = (query) => {
	let elem = documentObject.querySelector(query);
	elem && (elem.Insert = elem.appendChild);
	return elem;
};

SpaccDotWeb.RequireScript = (src) => {
	if (platformIsBrowser) {
		SpaccDotWeb.Select('body').Insert(SpaccDotWeb.Create('script', { src: src }));
	//} else if (platformIsNode) {
	//	require(src);
	}
};

// TODO: make Meta element optional without breaking things
const AppMetaGet = () => {
	const elem = SpaccDotWeb.Select('script[module="Meta"]');
	if (elem) {
		if (['application/json', 'text/json'].includes(elem.getAttribute('type'))) {
			return JSON.parse(elem.innerHTML);
		} else {
			return eval(elem.innerHTML);
		};
	};
};

const DomMakeBase = (Modules) => {
	const meta = AppMetaGet();

	if (meta) {
		const htmlFrags = {
			Title: (meta.Name ? `<title>${meta.Name}</title><meta property="og:title" content="${meta.Name}"/>` : ''),
			Description: (meta.Description ? `<meta name="description" content="${meta.Description}"/><meta property="og:description" content="${meta.Description}"/>` : ''),
			Uri: (meta.Uri ? `<link rel="canonical" href="${meta.Uri}"/><meta property="og:url" content="${meta.Uri}"/>` : '')
		};

		let [scriptsCode, elementsHtml, scriptsHtml] = ['', '', ''];

		if (isBuildingApp) {
			scriptsHtml += `<scr`+`ipt src="http://cdn.jsdelivr.net/npm/core-js-bundle/minified.min.js"></scr`+`ipt>`;
			scriptsHtml += `<scr`+`ipt src="https://cdn.jsdelivr.net/npm/core-js-bundle/minified.min.js"></scr`+`ipt>`;
			scriptsHtml += `<scr`+`ipt>${Lib.Build(__filename__, { forceResult: true }).minified}</scr`+`ipt>`;
			for (const elem of documentObject.querySelectorAll('script[module]')) {
				//if (elem.module === 'Meta' && !['application/json', 'text/json'].includes(elem.type)) {
				//	elem.innerHTML = `(${elem.innerHTML})`;
				//};
				if (elem.getAttribute('module') !== 'SpaccDotWeb' && (!Modules || (Modules && Modules.includes(elem.getAttribute('module'))))) {
					if (elem.getAttribute('src')) {
						scriptsHtml += `<scr`+`ipt src="${elem.getAttribute('src')}"></scr`+`ipt>`;
						// TODO somehow include this in prerendered DOM?
					} else {
						const tmpHash = Lib.crypto.createHash('sha256').update(elem.innerHTML).digest('hex');
						const tmpPath = `${__dirname}/Build/Assets.tmp/${tmpHash}.js`;
						Lib.fs.mkdirSync(`${__dirname}/Build/Assets.tmp`, { recursive: true });
						Lib.fs.writeFileSync(tmpPath, elem.innerHTML);
						const scriptCode = Lib.childProcess.execSync(`cat "${tmpPath}" | npx babel -f "${tmpHash}.js" | npx uglifyjs`);
						scriptsCode += scriptCode;
						scriptsHtml += `<scr`+`ipt>${Lib.childProcess.execSync(`cat "${tmpPath}" | npx babel -f "${tmpHash}.js" | npx uglifyjs`)}</scr`+`ipt>`;
					};
				};
				elem.remove();
			};
			// select and include all remaining actual elements, except parent meta-elements
			for (const elem of documentObject.querySelectorAll('* > * > *')) {
				elementsHtml += elem.outerHTML;
			}
		};

		return {
			head: `
				<meta charset="utf-8"/>
				<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
				${htmlFrags.Title}
				${htmlFrags.Description}
				${htmlFrags.Uri}
			`,
			body: `<div id="App"></div>${elementsHtml}${scriptsHtml}`,
			scriptsCode: scriptsCode,
		};
	};
};

const DomSetup = (Modules) => {
	const doctypeNew = documentObject.implementation.createHTMLDocument().doctype;
	windowObject.document.doctype
		? documentObject.replaceChild(doctypeNew, documentObject.doctype)
		: documentObject.insertBefore(doctypeNew, documentObject.childNodes[0]);
	const domBase = DomMakeBase(Modules);
	if (domBase) {
		documentObject.write(domBase.head + domBase.body);
		documentObject.head.innerHTML = domBase.head;
		documentObject.body.innerHTML = domBase.body;
		if (isBuildingApp) {
			windowObject.eval(Lib.fs.readFileSync(__filename__, 'utf-8') + domBase.scriptsCode);
		};
	};
};

return SpaccDotWeb;


})(); /////////////////////////////////////////////////////////////////////////


platformIsBrowser && (window.SpaccDotWeb = SpaccDotWeb);
platformIsNode && process.argv.length >= 2 && console.log(eval(process.argv.slice(-1)[0]));

return SpaccDotWeb;


})(); /////////////////////////////////////////////////////////////////////////
