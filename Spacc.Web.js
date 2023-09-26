const SpaccDotWeb = ((args) => { //////////////////////////////////////////////


let windowObject, documentObject;
let Lib = {};
//let isDomVirtual = false;
let isBuildingApp = false;

const platformIsNode = (typeof module === 'object' && typeof module.exports === 'object');
const platformIsBrowser = (typeof window !== 'undefined' && typeof window.document !== 'undefined');

if (platformIsNode) {
	Lib.fs = require('fs');
	Lib.childProcess = require('child_process');
	Lib.jsdom = require('jsdom');
	//isDomVirtual = true;
	windowObject = new Lib.jsdom.JSDOM().window;
};

if (platformIsBrowser) {
	windowObject = window;
};

documentObject = windowObject.document;


const SpaccDotWeb = ((args) => { //////////////////////////////////////////////


let SpaccDotWeb = {};

if (platformIsNode) {
	SpaccDotWeb.AppBuildStandalone = (fileIndex) => {
		isBuildingApp = true;
		fileIndex ||= 'index.html';

		//isDomVirtual = true;

		Lib.fs.mkdirSync(`${__dirname}/Build/${fileIndex}.tmp`, { recursive: true });
		let htmlIndex = Lib.fs.readFileSync(fileIndex, 'utf8');

		windowObject = new Lib.jsdom.JSDOM(htmlIndex).window;
		documentObject = windowObject.document;

		DomSetup();//SpaccDotWeb.AppInit();

		isBuildingApp = false;
		Lib.fs.writeFileSync(`${__dirname}/Build/${fileIndex}`, `<!DOCTYPE html>${documentObject.documentElement.outerHTML}`);
	};
};

SpaccDotWeb.AppInit = function AppInit(){
	try {
		DomSetup();
	} catch(err) { console.log(err) }
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

const DomMakeBase = () => {
	const meta = AppMetaGet();

	const htmlFrags = {
		Title: (meta.Name ? `<title>${meta.Name}</title><meta property="og:title" content="${meta.Name}"/>` : ''),
		Description: (meta.Description ? `<meta name="description" content="${meta.Description}"/><meta property="og:description" content="${meta.Description}"/>` : ''),
		Uri: (meta.Uri ? `<link rel="canonical" href="${meta.Uri}"/><meta property="og:url" content="${meta.Uri}"/>` : '')
	};

	let scripts = '';

	if (isBuildingApp/*isDomVirtual*/) {
		const SpaccMinified = Lib.childProcess.execSync(`cat "${__filename}" | npx babel -f "${__filename.split('/').slice(-1)[0]}"`);
		scripts += `<scr`+`ipt src="https://cdn.jsdelivr.net/npm/core-js-bundle/minified.min.js"></scr`+`ipt>`;
		scripts += `<scr`+`ipt>${SpaccMinified}</scr`+`ipt>`;
		//scripts += `<scr`+`ipt src="https://example.com/Spacc.Web.min.js"></scr`+`ipt>`;
		//scripts += `<scr`+`ipt>${Lib.fs.readFileSync(__filename, 'utf8')}</scr`+`ipt>`;
		for (const elem of documentObject.querySelectorAll('script[module]')) {
			scripts += elem.outerHTML;
		};
	};

	return {
		head: `
			<meta charset="utf-8"/>
			<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
			${htmlFrags.Title}
			${htmlFrags.Description}
			${htmlFrags.Uri}
			<!--<scr ipt src="https://example.com/index.js"></scr ipt>-->
		`,
		body: `<div id="App"></div>${scripts}`,
	};
};

const DomSetup = () => {
	const doctypeNew = documentObject.implementation.createHTMLDocument().doctype;
	windowObject.document.doctype
		? documentObject.replaceChild(doctypeNew, documentObject.doctype)
		: documentObject.insertBefore(doctypeNew, documentObject.childNodes[0]);
	const domBase = DomMakeBase();
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
