
//
const app = null;
const db = null;

// Ensure images and pdfs are available as a Buffer in req.body
app.use(express.raw({ contentType: ["image/*", "application/pdf"]}));

function sendError(res, statusCode, code, description) {
    res.status(statusCode).json({
        code: code,
        description: description
    });

}

app.get('/blobs/:blobId', async (req, res) => {
    const blobId = req.params.blobId;
    const row = await db.oneOrNone(
        'select content_type, blob_value from blobs where blob_id = $1',
        [blobId]);
    if (row === null) {
        sendError(res, 404, 'NotFound', 'Blob not found');
    } else {
        res.set('Content-Type', row.content_type);
        res.send(row.blob_value);
    }
});

app.post('/contracts/:contractId/cfdi', async (req, res) => {
    if (!req.is("image/*") && !req.is("application/pdf")) {
        sendError(res, 415, "UnsupportedMediaType", "CFDI tiene formato inválido")
    }
    const contractId = req.params.contractId;
    const contractFile = req.body;
    const contentType = req.get('Content-Type');
    const contract = await db.oneOrNone(
        'select * from contracts where contract_id = $1',
        [contractId]);
    if (contract === null) {
        sendError(res, 404, 'NotFound', 'Contract not found');
        return;
    }
    if (contract.cfdi_id !== null) {
        sendError(res, 400, 'CFDIAlreadyExists', 'El contrato ya tiene CFDI');
    } else {
        const blobId = await db.one(
            "insert into blobs (content_type, content) ($1, $2) returning blob_id",
            [contentType, contractFile],
            r => r.blob_id);
        await db.none(
            'update contracts where contract_id = $1 set cfdi_id = $2',
            [contractId, blobId]);
        res.status(204).end();
    }
});

app.put('/contracts/:contractId/accept', async function (req, res) {
    const contractId = req.params.contractId;
    const affectedRows = await db.result(
        'update contracts where contract_id = $1 set accepted = true',
        [contractId],
        r => r.rowCount);
    if (affectedRows == 0) {
        sendError(res, 404, 'NotFound', 'Contract not found');
    } else {
        res.status(204).end;
    };
});
