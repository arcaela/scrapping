const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp({
	apiKey: "AIzaSyBntYCJH39TRORGUSYpYHHrcg4Etk8Y208",
	authDomain: "dimelo-vip-col.firebaseapp.com",
	databaseURL: "https://dimelo-vip-col-default-rtdb.firebaseio.com",
	projectId: "dimelo-vip-col",
	storageBucket: "dimelo-vip-col.appspot.com",
	messagingSenderId: "909520655494",
	appId: "1:909520655494:web:f1f178d8e564789ea22d07"
});
const Firestore = admin.firestore();
const SystemWatcher = Firestore.collection('SystemWatcher');
const Logs = { cc:SystemWatcher.doc('table-cc'), };


module.exports = {
    Logs,
    admin,
    functions,
    Firestore,
    SystemWatcher,
};