const puppeteer = require('puppeteer');
const firebase = require('firebase/app').default;
const userAgent = require('user-agents');
require('firebase/firestore');
firebase.initializeApp({
	apiKey: "AIzaSyBntYCJH39TRORGUSYpYHHrcg4Etk8Y208",
	authDomain: "dimelo-vip-col.firebaseapp.com",
	databaseURL: "https://dimelo-vip-col-default-rtdb.firebaseio.com",
	projectId: "dimelo-vip-col",
	storageBucket: "dimelo-vip-col.appspot.com",
	messagingSenderId: "909520655494",
	appId: "1:909520655494:web:f1f178d8e564789ea22d07"
});
const sleep = (time = 1000) => new Promise(resolve => setTimeout(() => resolve(time), time));



async function ScanTab({ Tab, CC, max, response = null }) {
	if(CC > max) return process.close();
	console.clear();
	console.log(`[Scaneando: ${CC}]`);
	const Page = Tab.url().includes('apps.procuraduria.gov.co') ? Tab :
		(await Tab.frames()).find(frame => frame.url().includes('apps.procuraduria.gov.co'));
	await Page.waitForSelector('#ddlTipoID', {visible:true, timeout: 30000});
	if (!response) {
		console.log(`[Solving Captcha]`);
		response = await Page.evaluate(() => document.querySelector('#txtRespuestaPregunta').value.trim());
		const question = await Page.evaluate(() => document.querySelector('#lblPregunta').innerText.toLowerCase());
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
				'antioquia' ? 'medellin' : null
			);
		}
		if (Boolean(response))
			await Page.evaluate((value) => document.querySelector('#txtRespuestaPregunta').value=value, response);
		else {
			await Page.click('#ImageButton1');
			await sleep(2000);
			return ScanTab(...arguments);
		}
		console.log(response);
		console.log(`#############`);
	}
	await Page.evaluate((CC) => {
		document.querySelector('#ddlTipoID').value = 1;
		document.querySelector('#txtNumID').value = CC;
		return document.querySelector('#btnConsultar').click();
	}, CC);
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
	console.log("[Client]: ", Client);
	if (Client)
		await firebase.firestore().collection('CC').doc(`CC_${CC}`).set({
			CC,
			name: Client.slice(0, -2),
			lastname: Client.slice(-2),
		});
	await sleep(10000);
	return ScanTab({
		Tab,
		CC: (CC + 1),
		response
	});
}


module.exports = async function Scrapping(props = {}) {
	const params = process.argv.slice(2).reduce((params, key) => {
		if (!params.step) params.step = key;
		else if (key === '--headless') params.headless = true;
		return params;
	}, {
		step: null,
		headless: false,
	});
	let {
		waitFor = 3000,
		step = params.step,
		Browser = null,
	} = props;
	const min = step > 1 ? (((step - 1) * 100000) + 1) : 10;
	const max = ((step || 1) * 100000);
	let errorMessage = null;
	try {
		Browser = Browser || (await puppeteer.launch({
			headless: params.headless,
			// executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
			// slowMo: 250,
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

		const CC = await firebase.firestore().collection('CC')
			.where('CC', '>=', min)
			.where('CC', '<=', max)
			.orderBy('CC', 'desc').limit(1).get()
			.then(({docs}) => (docs.length ? (docs[0].data().CC + 1) : min));

		const urlPage = "https://www.procuraduria.gov.co/portal/index.jsp?option=co.gov.pgn.portal.frontend.component.pagefactory.AntecedentesComponentPageFactory&action=consultar_antecedentes";
		const Tab = await Browser.newPage();
		console.log(`[Loading Page For: ${CC}]`);
		await Tab.goto(urlPage, { waitUntil: 'load', timeout: 30000 });
			ScanTab({ Tab, CC, max });
	}
	catch (error) {
		errorMessage = error;
		if (Tab) await Tab.close();
	}
	finally {
		if (errorMessage) {
			if (waitFor >= 180000) return Browser && Browser.close();
			console.log(errorMessage);
			await sleep(waitFor *= 2);
			Scrapping({ Browser, step, waitFor, })
		}
	}
};