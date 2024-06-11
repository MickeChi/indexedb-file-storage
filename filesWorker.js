onmessage = function (e) {
	console.log('Worker: Message received from main script: ', e.data);

	const dbName = e.data.dbName;
	const storeName = e.data.storeName;
	const dbVersion = e.data.dbVersion;

	let respuesta = { ...e.data };

	if (e.data.accion === "CARGAR_ARCHIVOS") {
		const request = indexedDB.open(dbName, dbVersion);
		const dataFiles = [];

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

					console.log("openCursor value: ", cursor.value);
					dataFiles.push(cursor.value);
					cursor.continue();

				}
			};

			trans.oncomplete = (evt) => {

				uploadAllFiles(dataFiles)
					.then(responseData => {
						// Send the response data back to the main thread
						console.log("uploadFileToServer success: ", responseData);
						console.log("oncomplete uploadFileToServer: ", dataFiles);
						respuesta = { ...respuesta, message: "Archivos cargados success" }
						postMessage(respuesta);
						//uploadResults.push({fileName: cursor.value['fileName'], upload: true});

					})
					.catch(error => {
						// Handle any errors that occur during the API call
						console.error('uploadFileToServer Error:', error);
						//uploadResults.push({fileName: cursor.value['fileName'], upload: false});
						respuesta = { ...respuesta, message: "Archivos cargados con errores" }
						postMessage(respuesta);

					});

			};

		};

	}

}


const uploadAllFiles = (files) => {
	let promisesFiles = [];

	// Abort if there were no files selected
	if (!files.length) return;

	// Store promises in array
	files.forEach(fileData => {
		promisesFiles.push(uploadFileToServer(fileData));
	});

	return Promise.all(promisesFiles);
};

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
		//http://localhost:8081/api/proyecto/upload
		//https://simple-server-3xmu.onrender.com/api/upload/file
		fetch('http://localhost:8081/api/proyecto/upload', {
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