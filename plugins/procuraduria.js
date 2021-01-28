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
		return this.collection.doc(`CC_${CC}`)
		.set({
			CC,
			name:Array.isArray(names)?names.slice(0, -2).join(' '):'error',
			lastname:Array.isArray(names)?names.slice(-2).join(' '):'error',
		}).then(()=>console.log('[ADDED]', CC))
	},
};


async function ScanTab({ Tab, ranges:[min,max], CC, response}){
	console.clear();
	console.log(`[${CC?'Scaneando':'Iniciando'}]`, CC?`: ${CC}`:'');
	try {
		const Page = Tab.url().includes('apps.procuraduria.gov.co')?Tab
		: (await Tab.frames()).find(frame=>frame.url().includes('apps.procuraduria.gov.co'));

		await Page.waitForFunction(()=>{
			let c = document.querySelector('#ddlTipoID');
			return !!(c && (c.value=1));
		}, {timeout:60000});

		if(!response){
			console.log(`[Solving Captcha]`);
			response = await Page.evaluate(()=>document.querySelector('#txtRespuestaPregunta').value.trim());
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

		if(!CC){
			CC = await Cedula.getCurrent([min, max]);
			if(!CC) return ScanTab(...arguments);
		}

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
		}, {timeout:20000});
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
		Cedula.add(CC, Client);
		await sleep(300);
        ScanTab({Tab, ranges:[min, max], CC:(CC+1), response});
	} catch (error) {
		console.clear();
		console.log(error);
		await sleep(3000);
		console.clear();
		return ScanTab(...arguments);
    }
}

module.exports = async function Procuraduria(start=0){
	const urlPage = ([
		"https://www.procuraduria.gov.co/portal/index.jsp?option=co.gov.pgn.portal.frontend.component.pagefactory.AntecedentesComponentPageFactory&action=consultar_antecedentes",
		"https://apps.procuraduria.gov.co/webcert/Certificado.aspx?t=dAylAkFT/gSkkvpDoI89aORiq2C8LI3z9uHAnBFaF08/32nPrGQhH4HhIkyJHgMD30HMssetl++9IEpDNKzjND4pdXe1O32FMNcfM+GGb6NipvVlkwZR+ZjqHUuiB4weW8T9vSbEQL83gQVd8FjpjcqL5XBvjk89PEX8tf3eHevJgIDWDAm6iWRPb4HhiOqcXmsk2ZIc7yC+GyawwedNX5gP8L9zSe+C&tpo=1",
	]).sort(()=>Math.random() - 0.5)[0];
    const params = process.argv.slice(2);
    const step = (params[0]-1) || start || 0;
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
	try {
		console.log("[Loading Page]");
		console.log(Tab.url());
		await Tab.goto(urlPage, {waitUntil:'load', timeout:80000});
		ScanTab({ Tab, ranges, });
	} catch (error) {
		await Browser.close();
		return Procuraduria(start);
	}
};