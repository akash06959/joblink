const fs = require('fs');
const pdfLibrary = require('pdf-parse');
const path = require('path');

const pdfPath = path.join(__dirname, '../docs/test cases main project review 2.pdf');
const dataBuffer = fs.readFileSync(pdfPath);

(async () => {
    try {
        let PDFParseClient;
        if (typeof pdfLibrary === 'function') {
            const data = await pdfLibrary(dataBuffer);
            console.log("START_PDF_CONTENT");
            console.log(data.text);
            console.log("END_PDF_CONTENT");
            return;
        } else if (pdfLibrary.PDFParse) {
            PDFParseClient = pdfLibrary.PDFParse;
        } else if (pdfLibrary.default && pdfLibrary.default.PDFParse) {
            PDFParseClient = pdfLibrary.default.PDFParse;
        } else {
            PDFParseClient = pdfLibrary;
        }

        const parser = new PDFParseClient({ data: dataBuffer });
        const result = await parser.getText();

        console.log("START_PDF_CONTENT");
        console.log(result.text || result);
        console.log("END_PDF_CONTENT");
    } catch (e) {
        console.error("Error:", e);
    }
})();
