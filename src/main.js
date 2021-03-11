const fetch = require('node-fetch')
const fs = require('fs');
const download = require('download')
const delay$ = require('delay');
const dateFns = require('date-fns')
const makeDir = require('make-dir');
const axios = require('axios');
const pTimeout = require('p-timeout');

const fetchAsyncJSON = async (url, method = 'get', body = undefined) => {
    const resp = await axios.request({
        url,
        data: body,
        method,
        timeout: 10000
    });
    return resp.data;
}

const fetchAsyncJSON_old = async (url, method = 'get', body = undefined) => {
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body): undefined,
            method
        });
        if (!response.ok) {
            throw new Error(`Error while fetching response.ok == false, url: ${response.url}, status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (e) {
        throw e;
    }
};


/**
 * { fecha: '07/03/2021 23:19:23',
  correcto: true,
  notificacion: 'Transacción satisfactoria',
  datoAdicional:
   { nombreArchivo: 'ESN2021_CH_20210307_231138_4861445904635051813.csv',
     tipoArchivo: 'CSV',
     hash: '2393501af35ec27dadd8ebfe5a054524',
     archivo:
      'https://s3.amazonaws.com/sn-archivo-computo/exportacion/ESN2021_CH_20210307_231138_4861445904635051813.csv',
     fecha: '07/03/2021 11:11:39' } }

 * @returns {Promise<void>}
 */
async function getFileMetadata(idDepartamento, tipoArchivo) {
    const body = {idDepartamento, tipoArchivo}
    return await fetchAsyncJSON('https://computo.oep.org.bo/api/v1/descargar', 'post', body)
}

const deptos = ['Chuquisaca', 'La Paz', 'Cochabamba', 'Oruro', 'Potosí', 'Tarija', 'Santa Cruz', 'Beni', 'Pando']
// const rootDirPath = './files'
const rootDirPath = '/Users/evillegas-macbook/Google Drive/elecciones2021/elecciones-2021-1a-vuelta/archivos-computo-2021-1a-vuelta';


function getStrTimestamp(date) {
    return dateFns.format(date || new Date(), 'YYYY-MM-DD HH:mm:ss');
}

function log(message) {
    const logPath = `${rootDirPath}/log.txt`;
    const strTimestamp = getStrTimestamp();
    const text = `[${strTimestamp}] ${message}`;
    console.log(text);
    try {
        fs.appendFileSync(logPath, `${text}\n`);
    } catch(exc) {}
}

async function downloadFile$(fileMetadata, idDepto) {
    // console.log('FileMetadata: ', fileMetadata)
    const da = fileMetadata.datoAdicional;
    const fileName = da.nombreArchivo;
    const dirPath = `${rootDirPath}/${deptos[idDepto-1]}`;
    if(fs.existsSync(`${dirPath}/${fileName}`)) {
        console.log(`File ${fileName} already exists, skipping`)
        return;
    }
    // console.log('Creando directorios...')
    await Promise.all(deptos.map(depto => makeDir(`${rootDirPath}/${depto}`)));
    try {
        // console.log('Appending to files...')
        fs.appendFileSync(`${dirPath}/${fileName}-meta.json`, JSON.stringify(fileMetadata, null, 2));
        fs.appendFileSync(`${dirPath}/archivos-${da.tipoArchivo}.csv`, `${getStrTimestamp()},${da.fecha},${da.nombreArchivo},${da.hash},${da.archivo}\n`);
        // console.log('A punto de descargar ', da.nombreArchivo);
        await pTimeout(download(da.archivo, dirPath, { timeout: 10000 }), 11000);
        // const latestFilename = `_ultimo-${deptos[idDepto-1]}.` + da.archivo.split('.').reverse()[0];
        // await pTimeout(download(da.archivo, dirPath, { timeout: 10000, filename: latestFilename }), 11000);
        log(`Descargado ${da.nombreArchivo}`)
    } catch (exc) {
        log(`Descarga fallida ${da.nombreArchivo} (${exc.message})`)
    }

}

async function main() {
    while(1) {
        for(let idDepto = 1; idDepto <= 9; idDepto++) {
            for(const tipoArchivo of ['CSV', 'EXCEL']) {
                try {
                    // console.log('A punto de obtener metadata ', tipoArchivo, deptos[idDepto-1])
                    const fileMetadata = await getFileMetadata(idDepto, tipoArchivo);
                    await downloadFile$(fileMetadata, idDepto)
                } catch(exc) {
                    log(`Descarga fallida para archivo ${tipoArchivo} de ${deptos[idDepto-1]}. (${exc.message})`)
                }

            }
        }
        const minutosPeriodo = 5;
        console.log(`[${getStrTimestamp()}] Esperando ${minutosPeriodo} minuto(s)...`)
        await delay$(minutosPeriodo * 1000 * 60)
    }
}

module.exports = main;