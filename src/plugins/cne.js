const puppeteer = require('puppeteer');
const userAgent = require('user-agents');
const { LogError,sleep, Log } = require('../tools');

const Provider = {
	values:{
		Tab:null,
		response:null,
		Browser:null,
	},
	has(key){ return key in this.values; },
	get(key){ return this.values[key] || null; },
	set(key, value=null){ return this.values[key]=value; },
	defined(key, option){ return this.values[key] || (this.values[key]=option); },
};



async function ScanTab({ Browser, Tab, CC, waitFor=3000, response }){
	const url = "https://www.procuraduria.gov.co/portal/index.jsp?option=co.gov.pgn.portal.frontend.component.pagefactory.AntecedentesComponentPageFactory&action=consultar_antecedentes";
	if(!Browser || (!Tab && !Browser)) throw LogError("No se recibió el Navegador o Pestaña");
	if(!Tab) Tab = Provider.defined('Tab', await Browser.newPage());
	else if(!Tab.url().includes('www.procuraduria.gov.co')){
		console.log('[Loading Page...] ');
		await Tab.goto(url ,{ waitUntil:'load', timeout:30000 });
	}

	const Page = (await Tab.frames()).find(frame => frame.url().includes('apps.procuraduria.gov.co'));

	Log('[Scaning...] ', CC);
	await Page.waitForFunction(()=>{
		const select = document.querySelector('#ddlTipoID')
		if(!select) return false;
		return select.value=1;
	},{ timeout: 30000 });

	Log('[Typing...] ', CC);
	await Page.evaluate(CC=>document.querySelector('#txtNumID').value=CC, CC);
	if(!response){
		// let response = await Page.evaluate(() => document.querySelector('#txtRespuestaPregunta').value.trim());
		console.log(`[Solving Captcha]`);
		const question = await Page.evaluate(()=>document.querySelector('#lblPregunta').innerText.toLowerCase());
		console.log(`[Question]: `, question);
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
			return ScanTab({CC, waitFor, Tab, Browser});
		}
	}
	await Page.click('#btnConsultar');
	console.log("[Waiting Response]");
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
		return names.length ? names : (error ? null : null);
	});
	if(Client){
		return { CC, name: Client.slice(0, -2).join(' '), lastname: Client.slice(-2).join(' '), };
	}
	else throw LogError("Client not Found");
}



module.exports = async function CNE(CC){
	console.clear();
	Log("[Proccess for]: ", CC);
	Log("[Opening Browser...]");
	const Browser = Provider.defined('Browser', await puppeteer.launch({
		slowMo: 250,
		headless: true,
		executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
		args: [
			'--disable-infobars',
			'--start-maximized',
			'--no-sandbox',
			'--disable-dev-shm-usage',
			"--disable-web-security",
			'--disable-features=IsolateOrigins,site-per-process',
			'--user-agent="' + (new userAgent()).toString() + '"',
		]
	}));
	return await ScanTab({ CC, Browser,
		Tab:Provider.defined('Tab', await Browser.newPage()),
	});
}