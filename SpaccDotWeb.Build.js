const Lib = {
	fs: require('fs'),
	crypto: require('crypto'),
	childProcess: require('child_process'),
	jsdom: require('jsdom'),
};

const BuildScriptFile = (scriptFile) => {
	Lib.fs.mkdirSync(`${__dirname}/Build`, { recursive: true });
	//let uptodate = true;
	const __scriptname = scriptFile.split('/').slice(-1)[0].split('.').slice(0, -1).join('.');
	const compiledPath = `${__dirname}/Build/${__scriptname}.js`;
	const minifiedPath = `${__dirname}/Build/${__scriptname}.min.js`;
	const hashPath = `${__dirname}/Build/${__scriptname}.js.hash`;
	const hashOld = (Lib.fs.existsSync(hashPath) && Lib.fs.readFileSync(hashPath, 'utf8'));
	const hashNew = Lib.crypto.createHash('sha256').update(Lib.fs.readFileSync(scriptFile, 'utf8')).digest('hex');
	if (!Lib.fs.existsSync(compiledPath) || !Lib.fs.existsSync(minifiedPath) || !(hashOld === hashNew)) {
		//uptodate = false;
		Lib.fs.writeFileSync(hashPath, hashNew);
		Lib.fs.writeFileSync(compiledPath, Lib.childProcess.execSync(`cat "${scriptFile}" | npx babel -f "${__scriptname}.js"`));
		Lib.fs.writeFileSync(minifiedPath, Lib.childProcess.execSync(`cat "${compiledPath}" | npx uglifyjs`));
	};
	//uptodate && console.log('Target is up-to-date.');
	//return { compiledText: Lib.fs.readFileSync(compiledPath, 'utf8'), minified: Lib.fs.readFileSync(minifiedPath, 'utf8') };
}

const BuildHtmlFile = (htmlFile) => {

}

console.log(eval(process.argv.slice(-1)[0]));
