const puppeteer = require('puppeteer');
const userAgent = require('user-agents');
const firebase = require('firebase/app').default;
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
module.exports.Log = (...msg)=>console.log(...msg);
module.exports.LogError = (...msg)=>new Error(...msg);;
module.exports.closeConnection = (...msg)=>{
	// console.clear();
	console.log(...msg);
	process.exit();
}
module.exports.sleep = (time = 1000) => new Promise(resolve => setTimeout(() => resolve(time), time));
module.exports.getCedula = (min, max)=>firebase.firestore().collection('CC').where('CC', '>=', min).where('CC', '<=', max).orderBy('CC','desc').limit(1).get().then(({ docs })=>{
	return !docs.length?min:(docs[0].data().CC+1);
});
module.exports.setClient = (client)=>firebase.firestore().collection('CC').doc(`CC_${client.CC}`).set(client);


module.exports.$Browser = null;
module.exports.useBrowser = async (url)=>{
	if(!this.$Browser){
		this.Log("[Opening Browser...]");
		this.$Browser = await puppeteer.launch({
			// slowMo: 250,
			// executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
			// devtools:true,
			headless:true,
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
	}
	let Tab =  await (await this.$Browser.pages()).find(tab=>tab.url()===url);
	if(!Tab) {
		this.Log("[Going to: ]", url)
		Tab = await this.$Browser.newPage();
		await Tab.goto(url, { waitUntil:'load', timeout:30000 });
	}
	await Tab.bringToFront();
	return { Tab, Browser:this.$Browser };
};
