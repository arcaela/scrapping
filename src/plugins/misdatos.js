const { Log, useBrowser, } = require('../tools');
module.exports = async function MisDatos(CC){
	Log(`[MisDatosFunction for #${CC}]`);
	const url = "https://api.misdatos.com.co/app/register";
	let { Tab, Browser } = await useBrowser(url);
	if(!Browser || !Tab) return await MisDatos(CC);
    const Page = Tab;
    Log('[Wait for frame]');
    await Page.evaluate(()=>{
        document.querySelectorAll('body > *').forEach(el=>{
            if(!el.matches('script') || !el.src.includes('helpers.js'))
                el.remove();
        });
    });
	Log('[Find Client]');
    return await Page.evaluate((cedula)=>{
        return new Promise((send)=>{
            $.ajax({
                type:'POST',
                url:'/app/names',
                dataType: "json",
                contentType: "application/x-www-form-urlencoded",
                data:{ documentType:'CC', documentNumber:cedula.toString(), },
                success:({ data })=>send((!data.names||!data.names.length)?null:data.names.split(' ')),
                error:()=>send(null),
            });
        })
        .then(client=>(!client?null:{
            CC:cedula,
            name: client.slice(0, -2).join(' '),
            lastname: client.slice(-2).join(' '),
        }))
        .catch(()=>null)
    },CC);
}