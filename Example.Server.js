const SpaccDotWebServer = require('./SpaccDotWeb.Server.js')({
	appName: 'Example',
	// staticPrefix: '/static/',
	// staticFiles: [],
	linkStyles: [ 'Example.css' ],
	// linkScripts: [],
	// htmlPager: htmlPager(content) => `...`,
});

if (process && process.argv[2] === 'html') {
	SpaccDotWebServer.writeStaticHtml(__filename);
} else {
	SpaccDotWebServer.initServer({
		// defaultResponse: { code: 500, headers: {} },
		// endpointsFalltrough: false,
		// port: 3000,
		// address: '127.0.0.1',
		// maxBodyUploadSize: null,
		// appElement: 'div#app',
		// transitionElement: 'div#transition',
		endpoints: [
			[ (ctx) => (['GET', 'POST'].includes(ctx.request.method) && ctx.request.url.toLowerCase().startsWith('/main/')), (ctx) => {
				if (ctx.request.method === 'POST') {
					if (ctx.bodyParameters?.add) {
						ctx.setCookie(`count=${parseInt(ctx.getCookie('count') || 0) + 1}`);
					} else if (ctx.bodyParameters?.reset) {
						ctx.setCookie(`count=`);
					};
				};
				const content = `
					<h2>Test</h2>
					${ctx.request.method === 'POST' ? `<p>POST body parameters:</p><pre>${JSON.stringify(ctx.bodyParameters)}</pre>` : ''}
					<p>This page was rendered at ${Date()}.</p>
					<p>These were your cookies at time of request:</p>
					<pre>${ctx.getCookie()}</pre>
					<form method="POST">
						<input type="submit" name="add" value="Add 1 to cookie"/>
						<input type="submit" name="reset" value="Reset cookies"/>
					</form>
				`;
				ctx.renderPage(content);
				// return { code: 200, headers: { 'content-type': 'text/html; charset=utf-8' }, body: content }
			} ],

			[ (ctx) => (ctx.request.method === 'GET'), (ctx) => ctx.redirectTo('/main/') ],
			// [ (ctx) => (ctx.request.method === 'GET'), (ctx) => ({ code: 302, headers: { location: '/main/' } }) ],
		],
	});
};
