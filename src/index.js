const { Log, sleep, getCedula, closeConnection, setClient, } = require('./tools');
const Plugins = [
	require('./plugins/cne'),
	require('./plugins/misdatos'),
];
async function Scrapper({ CC, step, length=100000, pluginIndex=0, waitFor=3000, }){
	console.clear();
	step = step ||  process.argv.slice(2)[0] || 1;
	const min = step > 1 ? (((step - 1) * length) + 1) : 10,
		max = ((step || 1) * length);
	let errorMessage=null;
	try {
		CC = CC || await getCedula(min, max);
		if(CC > max) closeConnection("Se ha culminado la consulta para estos rangos");
		const Client = await Plugins[pluginIndex](CC);
		if(Client){
			Log("[Saving...]: ", Client);
			await setClient({ CC, name: Client.slice(0, -2).join(' '), lastname: Client.slice(-2).join(' '), });
			CC++;
		}
		return await Scrapper({ CC, step, length, pluginIndex });
	}
	catch (error) { errorMessage=error; }
	finally {
		if(errorMessage){
			Log(errorMessage);
			waitFor = waitFor>=180000?180000:waitFor;
			Log(`Sleep for: ${waitFor/1000} seconds`);
			await sleep(waitFor);
			Log('[Retry Scrapper]');
			return await Scrapper({
				CC,
				step,
				length,
				pluginIndex:pluginIndex==0?1:0,
				waitFor:waitFor<180000?waitFor:3000,
			});
		}
		else closeConnection("Se ha completado la ejecución del código");
	}
}
module.exports = Scrapper({});