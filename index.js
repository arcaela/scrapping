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
const getCedula = (min, max)=>firebase.firestore().collection('CC').where('CC', '>=', min).where('CC', '<=', max).orderBy('CC','desc').limit(1).get().then(({ docs })=>{
	return !docs.length?min:(docs[0].data().CC+1);
});
const Log = (...msg)=>console.log(...msg);
const LogError = (...msg)=>new Error(...msg);;
const closeConnection = (...msg)=>{
	// console.clear();
	console.log(...msg);
	process.exit();
}



async function ScanTab({ CC, Browser, waitFor=3000, Tab, response, error}){
	console.clear();
	if(!Browser || (!Tab && !Browser)) closeConnection("No se recibió el Navegador o Pestaña");
	if(!Tab){
		console.log('[Loading Page...] ');
		const url = "https://www.procuraduria.gov.co/portal/index.jsp?option=co.gov.pgn.portal.frontend.component.pagefactory.AntecedentesComponentPageFactory&action=consultar_antecedentes";
		Tab = await Browser.newPage();
		await Tab.goto(url ,{ waitUntil:'load', timeout:30000 });
	}
	console.log('[Scaning...] ', CC);
	const Page = Tab.url().includes('apps.procuraduria.gov.co') ? Tab :
		(await Tab.frames()).find(frame => frame.url().includes('apps.procuraduria.gov.co'));
	await Page.waitForFunction(()=>{
		const select = document.querySelector('#ddlTipoID')
		if(!select) return false;
		return select.value=1;
	},{timeout: 30000});
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
	if (Client){
		Log(Client);
		await firebase.firestore().collection('CC').doc(`CC_${CC}`).set({
			CC,
			name: Client.slice(0, -2).join(' '),
			lastname: Client.slice(-2).join(' '),
		});
		CC++;
	} else throw LogError("Client not Found");
	await sleep(3000);
	await ScanTab({ Tab, CC, Browser });
}


async function Scrapping({ waitFor = 3000, length = 100000, step = process.argv.slice(2)[0] || 1, }){
	let Browser = null,
		errorMessage = null;
	const min = step > 1 ? (((step - 1) * length) + 1) : 10,
		max = ((step || 1) * length);
	try {
		const CC = await getCedula(min, max);
		if(CC > max){ closeConnection("Se ha culminado la consulta para estos rangos"); };
		await Log("[Open Browser]");
		Browser = await puppeteer.launch({
			// slowMo: 250,
			headless: true,
			// executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
			args: [
				'--disable-infobars',
				'--start-maximized',
				'--no-sandbox',
				'--disable-dev-shm-usage',
				"--disable-web-security",
				'--disable-features=IsolateOrigins,site-per-process',
				'--user-agent="' + (new userAgent()).toString() + '"',
			]
		});
		await ScanTab({ CC, Browser, });
	}
	catch (error) { errorMessage=error; }
	finally {
		if(errorMessage){
			if(Browser) await Browser.close( void Log("[Closing Browser...] \n ", errorMessage) );
			if (waitFor >= 180000){
				Log("[wait for 30 minutes]");
				await sleep(1800 * 1000);
				return Scrapping({ step, length, waitFor:3000});
			}
			await sleep(waitFor *= 2);
			return Scrapping({ step, length, waitFor, });
		}
		else closeConnection("Se ha completado la ejecución del código");
	}
}


module.exports = Scrapping({});