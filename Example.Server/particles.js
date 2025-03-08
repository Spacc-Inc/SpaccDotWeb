window.addEventListener('load', function(){
	var c = Object.assign(document.createElement('div'), { className: "particles" });
	document.body.appendChild(c);
	for (var i=0; i<(window.innerWidth * window.innerHeight / 6000); i++) (function(){
		var v = (Math.random() * window.innerHeight), h = (100 * Math.random());
		var n = document.createElement('span');
		n.textContent = '✨️';
		c.appendChild(n);
		var e = setInterval(function(){
			var r = Math.random();
			n.style.top = (v += 1).toString() + 'px';
			n.style.left = (h += (r > 0.7 ? r/5 : -r/5)).toString() + '%';
			if (v > window.innerHeight) v = -16;
			if (h > 100) h = -2;
			else if (h < -2) h = 100;
		}, 20);
	})();
});
