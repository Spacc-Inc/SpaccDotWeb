#!/bin/sh
for file in ./SpaccDotWeb.js ./SpaccDotWeb.*.js
do node ./SpaccDotWeb.Build.js "BuildScriptFile('${file}')"
done
