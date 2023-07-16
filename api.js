
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

app.get('/blobs/:blobId', (req, res) => {
    db.query('select content_type, blob_value from blobs where blob_id = ?',
        [req.params.blobId],
        (err, data) => {
            if (data.length != 1) {
                sendError(res, 404, 'NotFound', 'Blob not found');
            } else {
                const row = data[0];
                res.set('Content-Type', row.content_type);
                res.send(row.blob_value);
            }
    });
});

app.post('/contracts/:contractId/cfdi', (req, res) => {
    if (!req.is("image/*") && !req.is("application/pdf")) {
        sendError(res, 415, "UnsupportedMediaType", "CFDI tiene formato inválido")
    }
    const contractId = req.params.contractId;
    const contractFile = req.body;
    const contentType = req.get('Content-Type');
    db.query('select * from contracts where contract_id = ?',
        [contractId],
        (err, rows) => {
            if (rows.length != 1) {
                sendError(res, 404, 'NotFound', 'Contract not found');
                return;
            }
            const contract = rows[0];
            if (contract.cfdi_id !== null) {
                sendError(res, 400, 'CFDIAlreadyExists', 'El contrato ya tiene CFDI');
            } else {
                db.query("insert into blobs (content_type, content) (?, ?)",
                [contentType, contractFile],
                (err, results) => {
                    if (err) {
                        sendError(res, 500, 'InternalServerError', 'Could not insert');
                    } else {
                        const blobId = results.insertId;
                        db.query('update contracts where contract_id = ? set cfdi_id = ?',
                            [contractId, blobId],
                            (err) => {
                                if (err) {
                                    sendError(res, 500, 'InternalServerError', 'Could not update');
                                } else {
                                    res.status(204).end;
                                }
                            }
                        )
                    }
                })
            }
        }
    )
});

app.put('/contracts/:contractId/accept', function (req, res) {
    const contractId = req.params.contractId;
    db.query('update contracts where contract_id = ? set accepted = true',
        [contractId],
        (err, result) => {
            if (err) {
                sendError(res, 500, 'InternalServerError', 'Could not update');
            } else if (result.affectedRows == 0) {
                sendError(res, 404, 'NotFound', 'Contract not found');
            } else {
                res.status(204).end;
            }
    });
});
