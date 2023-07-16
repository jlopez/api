
//
const app = null;
const db = null;

function sendError(res, statusCode, code, description) {
    res.status(statusCode).json({
        code: code,
        description: description
    });

}

app.get('/blobs/:blob_id', (req, res) => {
    db.query('select content_type, blob_value from blobs where blob_id = ?',
        [req.params.blob_id],
        (err, data) => {
            if (data.length != 1) {
                sendError(res, 404, 'NotFound', 'Blob not found');
            } else {
                res.contentType(data[0].content_type).send(data[0].blob_value);
            }
    });
});

app.post('/contracts/:contract_id/cfdi', (req, res) => {
    let { contractFile } = req.body;
    db.query('select * from contracts where contract_id = ?',
        [req.params.contract_id],
        (err, data) => {
            if (data[0] != null)
            {
                sendError(res, 400, 'CFDIAlreadyExists', 'El contrato ya tiene CFDI');
            } else {
                db.query("insert into blobs (content_type, content) (?, ?)",
                [req.headers['Content-Type'], contractFile],
                (err, blobData) => {
                    if (err) {
                        sendError(res, 500, 'InternalServerError', 'Could not insert');
                    } else {
                        db.query('update contracts where contract_id = ? set cfdi_id = ?',
                        [req.params.contract_id, blob_id],
                        (err, data) => {
                            if (err) {
                                sendError(res, 500, 'InternalServerError', 'Could not update');
                            } else {
                                res.status(204).end;
                            }
                        })
                    }
                })
            }
    })
});

app.put('/contracts/:contract_id/accept', function (req, res) {
    db.query('update contracts where contract_id = ? set accepted = \'true\'',
        [req.params.contract_id],
        (err, data) => {
            if (err) {
                sendError(res, 500, 'InternalServerError', 'Could not update');
            } else {
                res.status(204).end;
            }
    });
});


    // contract = select * from contracts where contract_id = :contract_id
    // if contract.cfdi is not null then sendError(res, 400, 'CFDIAlreadyExists', 'El contrato ya tiene CFDI')
    // blob_id = insert into blobs (autoincrement(), req.headers['Content-Type'], req.body)
    // update contracts where contract_id = :contract_id set cfdi_id = blob_id
    // res.status(204).end