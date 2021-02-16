const { Log, sleep, } = require('./tools');
const Plugins = [
	require('./plugins/cne'),
	require('./plugins/misdatos'),
];
module.exports = async function Scrapper({ cedula, plugin=0, waitFor=3000, }){
	console.clear();
	let errorMessage=null;
	try {
		const client = await Plugins[0](cedula);
		if(client){
			Log('[Found: ] ', client);
			return client;
		}
		else return await Scrapper({ cedula, plugin:(plugin>0?0:1), waitFor:3000 });
	}
	catch (error) { errorMessage=error; }
	finally {
		if(errorMessage){
			Log(errorMessage);
			if (plugin>=1) return null;
			else {
				Log(`Sleep for: ${(waitFor *= 2) / 1000} seconds`);
				await sleep(waitFor);
			}
			return await Scrapper({ CC, step, length, waitFor, });
		}
	}
}