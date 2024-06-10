onmessage = function (e) {
	console.log('Worker: Message received from main script: ', e.data);

	const dbName = e.data.dbName;
	const storeName = e.data.storeName;
	const dbVersion = e.data.dbVersion;
	const uploadResults = [];

	let respuesta = { ...e.data };

	if (e.data.accion === "CARGAR_ARCHIVOS") {
		const request = indexedDB.open(dbName, dbVersion);

		request.onerror = (event) => {
			reject(event.target.error);
		};

		request.onsuccess = (event) => {
			db = event.target['result'];
			let trans = db.transaction(storeName, IDBTransaction.READ_ONLY);
			let store = trans.objectStore(storeName);

			store.openCursor().onsuccess = (event) => {
				const cursor = event.target.result;
				if (cursor) {

					console.log("uploadFileToServer in SW: ", cursor.value);
					uploadFileToServer(cursor.value)
						.then(responseData => {
							// Send the response data back to the main thread
							console.log("uploadFileToServer success: ", responseData);
							//uploadResults.push({fileName: cursor.value['fileName'], upload: true});
							cursor.continue();

						})
						.catch(error => {
							// Handle any errors that occur during the API call
							console.error('uploadFileToServer Error:', error);
							//uploadResults.push({fileName: cursor.value['fileName'], upload: false});

							cursor.continue();

						});

				}
			};

			trans.oncomplete = (evt) => {

				respuesta = { ...respuesta, message: "Archivos cargados", uploadResults }
				postMessage(respuesta);

			};

		};

	}

}

const uploadFileToServer = (datos) => {
	let fileBlob = new Blob([datos.data]);
	let file = new File([fileBlob], datos['fileName'], {
		type: fileBlob.type,
	});


	let formData = new FormData()
	formData.append("file", file);

	// Create a new Promise to encapsulate the asynchronous API call
	return new Promise((resolve, reject) => {
		// Perform the API call using fetch or any other suitable method
		fetch('https://simple-server-3xmu.onrender.com/api/upload/file', {
			method: 'POST',
			body: formData
		})
			.then(response => {
				if (response.ok) {
					// Resolve the Promise with the response data
					resolve(response.json());
				} else {
					// Reject the Promise with an error message
					reject('API call failed with status: ' + response.status);
				}
			})
			.catch(error => {
				// Reject the Promise with any error that occurs during the API call
				reject(error);
			});
	});



}

/*fetch("localhost/Api", {
	  method: 'POST',
	  headers: {
		'Content-Type': 'application/json'
	  },
	  body: JSON.stringify(req),
	}).catch(error => {
	  console.error(error)
	});*/