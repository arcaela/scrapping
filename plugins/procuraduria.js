const puppeteer = require('puppeteer');
const firebase = require('firebase/app').default;
const userAgent = require('user-agents');
require('firebase/firestore');
const sleep = (time=1000)=>new Promise(r=>setTimeout(()=>r(time), time));
firebase.initializeApp({
    apiKey: "AIzaSyBntYCJH39TRORGUSYpYHHrcg4Etk8Y208",
    authDomain: "dimelo-vip-col.firebaseapp.com",
    databaseURL: "https://dimelo-vip-col-default-rtdb.firebaseio.com",
    projectId: "dimelo-vip-col",
    storageBucket: "dimelo-vip-col.appspot.com",
    messagingSenderId: "909520655494",
    appId: "1:909520655494:web:f1f178d8e564789ea22d07"
});

const Cedula = {
	collection:firebase.firestore().collection('CC'),
	async getCurrent([min, max]){
		const snap = await this.collection
			.where('CC' , '>=', min)
			.where('CC' , '<=', max)
			.orderBy('CC', 'desc')
			.limit(1).get();
		const { CC } = snap.docs.length?snap.docs[0].data():{CC:null};
		return CC?(CC===min?CC+1:(CC<max?CC:null)):min;
	},
	async add(CC, names){
		const doc = this.collection.doc(`CC_${CC}`);
		return await doc.set({
			CC,
			name:Array.isArray(names)?names.slice(0, -2).join(' '):'error',
			lastname:Array.isArray(names)?names.slice(-2).join(' '):'error',
		});
	},
};

async function ScanTab(Tab, [min, max], CC=null){
	console.clear();
	console.log(`[Scaneando] [${min} - ${max}]`);
	try {
		const Page = (await Tab.frames()).find(frame=>frame.url().includes('apps.procuraduria.gov.co'));
		await Page.waitForSelector('#ddlTipoID', {timeout:60000});
		await Page.select('#ddlTipoID', "1");

		console.log(`[Solving Captcha]`);
		let response = await Page.evaluate(()=>document.querySelector('#txtRespuestaPregunta').value.trim());
		if(!response){
			const question = await Page.evaluate(()=>document.querySelector('#lblPregunta').innerText.toLowerCase());
		    console.log(`[Question]: `, question);
            if(question.match(/cuanto es \d+ [\-\+\*\x\+] \d+/gi))
				response = eval(question.replace(/^.*(\d+.*\d+).*$/gi,"$1").replace("x","*"));
			else if(question.match("es la capital de valle del cauca"))
				response = "cali";
			else if(question.match("capital del atlantico"))
				response = "barranquilla";
			else if(question.match("es la capital de ")){
				const city = question.replace(/^.*Capital de (\w+).*$/gi,"$1").toLowerCase()
				response = city==='colombia'?'bogota':(
					'antioquia'?'medellin':null
				);
			}
			if(Boolean(response))
				await Page.evaluate((value)=>document.querySelector('#txtRespuestaPregunta').value=value, response);
			else {
				await Page.click('#ImageButton1');
				await sleep(2000);
				return ScanTab(...arguments);
			}
			console.log(response);
			console.log(`#############################`);
		}

		CC = CC || await Cedula.getCurrent([min, max]);
		if(!CC) return ScanTab(...arguments);
			console.log(`[CEDULA]: `, CC);

		console.log("[Typing CEDULA]");
		await Page.evaluate((CC)=>{
			document.querySelector('#txtNumID').value = CC;
			return document.querySelector('#btnConsultar').click();
		}, CC);
		
		console.log("[Waiting Response]");
		await Page.waitForFunction(()=>{
			const cc = document.querySelector('#txtNumID').value;
			const data = document.querySelector('.datosConsultado');
			const error = document.querySelector('#ValidationSummary1');
			return (data && data.innerText.match(`mero ${cc}.`)) || (error && error.innerText);
		}, {timeout:3600000});

		console.log("[Getting Data]");
		const Client = await Page.evaluate(()=>{
			const names = [];
			const cc = document.querySelector('#txtNumID').value;
			const data = document.querySelector('.datosConsultado');
			const error = document.querySelector('#ValidationSummary1');
			if(((data || {}).innerText || 'ALEJANDRO').match(`mero ${cc}.`))
				data.querySelectorAll('span').forEach(span=>names.push(span.innerText))
			return names.length?names:(error?error.innerText:'error');
		});

		console.log("[Client]: ", Client);
		await Cedula.add(CC, Client);
		
		console.log("[Retry]");
        ScanTab(Tab, [min, max], (CC+1));
	} catch (error) {
		console.clear();
		console.log(error);
		await sleep(3000);
		console.clear();
		return ScanTab(...arguments);
    }
}






module.exports = async function Procuraduria(){
	const urlPage = "https://www.procuraduria.gov.co/portal/index.jsp?option=co.gov.pgn.portal.frontend.component.pagefactory.AntecedentesComponentPageFactory&action=consultar_antecedentes";
    
    const params = process.argv.slice(2);
    const step = (params[0]-1) || 0;
    const max = 100000;
    const ranges = [ step===0?10:(step*max)+1, (step+1)*max, ];
    
    console.log("[Launch Browser]");
    const Browser = await puppeteer.launch({
        headless: true,
        //executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
        slowMo: 250,
        args: [
            '--disable-infobars',
            '--start-maximized',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            "--disable-web-security",
            '--disable-features=IsolateOrigins,site-per-process',
            '--user-agent="'+(new userAgent()).toString()+'"',
        ]
    });
	const Tab = await Browser.newPage();
	console.log("[Loading Page]");
	await Tab.goto(urlPage, {waitUntil:'load', timeout:80000});
	ScanTab(Tab, ranges);
};