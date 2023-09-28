const SpaccDotWeb = ((args) => { //////////////////////////////////////////////


let windowObject, documentObject;
let Lib = {};
let isBuildingApp = false;
let __scriptname;

const platformIsNode = (typeof module === 'object' && typeof module.exports === 'object');
const platformIsBrowser = (typeof window !== 'undefined' && typeof window.document !== 'undefined');

if (platformIsNode) {
	Lib.fs = require('fs');
	Lib.crypto = require('crypto');
	Lib.childProcess = require('child_process');
	Lib.jsdom = require('jsdom');
	__scriptname = __filename.split('/').slice(-1)[0];
	windowObject = new Lib.jsdom.JSDOM().window;
};

if (platformIsBrowser) {
	windowObject = window;
};

documentObject = windowObject.document;


const SpaccDotWeb = ((args) => { //////////////////////////////////////////////


let SpaccDotWeb = {};

if (platformIsNode) {
	SpaccDotWeb.AppBuildStandalone = (opts) => {
		isBuildingApp = true;
		opts ||= {};
		opts.Page ||= 'index.html';
		opts.Modules && !opts.Modules.includes('Main') && (opts.Modules = [...opts.Modules, 'Main']);

		Lib.fs.mkdirSync(`${__dirname}/Build/App-${opts.Page}`, { recursive: true });
		let htmlIndex = Lib.fs.readFileSync(opts.Page, 'utf8');

		windowObject = new Lib.jsdom.JSDOM(htmlIndex).window;
		documentObject = windowObject.document;

		DomSetup(opts.Modules);
		Lib.fs.writeFileSync(`${__dirname}/Build/App-${opts.Page}/Full.html`, `<!DOCTYPE html>${documentObject.documentElement.outerHTML}`);

		isBuildingApp = false;
	};

	SpaccDotWeb.LibBuild = () => {
		Lib.fs.mkdirSync(`${__dirname}/Build/Assets.tmp`, { recursive: true });
		let uptodate = true;
		const compiledPath = `${__dirname}/Build/SpaccDotWeb.js`;
		const minifiedPath = `${__dirname}/Build/SpaccDotWeb.min.js`;
		const hashPath = `${__dirname}/Build/SpaccDotWeb.js.hash`;
		const hashOld = (Lib.fs.existsSync(hashPath) && Lib.fs.readFileSync(hashPath, 'utf8'));
		const hashNew = Lib.crypto.createHash('sha256').update(Lib.fs.readFileSync(__filename, 'utf8')).digest('hex');
		if (!Lib.fs.existsSync(compiledPath) || !Lib.fs.existsSync(minifiedPath) || !(hashOld === hashNew)) {
			uptodate = false;
			Lib.fs.writeFileSync(hashPath, hashNew);
			Lib.fs.writeFileSync(compiledPath, Lib.childProcess.execSync(`cat "${__filename}" | npx babel -f "${__scriptname}"`));
			Lib.fs.writeFileSync(minifiedPath, Lib.childProcess.execSync(`cat "${compiledPath}" | npx uglifyjs`));
		};
		uptodate && console.log('Library is up-to-date.');
		return { compiledText: Lib.fs.readFileSync(compiledPath, 'utf8'), minified: Lib.fs.readFileSync(minifiedPath, 'utf8') };
	};
};

SpaccDotWeb.AppInit = function AppInit(){
	try {
		DomSetup();
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

const AppMetaGet = () => JSON.parse(SpaccDotWeb.Select('#Meta').innerHTML);

const DomMakeBase = (Modules) => {
	const meta = AppMetaGet();

	const htmlFrags = {
		Title: (meta.Name ? `<title>${meta.Name}</title><meta property="og:title" content="${meta.Name}"/>` : ''),
		Description: (meta.Description ? `<meta name="description" content="${meta.Description}"/><meta property="og:description" content="${meta.Description}"/>` : ''),
		Uri: (meta.Uri ? `<link rel="canonical" href="${meta.Uri}"/><meta property="og:url" content="${meta.Uri}"/>` : '')
	};

	let scripts = '';

	if (isBuildingApp) {
		scripts += `<scr`+`ipt src="http://cdn.jsdelivr.net/npm/core-js-bundle/minified.min.js"></scr`+`ipt>`;
		scripts += `<scr`+`ipt src="https://cdn.jsdelivr.net/npm/core-js-bundle/minified.min.js"></scr`+`ipt>`;
		scripts += `<scr`+`ipt>${SpaccDotWeb.LibBuild().minified}</scr`+`ipt>`;
		for (const elem of documentObject.querySelectorAll('script[module]')) {
			if (!Modules || (Modules && Modules.includes(elem.getAttribute('module')))) {
				if (elem.getAttribute('src')) {
					scripts += `<scr`+`ipt src="${elem.getAttribute('src')}"></scr`+`ipt>`
				} else {
					const tmpHash = Lib.crypto.createHash('sha256').update(elem.innerHTML).digest('hex');
					const tmpPath = `${__dirname}/Build/Assets.tmp/${tmpHash}.js`;
					Lib.fs.writeFileSync(tmpPath, elem.innerHTML);
					scripts += `<scr`+`ipt>${Lib.childProcess.execSync(`cat "${tmpPath}" | npx babel -f "${tmpHash}.js" | npx uglifyjs`)}</scr`+`ipt>`;
				};
			};
		};
	};

	return {
		head: `
			<meta charset="utf-8"/>
			<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
			${htmlFrags.Title}
			${htmlFrags.Description}
			${htmlFrags.Uri}
		`,
		body: `<div id="App"></div>${scripts}`,
	};
};

const DomSetup = (Modules) => {
	const doctypeNew = documentObject.implementation.createHTMLDocument().doctype;
	windowObject.document.doctype
		? documentObject.replaceChild(doctypeNew, documentObject.doctype)
		: documentObject.insertBefore(doctypeNew, documentObject.childNodes[0]);
	const domBase = DomMakeBase(Modules);
	documentObject.write(domBase.head + domBase.body);
	documentObject.head.innerHTML = domBase.head;
	documentObject.body.innerHTML = domBase.body;
};

return SpaccDotWeb;


})(); /////////////////////////////////////////////////////////////////////////


platformIsBrowser && (window.SpaccDotWeb = SpaccDotWeb);
platformIsNode && (console.log(eval(process.argv.slice(-1)[0])));

return SpaccDotWeb;


})(); /////////////////////////////////////////////////////////////////////////
