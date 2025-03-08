window.global ||= window.globalThis;
window.SpaccDotWeb ||= {};
window.SpaccDotWeb.Build = require('./lib.js')({
	mime: require('mime-types-browser/dist/mime-types-browser'),
	babel: require('@babel/standalone'),
	uglify: require('uglifyjs-browser'),
});