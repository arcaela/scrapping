const {
	Log,
	sleep,
	getCedula,
	setClient,
	closeConnection,
} = require('./tools');

const Plugins = [
	require('./plugins/cne'),
	require('./plugins/misdatos'),
];

async function Scrapper({ CC, step, length=100000, waitFor=3000, }){
	console.clear();
	step = step ||  process.argv.slice(2)[0] || 1;
	const min = step > 1 ? (((step - 1) * length) + 1) : 10,
		max = ((step || 1) * length);
	let errorMessage=null;
	try {
		CC = CC || await getCedula(min, max);



		closeConnection( "Close For "+CC );
		if(CC > max) closeConnection("Se ha culminado la consulta para estos rangos");
		// const Client = await Plugins[0](CC);
		const Client = await Plugins.sort(()=>Math.random()-0.5)[0](CC);
		if(Client){
			Log('[Saving...] ', Client);
			await setClient(Client);
		}
		return await Scrapper({ step, CC:CC+(Client?1:0), length, waitFor:3000 });
	}
	catch (error) { errorMessage=error; }
	finally {
		if(errorMessage){
			Log(errorMessage);
			if (waitFor >= 180000){
				Log(`Sleep for: 30 minutes`);
				await sleep(1800 * 1000);
				waitFor=3000;
			} else{
				Log(`Sleep for: ${(waitFor *= 2) / 1000} seconds`);
				await sleep(waitFor);
			}
			Log('[Retry Scrapper]');
			return await Scrapper({ CC, step, length, waitFor, });
		}
		else closeConnection("Se ha completado la ejecución del código");
	}
}
module.exports = Scrapper({});