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
module.exports.saveClient = (client)=>firebase.firestore().collection('CC').doc(`CC_${client.CC}`).set(client);
