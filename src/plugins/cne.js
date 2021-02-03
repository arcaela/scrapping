const { Log, useBrowser, } = require('../tools');


module.exports = async function CNE(CC){
	Log(`[cneFunction for #${CC}]`);
	const url = "https://www.procuraduria.gov.co/portal/index.jsp?option=co.gov.pgn.portal.frontend.component.pagefactory.AntecedentesComponentPageFactory&action=consultar_antecedentes";
	let { Tab, Browser } = await useBrowser(url);
	if(!Browser || !Tab) return await CNE(CC);

	const Page = (await Tab.frames()).find(frame => frame.url().includes('apps.procuraduria.gov.co'));

	Log('[Scaning...] ');
	await Page.waitForFunction(()=>{
		const select = document.querySelector('#ddlTipoID')
		if(!select) return false;
		return select.value=1;
	},{ timeout: 30000 });

	Log('[Typing...] ', CC);
	await Page.evaluate(CC=>document.querySelector('#txtNumID').value=CC, CC);

	let response = await Page.evaluate(()=>document.querySelector('#txtRespuestaPregunta').value.trim());
	if(!response){
		Log(`[Solving Captcha]`);
		const question = await Page.evaluate(()=>document.querySelector('#lblPregunta').innerText.toLowerCase());
		Log(`[Question]: `, question);
		if (question.match(/cuanto es \d+ [\-\+\*\x\+] \d+/gi))
			response = eval(question.replace(/^.*(\d+.*\d+).*$/gi, "$1").replace("x", "*"));
		else if (question.match("es la capital de valle del cauca"))
			response = "cali";
		else if (question.match("capital del atlantico"))
			response = "barranquilla";
		else if (question.match("es la capital de ")) {
			const city = question.replace(/^.*Capital de (\w+).*$/gi, "$1").toLowerCase()
			response = city === 'colombia' ? 'bogota' : (
				city === 'antioquia' ? 'medellin' : null
			);
		}
		if (Boolean(response))
			await Page.evaluate(value=>document.querySelector('#txtRespuestaPregunta').value=value,response);
		else {
			await Page.evaluate(()=>document.querySelector('#ddlTipoID').remove());
			await Page.click('#ImageButton1');
			return findClient({ Browser, Tab, CC });
		}
	}

	await Page.click('#btnConsultar');

	Log("[Waiting Response]");
	await Page.waitForFunction(() => {
		const cc = document.querySelector('#txtNumID').value;
		const data = document.querySelector('.datosConsultado');
		const error = document.querySelector('#ValidationSummary1');
		return (data && data.innerText.match(`mero ${cc}.`)) || (error && error.innerText);
	}, { timeout: 20000 });

	const Client = await Page.evaluate(() => {
		const names = [];
		const cc = document.querySelector('#txtNumID').value;
		const data = document.querySelector('.datosConsultado');
		const error = document.querySelector('#ValidationSummary1');
		if (((data || {}).innerText || 'ALEJANDRO').match(`mero ${cc}.`))
			data.querySelectorAll('span').forEach(span => names.push(span.innerText))
		return names.length?names:(error?null:null);
	});

	return !Client?null:{
		CC,
		name: Client.slice(0, -2).join(' '),
		lastname: Client.slice(-2).join(' '),
	};
}