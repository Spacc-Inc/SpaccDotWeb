(function(){
	const SpaccDotWeb = {};

	SpaccDotWeb.AppInit = (meta) => {
		// ... load meta from argument or page element and add to object
		return SpaccDotWeb;
	}

	SpaccDotWeb.Sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

	SpaccDotWeb.RequireScript = (src, type) => {
		const scriptElem = document.createElement('script');
		scriptElem.src = src;
		document.body.appendChild(scriptElem);
	}

	SpaccDotWeb.ShowModal = async (params) => {
	// TODO: delete dialogs from DOM after use (garbage collect)?
		if (!window.HTMLDialogElement && !window.dialogPolyfill) {
			SpaccDotWeb.RequireScript('https://googlechrome.github.io/dialog-polyfill/dist/dialog-polyfill.js');
		}
		while (!window.HTMLDialogElement && !window.dialogPolyfill) {
			await SpaccDotWeb.Sleep(50);
		}
		let output;
		if (typeof(params) === 'string') {
			params = { label: params }
		}
		const modal = document.createElement('dialog');
		modal.innerHTML = `
			<p>${params.label || params.text || ''}</p>
			${params.extraHTML || ''}
			<button name="cancel">🔙️ Cancel</button>
		`;
		if (params.actionConfirm || params.action) {
			modal.innerHTML += `
				<button name="confirm">⏩️ Confirm</button>
			`;
			const buttonConfirm = modal.querySelector('button[name="confirm"]');
			buttonConfirm.onclick = (event) => {
				output = (params.actionConfirm || params.action)(event, buttonConfirm);
				modal.close();
				return output;
			};
		}
		const buttonCancel = modal.querySelector('button[name="cancel"]');
		buttonCancel.onclick = (event) => {
			if (params.actionCancel) {
				output = actionCancel(event, buttonCancel);
			}
			modal.close();
			return output;
		};
		document.querySelector('body').appendChild(modal);
		if (window.dialogPolyfill) {
			dialogPolyfill.registerDialog(modal);
		}
		modal.showModal();
		return modal;
	}

	window.SpaccDotWeb ||= SpaccDotWeb;
})();
