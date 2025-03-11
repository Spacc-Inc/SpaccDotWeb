#!/bin/sh
. ./BuildLib.sh

buildHtml(){
    useBuilder "BuildHtmlFile('$1', { outputFile: '$2' })"
}

for example in Server
do
    example="Example.${example}"
    file="./${example}/index.js"
    node "${file}" writeStaticHtml 0 "./${example}/index.html"
    node "${file}" writeStaticHtml 1 "./Build/${example}.html"
done

for example in Build
    do buildHtml "./SpaccDotWeb.${example}/Example.html" "SpaccDotWeb.${example}.Example.html"
done
