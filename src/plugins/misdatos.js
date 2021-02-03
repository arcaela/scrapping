const { Log, useBrowser, } = require('../tools');
module.exports = async function MisDatos(CC){
	Log(`[MisDatosFunction for #${CC}]`);
	const url = "https://api.misdatos.com.co/app/register";
	let { Tab, Browser } = await useBrowser(url);
	if(!Browser || !Tab) return await MisDatos(CC);
    const Page = Tab;
    await Page.evaluate(()=>{
        await document.querySelectorAll('body > *').forEach(el=>{
            if(!el.matches('script') || !el.src.includes('helpers.js'))
                el.remove();
        });
    });
    Log('[Scaning...] ');
    const Client = await Page.evaluate((cedula)=>{
        return new Promise((send, error)=>{
            $.ajax({
                type:'POST',
                url:'/app/names',
                dataType: "json",
                contentType: "application/x-www-form-urlencoded",
                data:{
                    documentType:'CC',
                    documentNumber:cedula.toString(),
                },
                success:({ data })=>send(data.names.split(' ')),
                error:()=>send(null),
            });
        });
    },CC);
    return !Client?null:{
		CC,
		name: Client.slice(0, -2).join(' '),
		lastname: Client.slice(-2).join(' '),
	};
}