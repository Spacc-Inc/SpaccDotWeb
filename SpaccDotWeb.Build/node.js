#!/usr/bin/env node
const Lib = {
	fs: require('fs'),
	path: require('path'),
	mime: require('mime-types'),
	crypto: require('crypto'),
	babel: require('@babel/core'),
	uglify: require('uglify-js'),
	postcss: require('postcss'),
	postcssImport: require('postcss-import'),
	postcssUrl: require('postcss-url'),
	jsdom: require('jsdom').JSDOM,
};
let Build = require('./lib.js')(Lib);

const BuildScriptFile = (scriptFile, options) => {
	options = {
		forceResult: false,
		checkHash: true,
		outputFolder: './Build',
	...options };
	Lib.fs.mkdirSync(options.outputFolder, { recursive: true });
	const __scriptname = scriptFile.split('/').slice(-1)[0].split('.').slice(0, -1).join('.');
	const scriptText = Lib.fs.readFileSync(scriptFile, 'utf8');
	const compiledPath = `${options.outputFolder}/${__scriptname}.js`;
	const minifiedPath = `${options.outputFolder}/${__scriptname}.min.js`;
	const hashPath = `${options.outputFolder}/${__scriptname}.js.hash`;
	const hashOld = (Lib.fs.existsSync(hashPath) && Lib.fs.readFileSync(hashPath, 'utf8'));
	const hashNew = Lib.crypto.createHash('sha256').update(scriptText).digest('hex');
	if (!options.checkHash || !Lib.fs.existsSync(compiledPath) || !Lib.fs.existsSync(minifiedPath) || !(hashOld === hashNew)) {
		const builtScript = Build.BuildScript(scriptText, /* JSON.parse(Lib.fs.readFileSync(`${__dirname}/babel.config.json`, 'utf8')) */);
		Lib.fs.writeFileSync(compiledPath, builtScript.compiled);
		Lib.fs.writeFileSync(minifiedPath, builtScript.minified);
		Lib.fs.writeFileSync(hashPath, hashNew);
		return builtScript;
	}
	return { notice: `Target "${scriptFile}" is up-to-date.`, ...(options.forceResult && {
		compiled: Lib.fs.readFileSync(compiledPath, 'utf8'),
		minified: Lib.fs.readFileSync(minifiedPath, 'utf8'),
	}) };
};

const BuildHtmlFile = (htmlFile, options) => {
	options = {
		outputFolder: './Build',
		outputFile: htmlFile,
		inputFolder: Lib.path.dirname(htmlFile),
	...options };
	const outputPath = `${options.outputFolder}/${options.outputFile}`;
	Build.BuildHtml(Lib.fs.readFileSync(htmlFile, 'utf8'), options).then(html => Lib.fs.writeFileSync(outputPath, html));
	return outputPath;
};

const EncodeStaticFiles = (files, /* encoding='base64' */) => {
	const data = {};
	files.forEach(file => (data[file] = Build.fileToBase64(file)));
	return data;
};

module.exports = Build = { ...Build, BuildScriptFile, BuildHtmlFile, EncodeStaticFiles };

if (require.main === module) {
	console.log(eval(process.argv.slice(-1)[0]));
}
