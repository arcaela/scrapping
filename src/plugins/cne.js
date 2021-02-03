const { Log, useBrowser, } = require('../tools');
module.exports = async function CNE(CC){
	Log(`[cneFunction for #${CC}]`);
	const url = "https://www.procuraduria.gov.co/portal/index.jsp?option=co.gov.pgn.portal.frontend.component.pagefactory.AntecedentesComponentPageFactory&action=consultar_antecedentes";
	const { Tab, } = await useBrowser(url);
	if(!Tab){
		Log('[Tab undefined]');
		return await CNE(CC);
	}
	Log('[Wait for frame]');
	const Page = (await Tab.frames()).find(frame => frame.url().includes('apps.procuraduria.gov.co'));
	Log('[Find Client]');
	return await Page.evaluate(async (CC)=>{
		return await fetch("https://apps.procuraduria.gov.co/webcert/Certificado.aspx?t=dAylAkFT%2fgSkkvpDoI89aORiq2C8LI3z9uHAnBFaF08%2f32nPrGQhH4HhIkyJHgMD30HMssetl+9PJ%2fyzlIxsGulvW%2fnaIvG4+zaUOoCBXX9ipvVlkwZR+ZjqHUuiB4weW8T9vSbEQL83gQVd8FjpjcqL5XBvjk89PEX8tf3eHevJgIDWDAm6iWRPb4HhiOqcXmsk2ZIc7yC+GyawwedNX5gP8L9zSe+C&tpo=1",{
			method: 'POST',
			headers: new Headers({
				"Accept-Language": "es-US,es-419;q=0.9,es;q=0.8,en;q=0.7",
				"Cache-Control": "no-cache",
				"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
				"Cookie": "_ga=GA1.3.22455983.1611767288; cookiesession1=678A3E0FHIKLMQRSTUVWXYZABCDF3561; _gid=GA1.3.356336496.1612288580; ASP.NET_SessionId=joprbfpofoihurore1lmey5n",
				"Origin": "https://apps.procuraduria.gov.co",
				"Pragma": "no-cache",
				"Referer": "https://apps.procuraduria.gov.co/webcert/Certificado.aspx?t=dAylAkFT/gSkkvpDoI89aORiq2C8LI3z9uHAnBFaF08/32nPrGQhH4HhIkyJHgMD30HMssetl+9PJ/yzlIxsGulvW/naIvG4+zaUOoCBXX9ipvVlkwZR+ZjqHUuiB4weW8T9vSbEQL83gQVd8FjpjcqL5XBvjk89PEX8tf3eHevJgIDWDAm6iWRPb4HhiOqcXmsk2ZIc7yC+GyawwedNX5gP8L9zSe+C&tpo=1",
				"sec-ch-ua": "\"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"",
				"sec-ch-ua-mobile": "?0",
				"Sec-Fetch-Mode": "cors",
				"Sec-Fetch-Site": "same-origin",
				"Sec-Fetch-Dest": "empty",
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.146 Safari/537.36",
				"X-MicrosoftAjax": "Delta=true",
				"X-Requested-With": "XMLHttpRequest",
			}),
			body: new URLSearchParams({
				"ctl05": "UpdatePanel1|btnConsultar",
				"ddlTipoID": "1",
				"txtNumID": CC,
				"txtRespuestaPregunta": "8",
				"txtEmail": "",
				"__EVENTTARGET": "",
				"__EVENTARGUMENT": "",
				"__VIEWSTATE": "/wEPDwUKLTE2NTg5ODU2Mg8WAh4KSWRQcmVndW50YQUCMTUWAgIDD2QWAgIDD2QWAmYPZBYMAgMPDxYCHgRUZXh0BRhDb25zdWx0YSBkZSBhbnRlY2VkZW50ZXNkZAIPDxYCHgdWaXNpYmxlaBYEAgEPEGRkFgFmZAIFD2QWAgIBDxBkZBYAZAIRDw8WAh8BBRTCvyBDdWFudG8gZXMgNSArIDMgP2RkAh0PDxYCHwJoZGQCJQ8PFgIfAQVMRmVjaGEgZGUgY29uc3VsdGE6IG1pw6lyY29sZXMsIGZlYnJlcm8gMDMsIDIwMjEgLSBIb3JhIGRlIGNvbnN1bHRhOiAxMjo0MTo0MGRkAikPDxYCHwEFB1YuMS4wLjFkZBgBBR5fX0NvbnRyb2xzUmVxdWlyZVBvc3RCYWNrS2V5X18WAQUMSW1hZ2VCdXR0b24xdDdSkGjRczbVFppTvT6UQ6630TtEYwP84XRbuen4fsI=",
				"__VIEWSTATEGENERATOR": "538A70A7",
				"__EVENTVALIDATION": "/wEdAAsPz0OOqocixfhUM/b8BF7++MfFIckWHtJo8mcJHXtf60jMm4Eun6Ch+sGQBFL6DWEkVe6Wdt5JQpNNO+rp7bXczd+4Rz0at1FkmyS31yoYKSTchSJOOjCJdHuiUEbQK6r2ZpHOBKWi14/6dT/aqDM96ZACrx5RZnllKSerU+IuKjGhJH0i4NdHQmmgFFeoootDB2YfWbjwUYntrwPx36EShAqw/I3OcaUSOxgiPcO/KxeFLY5xG70ok+hEK3AYFTnpLmMnzJH+/pytKAazpBa/",
				"__ASYNCPOST": "true",
				"btnConsultar": "Consultar",
			}),
			redirect: 'follow'
		})
		.then(response => response.text())
		.then(result => {
			const DIV = document.createElement('div');
			DIV.innerHTML = result.replace(/\r?\n|\r|\s+/g,"")
				.replace(/.*Señor\(a\)(.*)identificado\(a\).*mero(\d+).*/gi,"$1 <span>$2</span>");
			const spans = [...DIV.querySelectorAll('span')];
			const cedula = spans.slice(-1)[0].innerText;
			return (parseInt(cedula)!==parseInt(CC))?null
				:spans.slice(0, -1).map(e=>e.innerText);
		}).catch(()=>null);
	}, CC);
}