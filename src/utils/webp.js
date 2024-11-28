const env = require("../env/env")
const fs = require('fs');

function unpack(packedWebpFile) 
{
    console.log(`Unpacking file: ${packedWebpFile}`);

    const data = fs.readFileSync(packedWebpFile);

    let startTxtIndex = data.indexOf(env.EXTR_HEADER);

    if (startTxtIndex !== -1) 
    {
        startTxtIndex += 4;
        let textData = data.subarray(startTxtIndex + 4);

        if (textData[textData.length - 1] !== 0) 
        {
            textData = textData.toString('utf-8');
        } 
        else 
        {
            textData = textData.subarray(0, -1).toString('utf-8');
        }

        fs.writeFileSync(packedWebpFile.slice(0, -env.FULL_EXTENSION_SLUG.length) + env.TXT_EXTENSION_SLUG, textData, { encoding: 'utf-8' });

        const numBytes = data.subarray(8, startTxtIndex - 4).length;
        const numBytesBuffer = Buffer.alloc(4);
        numBytesBuffer.writeUInt32LE(numBytes);
        const new_data = Buffer.concat([data.subarray(0, 4), numBytesBuffer, data.subarray(8, startTxtIndex - 4)]);

        fs.unlinkSync(packedWebpFile);

        fs.writeFileSync(packedWebpFile.slice(0, -env.FULL_EXTENSION_SLUG.length) + env.WEBP_EXTENSION_SLUG, new_data);
        //console.log(`Unpacked file: ${packedWebpFile} ${startTxtIndex}`);
    } 
    else 
    {
        console.log(`Continue, file without extr: ${packedWebpFile} ${startTxtIndex}`);
    }
}

function pack(unpackedWebpFile, unpackedTxtFile) {
    console.log(`Packing file: ${unpackedWebpFile}`);
    const data = fs.readFileSync(unpackedWebpFile);
    const textData = fs.readFileSync(unpackedTxtFile, 'utf-8').trim();  // Trimming the text data to remove any extra spaces or newlines

    const extrLen = Buffer.alloc(4);
    extrLen.writeUInt32LE(textData.length);
    const extr = Buffer.concat([env.EXTR_HEADER, extrLen, Buffer.from(textData, 'utf-8')]);

    let webpDataWithExtrData;
    if (textData.length % 2 === 0) {
        webpDataWithExtrData = Buffer.concat([data.subarray(8), extr]);
    } else {
        webpDataWithExtrData = Buffer.concat([data.subarray(8), extr, Buffer.from([0])]);
    }

    const webpDataWithExtrDataLen = Buffer.alloc(4);
    webpDataWithExtrDataLen.writeUInt32LE(webpDataWithExtrData.length);

    // Verify the sections of the buffer before concatenation
    console.log(`WEBP data length: ${data.length}`);
    console.log(`Extr data length: ${extr.length}`);
    console.log(`Packed data length: ${webpDataWithExtrData.length}`);

    const newBuffer = Buffer.concat([data.subarray(0, 4), webpDataWithExtrDataLen, webpDataWithExtrData]);

    fs.unlinkSync(unpackedWebpFile);
    fs.unlinkSync(unpackedTxtFile);

    fs.writeFileSync(unpackedWebpFile.slice(0, -env.WEBP_EXTENSION_SLUG.length) + env.FULL_EXTENSION_SLUG, newBuffer);
}


module.exports = 
{
    pack,
    unpack
}