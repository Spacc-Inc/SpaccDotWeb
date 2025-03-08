#!/bin/sh

useBuilder(){
    node ./SpaccDotWeb.Build/node.js "$1"
}

buildScript(){
    useBuilder "Build.BuildScriptFile('$1')"
}

for file in ./SpaccDotWeb.js ./SpaccDotWeb.*.js
    do buildScript "${file}"
done

for lib in Build
do
    lib="SpaccDotWeb.${lib}"
    output="./Build/${lib}.bundle.min.js"
    npx esbuild "./${lib}/browser.js" --bundle --minify --outfile="${output}"
    #buildScript "${output}"
done
