module.exports = (Lib) => {

const envIsBrowser = (typeof window !== 'undefined' && typeof window.document !== 'undefined');

let babelPreset, makeHtmlDom;

if (envIsBrowser) {
    Lib.babel.registerPreset(null, {
        presets: [
            [Lib.babel.availablePresets['preset-env']],
        ],
    });
    babelPreset = 'env';
	makeHtmlDom = (html) => (new DOMParser()).parseFromString(html, 'text/html');
} else {
    babelPreset = '@babel/preset-env';
	makeHtmlDom = (html) => (new Lib.jsdom(html)).window.document;
}

const babelConfig = {
	"presets": [
		[
			babelPreset,
			{
				"targets": {
					"chrome": "4",
					"edge": "12",
					"firefox": "2",
					"ie": "6",
					"safari": "3.1",
				},
			},
		],
	],
};

const findPath = (path, folder, files) => {
	for (const prefix of [folder, (typeof __dirname !== 'undefined' ? __dirname : '')]) {
		path = (Lib.path?.join(prefix, path) || `${prefix}/${path}`);
		if ((files && (path in files)) || (!files && Lib.fs?.existsSync(path))) {
			return path;
		}
	}
};

const readFile = (path, folder, files) => {
	path = (findPath(path, folder, files) || path);
	return (files ? files[path] : Lib.fs?.readFileSync(path, 'utf8'));
}

const fileToBase64 = (path, content) => `data:${Lib.mime.lookup(path)};base64,${content || Lib.fs?.readFileSync(findPath(path))?.toString('base64')}`;

const isUrlAbsolute = (url) => (url && ['http:', 'https:', ''].includes(url.split('/')[0]));

const BuildScript = (scriptText, options) => {
	options ||= {};
	options.minify ??= true;
	const compiled = (Lib.babel.transformSync || Lib.babel.transform)(scriptText, babelConfig).code;
	const minified = (options.minify && Lib.uglify.minify(compiled).code);
	return { compiled, minified };
};

const BuildStyle = async (styleText, stylePath, options) => {
	options ||= {};
	options.minify ??= true;
	const plugins = [
		Lib.postcssImport(),
		Lib.postcssUrl({ url: 'inline' }),
		...(options.minify ? [Lib.postcssMinify()] : []),
	];
	return (await Lib.postcss(plugins).process(styleText, { from: stylePath })).css;
};

const BuildHtml = async (html, options, files) => {
	options ||= {};
	options.compileScripts ??= true;
	options.minifyScripts ??= true;
	options.compileStyles ??= true;
	options.inputFolder ??= '.';
	const dom = makeHtmlDom(html);
	for (const element of dom.querySelectorAll('script, [src], link[rel=stylesheet][href]')) {
		if (isUrlAbsolute(element.src || element.href)) {
			return;
		}
		if (element.tagName === 'SCRIPT') {
			const scriptOptions = JSON.parse(element.dataset.spaccdotweb || '{}');
			const minifyScripts = (scriptOptions.minify ?? options.minifyScripts);
			let scriptText = (element.src
				? readFile(element.src, options.inputFolder, files) //Lib.fs.readFileSync(findPath(element.src, options.inputFolder), 'utf8')
				: element.textContent);
			if (scriptOptions.compile ?? options.compileScripts) {
				scriptText = BuildScript(scriptText, { minify: minifyScripts })[minifyScripts ? 'minified' : 'compiled'];
			}
			if (scriptText) {
				element.removeAttribute('src');
				element.textContent = scriptText;
			}
		} else if (element.tagName === 'LINK') {
			const stylePath = findPath(element.href, options.inputFolder);
			let styleText = readFile(stylePath, options.inputFolder, files); //Lib.fs.readFileSync(stylePath, 'utf8');
			if (options.compileStyles && !envIsBrowser) {
				styleText = await BuildStyle(styleText, stylePath, { minify: options.minifyStyles });
			}
			element.parentElement.insertBefore(Object.assign(dom.createElement('style'), { textContent: styleText }), element);
			element.remove();
		} else {
			element.src = fileToBase64(element.src);
		}
	}
	return `<!DOCTYPE html>\n${dom.documentElement.outerHTML}`;
};

return { BuildScript, BuildHtml, fileToBase64 };

}