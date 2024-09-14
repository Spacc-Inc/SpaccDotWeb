#!/usr/bin/env node
const Lib = {
	fs: require('fs'),
	mime: require('mime-types'),
	crypto: require('crypto'),
	babel: require('@babel/core'),
	uglify: require('uglify-js'),
};

const BuildScriptFile = (scriptFile, options) => {
	options = {
		forceResult: false,
		checkHash: true,
	...options };
	Lib.fs.mkdirSync(`${__dirname}/Build`, { recursive: true });
	const __scriptname = scriptFile.split('/').slice(-1)[0].split('.').slice(0, -1).join('.');
	const scriptScript = Lib.fs.readFileSync(scriptFile, 'utf8');
	const compiledPath = `${__dirname}/Build/${__scriptname}.js`;
	const minifiedPath = `${__dirname}/Build/${__scriptname}.min.js`;
	const hashPath = `${__dirname}/Build/${__scriptname}.js.hash`;
	const hashOld = (Lib.fs.existsSync(hashPath) && Lib.fs.readFileSync(hashPath, 'utf8'));
	const hashNew = Lib.crypto.createHash('sha256').update(scriptScript).digest('hex');
	if (!options.checkHash || !Lib.fs.existsSync(compiledPath) || !Lib.fs.existsSync(minifiedPath) || !(hashOld === hashNew)) {
		const compiledScript = Lib.babel.transformSync(scriptScript,
			JSON.parse(Lib.fs.readFileSync(`${__dirname}/babel.config.json`, 'utf8'))).code;
		const minifiedScript = Lib.uglify.minify(compiledScript).code;
		Lib.fs.writeFileSync(compiledPath, compiledScript);
		Lib.fs.writeFileSync(minifiedPath, minifiedScript);
		Lib.fs.writeFileSync(hashPath, hashNew);
		return { compiled: compiledScript, minified: minifiedScript };
	}
	return { notice: `Target "${scriptFile}" is up-to-date.`, ...(options.forceResult && {
		compiled: Lib.fs.readFileSync(compiledPath, 'utf8'),
		minified: Lib.fs.readFileSync(minifiedPath, 'utf8'),
	}) };
};

//const BuildHtmlFile = (htmlFile) => {
//
//}

const EncodeStaticFiles = (files, /* encoding='base64' */) => {
	const data = {};
	files.forEach(file => (data[file] = `data:${Lib.mime.lookup(file)};base64,${Lib.fs.readFileSync(file).toString('base64')}`));
	return data;
};

module.exports = { BuildScriptFile, EncodeStaticFiles };

if (require.main === module) {
	console.log(eval(process.argv.slice(-1)[0]));
}
