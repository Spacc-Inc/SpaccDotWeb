#!/usr/bin/env node
const SpaccDotWebServer = require('../SpaccDotWeb.Server.js');
const server = SpaccDotWebServer.setup({
	appName: 'Example',
	// staticPrefix: '/static/',
	// staticRoot: '', // not (yet) implemented
	// staticFiles: [],
	linkStyles: [ 'index.css' ],
	// linkRuntimeScripts: [], // not (yet) implemented
	linkClientScripts: [ 'particles.js' ],
	// pageTitler: (title, opts={}, context) => `...`,
	// appPager: (content, title, opts={}, context) => `...`,
	// htmlPager: (content, title, opts={}, context) => `...`,
});

if (SpaccDotWebServer.envIsNode && ['dump', 'html', 'writeStaticHtml'].includes(process.argv[2])) {
	const fileName = server.writeStaticHtml({
		selfContained: Number(process.argv[3] || 0),
		htmlFilePath: process.argv[4],
	});
	console.log(`Dumped Static HTML to '${fileName}'!`);
} else {
	const serverData = server.initServer({
		// defaultResponse: { code: 500, headers: {} },
		// endpointsFalltrough: false,
		// port: 3000,
		address: '0.0.0.0',
		// maxBodyUploadSize: null,
		// handleHttpHead: true,
		// appElement: 'div#app',
		// transitionElement: 'div#transition',
		// metaCookie: 'spaccdotweb-meta',
		// cookieInUrl: 'spaccdotweb-cookie', // not (yet) implemented

		// endpoints are defined by a discriminator and an action
		endpoints: [

			// a discriminator can be a simple boolean function
			[ (ctx) => {
				const now = (new Date);
				return (['GET', 'POST'].includes(ctx.request.method) && now.getHours() === 0 && now.getMinutes() === 0);
			}, (ctx) => ctx.renderPage(`<p>We're sorry but, to avoid disturbing the spirits, Testing is not available at 00:00. Please retry in just a minute.</p>`, 'Error') ],

			// or, a discriminator can be a specially-constructed filter string
			[ 'GET|POST /main/', async (ctx) => {
			//[ (ctx) => (['GET', 'POST'].includes(ctx.request.method) && ctx.urlSections[0] === 'main'), (ctx) => {
				if (ctx.request.method === 'POST') {
					if (ctx.bodyParameters?.add) {
						ctx.setCookie(`count=${parseInt(ctx.getCookie('count') || 0) + 1}`);
					} else if (ctx.bodyParameters?.reset) {
						ctx.setCookie(`count=`);
					}

					// a short sleep so that we can test client transitions
					await (new Promise(resolve => setTimeout(resolve, 1500)));
				}
				const content = `
					<h2>Test</h2>
					<p>This page was rendered at ${Date()}.</p>
					<p>These were your cookies at time of request:</p>
					<pre>${ctx.getCookie() || '[None]'}</pre>
					<form method="POST">
						<input type="submit" name="add" value="Add 1 to cookie"/>
						<input type="submit" name="reset" value="Reset cookies"/>
					</form>
					<p>Context data for this request:</p>
					<pre>${JSON.stringify({
						request: {
							method: ctx.request.method,
						},
						urlSections: ctx.urlSections,
						urlParameters: ctx.urlParameters,
						bodyParameters: ctx.bodyParameters,
					}, null, 2)}</pre>
				`;
				// the main content of a page can be rendered with the main template using:
				ctx.renderPage(content, 'Test');
			} ],

			// redirects are easy
			[ 'GET', (ctx) => {
				ctx.redirectTo('/main/');
				// alternatively: return { code: 302, headers: { location: '/main/' } };
			} ],
		],
	});
	if (SpaccDotWebServer.envIsNode) {
		console.log(`Running Server on <${serverData.address}:${serverData.port}>...`);
	}
};
