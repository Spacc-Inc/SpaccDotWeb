const SpaccDotWeb = ((args) => { //////////////////////////////////////////////


let windowObject, documentObject;
let Lib = {};
let isDomVirtual = false;

const platformIsNode = (typeof module === 'object' && typeof module.exports === 'object');
const platformIsBrowser = (typeof window !== 'undefined' && typeof window.document !== 'undefined');

if (platformIsNode) {
	Lib.fs = require('fs');
	Lib.jsdom = require('jsdom');
	isDomVirtual = true;
	windowObject = new Lib.jsdom.JSDOM().window;
};

if (platformIsBrowser) {
	windowObject = window;
};

documentObject = windowObject.document;


const SpaccDotWeb = ((args) => { //////////////////////////////////////////////


let SpaccDotWeb = {};

SpaccDotWeb.AppBuildStandalone = (fileIndex) => {
	fileIndex ||= 'index.html';

	isDomVirtual = true;

	let htmlIndex = Lib.fs.readFileSync(fileIndex, 'utf8');
	//let domIndex = new Lib.jsdom.JSDOM(htmlIndex);

	//let htmlFinal = DomMakeBase(AppMetaGet(domIndex));
	//let domFinal = new Lib.jsdom.JSDOM(htmlFinal);

	//for (const script of domIndex.window.document.querySelectorAll('script[module]')) {
	//	domFinal.window.document.head.innerHTML += script.outerHTML;
	//};

	//return domFinal.window.document.documentElement.outerHTML;

	/*windowDomIndex*/windowObject = new Lib.jsdom.JSDOM(htmlIndex).window;
	documentObject = windowObject.document;

	//windowObject.document.documentElement = windowDomIndex.document.documentElement;
	
	//console.log(documentObject.documentElement.outerHTML);

	DomSetup();//SpaccDotWeb.AppInit();

	return `<!DOCTYPE html>${documentObject.documentElement.outerHTML}`;
};

SpaccDotWeb.AppInit = () => {
	try {
		DomSetup(AppMetaGet());
	} catch(err) { console.log(err) }
	//if (!isDomVirtual) {
	//	DomSetup();
	//};
};

//SpaccDotWeb.DownloadFile = () => {
//	
//};

//SpaccDotWeb.Make = () => {};

SpaccDotWeb.Create = (tag, attrs) => {
	let elem = documentObject.createElement(tag);
	// ...
	return elem;
};

SpaccDotWeb.Select = (query, dom) => {
	//dom &&= dom.window.document;
	//dom ||= document;
	//return dom.querySelector(query);
	let elem = documentObject.querySelector(query);
	elem && (elem.Insert = elem.appendChild);
	return elem;
};

AppMetaGet = (/*dom*/) => JSON.parse(SpaccDotWeb.Select('#Meta'/*, dom*/).innerHTML);

DomMakeBase = (/*meta*/) => {
	const meta = AppMetaGet();
	const htmlFrags = {
		Title: (meta.Name ? `<title>${meta.Name}</title><meta property="og:title" content="${meta.Name}"/>` : ''),
		Description: (meta.Description ? `<meta name="description" content="${meta.Description}"/><meta property="og:description" content="${meta.Description}"/>` : ''),
		Uri: (meta.Uri ? `<link rel="canonical" href="${meta.Uri}"/><meta property="og:url" content="${meta.Uri}"/>` : '')
	};
	//return `<!DOCTYPE html>
	//<html>
	//	<head>
	//		<meta charset="utf-8"/>
	//		<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
	//		${htmlFrags.Title}
	//		${htmlFrags.Description}
	//		${htmlFrags.Uri}
	//		<!--<scr ipt src="https://example.com/index.js"></scr ipt>-->
	//	</head>
	//	<body>
	//		<div id="App"></div>
	//	</body>
	//</html>`;

	let scripts = '';

	if (isDomVirtual) {
		scripts += `<scr`+`ipt>${Lib.fs.readFileSync(__filename, 'utf8')}</scr`+`ipt>`;
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
		`,
		body: `<div id="App"></div>${scripts}`,
	};
};

DomSetup = (/*meta*/) => {
	const doctypeNew = documentObject.implementation.createHTMLDocument().doctype;
	windowObject.document.doctype
		? documentObject.replaceChild(doctypeNew, documentObject.doctype)
		: documentObject.insertBefore(doctypeNew, documentObject.childNodes[0]);
	//documentObject.documentElement.setHTML(DomMakeBase(data));
	//documentObject.documentElement.setHTML(`<html></html>`);
	//documentObject.write('');
	//documentObject.write(DomMakeBase(data));
	//for (el of documentObject.documentElement.childNodes) {
	//	el.remove();
	//};
	//for (el of documentObject.documentElement.childNodes) {
	//	el.remove();
	//};
	//documentObject.documentElement.setHTML('');
	//documentObject.documentElement.innerHTML = '';
	//documentObject.write('');
	const domBase = DomMakeBase(/*meta*/);
	documentObject.write(domBase.head + domBase.body);
	documentObject.head.innerHTML = domBase.head;
	documentObject.body.innerHTML = domBase.body;
};

platformIsBrowser && (window.SpaccDotWeb = SpaccDotWeb);
return SpaccDotWeb;


})(); /////////////////////////////////////////////////////////////////////////


platformIsNode && (console.log(eval(process.argv.slice(-1)[0])));

return SpaccDotWeb;


})(); /////////////////////////////////////////////////////////////////////////
