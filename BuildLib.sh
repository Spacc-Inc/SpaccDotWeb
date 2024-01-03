#!/bin/sh
node ./SpaccDotWeb.js 'SpaccDotWeb.LibBuild()'
node ./SpaccDotWeb.Build.js 'BuildScriptFile("SpaccDotWeb.Alt.js")'
