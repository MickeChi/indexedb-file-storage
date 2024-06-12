onmessage = function (e) {
	console.log('Worker: Message received from main script: ', e.data);

	const dbName = e.data.dbName;
	const storeName = e.data.storeName;
	const dbVersion = e.data.dbVersion;

	let resultados = { ...e.data };

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

				console.log("oncomplete files to upload: ", dataFiles);

				uploadAllFiles(dataFiles)
					.then(responseData => {
						// Send the response data back to the main thread
						console.log("uploadFileToServer success: ", responseData);
						resultados = { ...resultados, message: "Archivos cargados success", uploadResults: Array.from(responseData)};						
						deleteAllEntriesFromIndexedDb(storeName, db, resultados);
						
					})
					.catch(error => {
						// Handle any errors that occur during the API call
						console.error('uploadFileToServer Error:', error);
						resultados = { ...resultados, message: "Archivos cargados con errores", uploadResults:[] }
						deleteAllEntriesFromIndexedDb(storeName, db, resultados);

					});

			};

		};

	}

}

const deleteAllEntriesFromIndexedDb = (storeName, db, resultados) => {
	const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
	store.clear();
	store.transaction.oncomplete = () => {
		postMessage(resultados);
	};
};

const deleteEntriesFromIndexedDb = (storeName, db, resultados) => {


	const store = db.transaction(storeName, 'readwrite').objectStore(storeName);


	resultados.uploadResults.forEach(item => {
		if(item.mensaje === "SUCCESS"){
			store.delete(item.proyectoFile.id);
		}
	});

	store.transaction.oncomplete = async () => {
		console.log("Se han eliminado los registros existosos");
		postMessage(resultados);
	};
};


const uploadAllFiles = (files) => {
	let promisesFiles = [];

	// Abort if there were no files selected
	if (!files.length) return;

	// Store promises in array
	files.forEach(fileInfo => {
		promisesFiles.push(uploadFileToServer(fileInfo).catch(error => error));
	});

	return Promise.all(promisesFiles);
};

const uploadFileToServer = (fileInfo) => {
	let fileBlob = new Blob([fileInfo.fileData]);
	let file = new File([fileBlob], fileInfo.fileName, {
		type: fileBlob.type,
	});

	let proyectoFile = {...fileInfo};
    delete proyectoFile.fileData;

	let formData = new FormData()
	formData.append("file", file);
	formData.append("proyectoFile", JSON.stringify(proyectoFile));

	return new Promise((resolve, reject) => {

		//Simulando error en request
		/*if(fileInfo.id === 3){
			reject({mensaje: "ERROR", estatus: 500, resultado: null, proyectoFile});
		}*/

		//http://localhost:8081/api/proyecto/upload
		//https://simple-server-3xmu.onrender.com/api/upload/file
		fetch('http://localhost:8081/api/proyecto/upload', {
			method: 'POST',
			body: formData
		})
			.then(response => {
				console.log("response: ", response, proyectoFile);
				if (response.ok) {

					response.json().then(resp => {
						resolve({mensaje: "SUCCESS", estatus: response.status, resultado: resp, proyectoFile});
					});
					
				} else {
					response.json().then(resp => {
						reject({mensaje: "ERROR", estatus: response.status, resultado: resp, proyectoFile});
					});
				}
			})
			.catch(error => {
				// Reject the Promise with any error that occurs during the API call
				reject({mensaje: "ERROR", estatus: error.status, resultado: error, proyectoFile});
			});
	});



}