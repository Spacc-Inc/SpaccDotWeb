(function(){
	const SpaccDotWeb = {};

	SpaccDotWeb.AppInit = (meta) => {
		// ... load meta from argument or page element and add to object
		return SpaccDotWeb;
	}

	SpaccDotWeb.Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	SpaccDotWeb.RequireScript = (src, type) => {
		return new Promise((resolve) => {
			const scriptElem = document.createElement('script');
			//if (type) {
			//	scriptElem.type = type;
			//}
			scriptElem.onload = (event) => {
				resolve(event);
			};
			scriptElem.src = src;
			document.body.appendChild(scriptElem);
		});
	}
	// .RequireScripts = (...) => {}

	SpaccDotWeb.ShowModal = async (params) => {
	// TODO: delete dialogs from DOM after use (garbage collect)?
		if (!window.HTMLDialogElement && !window.dialogPolyfill) {
			await SpaccDotWeb.RequireScript('https://googlechrome.github.io/dialog-polyfill/dist/dialog-polyfill.js');
		}
		let output;
		if (typeof(params) === 'string') {
			params = { label: params }
		}
		//params.deleteOnClose ||= true;
		const modal = document.createElement('dialog');
		const label = (params.label || params.text);
		modal.innerHTML = `
			${label ? `<p>${label}</p>` : ''}
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
