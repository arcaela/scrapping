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




async function ScanTab({ CC, waitFor=3000, Tab=null, Browser=null, response=null, error=null}){
	console.clear();
	if(!Browser || (!Tab && !Browser)) process.exit(500);
	try {
		if(!Tab){
			console.log('[Loading Page...] ');
			const Tab = await Browser.newPage(),
				url = "https://www.procuraduria.gov.co/portal/index.jsp?option=co.gov.pgn.portal.frontend.component.pagefactory.AntecedentesComponentPageFactory&action=consultar_antecedentes";
			await Tab.goto(url,{ waitUntil:'load', timeout:30000 });
		}
		const Page = Tab.url().includes('apps.procuraduria.gov.co') ? Tab :
			(await Tab.frames()).find(frame => frame.url().includes('apps.procuraduria.gov.co'));

		await Page.waitForFunction(()=>{
			const select = document.querySelector('#ddlTipoID')
			if(!select) return false;
			return select.value=1;
		},{timeout: 30000});
		
		console.log('[Typing...] ', CC);
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
		await sleep(2000);

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
			await firebase.firestore().collection('CC').doc(`CC_${CC}`).set({
				CC,
				name: Client.slice(0, -2),
				lastname: Client.slice(-2),
			});
			CC++;
		}
		await sleep(3000);
		return ScanTab({ Tab, CC: (CC + 1) });
	}
	catch (_error) { error=true; }
	finally {
		if(error){
			if(Tab) await Tab.close();
			if (waitFor >= 180000){
				await sleep(1800 * 1000);
				return ScanTab({ CC, waitFor:3000, Browser,});
			}
			await sleep(waitFor *= 2);
			return ScanTab({ CC, waitFor:3000, Browser,});
		}
		else{
			console.log(error);
			process.exit(200);
		}
	}
}




async function Scrapping({ waitFor = 3000, length = 100000, step = process.argv.slice(2)[0] || 1, }){
	let Browser = null,
		errorMessage = null;
	const max = ((step || 1) * length),
		min = step > 1 ? (((step - 1) * length) + 1) : 10;
	try {
		const CC = await getCedula(min, max);
		if(CC > max) process.exit(200);
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
		return ScanTab({ CC, Browser, });
	}
	catch (error) {
		console.log(error);
	
	}
	finally {
		if(errorMessage){
			if(Browser) await Browser.close();
			if (waitFor >= 180000){
				await sleep(1800 * 1000);
				return Scrapping({ step, length, waitFor:3000});
			}
			await sleep(waitFor *= 2);
			return Scrapping({ step, length, waitFor, });
		}
		else process.exit(200);
	}
}
module.exports = Scrapping({});