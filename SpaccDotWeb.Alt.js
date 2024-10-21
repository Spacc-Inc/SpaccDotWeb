(function(currentScript){
	const SpaccDotWeb = {};

	SpaccDotWeb.AppInit = (meta) => {
		// ... load meta from argument or page element and add to object
		return { ...SpaccDotWeb,
			LocalStorage: (key, value) => SpaccDotWeb.LocalStorage(`${meta.uuid}/v1`, key, value),
		};
	};

	SpaccDotWeb.LocalStorage = (prefix, key, value) => JSON.parse(
		localStorage[value !== undefined ? 'setItem' : 'getItem'](
			`${prefix}/${key}`, JSON.stringify(value)) || null);

	SpaccDotWeb.requireScript = (src, params={}) => {
		return (new Promise((resolve) => {
			const scriptElem = document.createElement('script');
			//if (type) {
			//	scriptElem.type = type;
			//}
			if (params.useCurrentPath) {
				const currentPath = currentScript.src;
				if (currentPath) {
					src = `${currentPath.split('/').slice(0, -1).join('/')}/${src}`;
				}
			}
			scriptElem.onload = resolve;
			scriptElem.src = src;
			document.body.appendChild(scriptElem);
		}));
	};
	// .RequireScripts = (...) => {}
	SpaccDotWeb.RequireScript = SpaccDotWeb.requireScript;

	SpaccDotWeb.showModal = async (params) => {
	// TODO: delete dialogs from DOM after use (garbage collect)?
		if (!window.HTMLDialogElement && !window.dialogPolyfill) {
			// TODO include in dependencies, don't load from external server
			await SpaccDotWeb.RequireScript('https://googlechrome.github.io/dialog-polyfill/dist/dialog-polyfill.js');
		}
		let output;
		if (typeof(params) === 'string') {
			params = { label: params };
		}
		//params.deleteOnClose ||= true;
		params.buttonsPosition ||= 'bottom';
		const modal = document.createElement('dialog');
		const label = (params.label || params.text);
		let buttonCancel = `<button name="cancel">${params.cancelText || '🔙️ Cancel'}</button>`;
		let buttonConfirm = '';
		if (params.actionConfirm || params.action) {
			buttonConfirm = `<button name="confirm">${params.confirmText || '⏩️ Confirm'}</button>`;
		}
		modal.innerHTML = `
			${label ? `<p>${label}</p>` : ''}
		`;
		const buttonsHtml = `<p>
			${buttonCancel}
			${buttonConfirm}
		</p>`;
		if (params.buttonsPosition == 'top') {
			modal.innerHTML += `${buttonsHtml}`;
		}
		modal.innerHTML += `${params.extraHTML || ''}`;
		if (params.buttonsPosition == 'bottom') {
			modal.innerHTML += `${buttonsHtml}`;
		}
		if (params.actionConfirm || params.action) {
			buttonConfirm = modal.querySelector('button[name="confirm"]');
			buttonConfirm.onclick = (event) => {
				output = (params.actionConfirm || params.action)(event, buttonConfirm);
				modal.close();
				return output;
			};
		}
		buttonCancel = modal.querySelector('button[name="cancel"]');
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
	};
	SpaccDotWeb.ShowModal = SpaccDotWeb.showModal;

	SpaccDotWeb.sleep = (ms) => (new Promise((resolve) => setTimeout(resolve, ms)));
	SpaccDotWeb.Sleep = SpaccDotWeb.sleep;

	window.SpaccDotWeb ||= SpaccDotWeb;
})(document.currentScript);
