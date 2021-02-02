const {
	Log,
	sleep,
	getCedula,
	saveClient,
	closeConnection,
} = require('./tools');

const Plugins = {
	cne:require('./plugins/cne'),
	misdatos:require('./plugins/misdatos'),
};




async function Scrapping({ step, plugin, CC, length=100000, waitFor=3000, }){
	step = step ||  process.argv.slice(2)[0] || 1;
	plugin = !plugin?'cne':plugin;
	const min = step > 1 ? (((step - 1) * length) + 1) : 10,
		max = ((step || 1) * length);
	let errorMessage=null;
	try {
		CC = CC || await getCedula(min, max);
		if(CC > max) closeConnection("Se ha culminado la consulta para estos rangos");
		const Client = await Plugins[plugin](CC);
		if(Client) await saveClient(Client);
		await Scrapping({ step, plugin, CC:(Client?CC+1:CC), length, waitFor });
	}
	catch (error) { errorMessage=error; }
	finally {
		if(errorMessage){
			if (waitFor >= 180000){
				Log("[wait for 30 minutes]");
				await sleep(1800 * 1000);
				waitFor=3000;
			} else await sleep(waitFor *= 2);
			await Scrapping({ step, plugin, length, waitFor, });
		}
		else closeConnection("Se ha completado la ejecución del código");
	}
}


module.exports = Scrapping({});