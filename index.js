'use strict';
const dbName = 'my-db';
const storeName = 'localFiles';
const storeKey = 'fileName';
const dbVersion = 1;
let db = null;

// IndexedDB Methods
const initIndexedDb = (dbName, stores) => {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName, dbVersion);
		request.onerror = (event) => {
			reject(event.target.error);
		};
		request.onsuccess = (event) => {
			resolve(event.target.result);
		};
		request.onupgradeneeded = (event) => {
			stores.forEach((store) => {
				const objectStore = event.target.result.createObjectStore(store.name, {
					keyPath: store.keyPath,
				});
				objectStore.createIndex(store.keyPath, store.keyPath, { unique: true });
			});
		};
	});
};

const clearEntriesFromIndexedDb = () => {
	const store = db.transaction(storeName, 'readwrite').objectStore(storeName);

	store.clear();
	clearGalleryImages();

	store.transaction.oncomplete = () => {
		renderStorageQuotaInfo();
	};
};

const deleteImageFromIndexedDb = (storeKey) => {
	const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
	store.delete(storeKey);
	store.transaction.oncomplete = async () => {
		clearGalleryImages();
		renderAvailableImagesFromDb();
		await renderStorageQuotaInfo();
	};
};

const renderAvailableImagesFromDb = () => {
	db.transaction(storeName, 'readonly').objectStore(storeName).openCursor().onsuccess = (event) => {
		const cursor = event.target.result;
		if (cursor) {
			renderGalleryColumn(cursor);
			cursor.continue();
		}
	};
};

const handleSearch = async (ev) => {
	ev.preventDefault();
	clearGalleryImages();
	const searchInput = document.getElementById('search').value;
	db.transaction(storeName, 'readonly').objectStore(storeName).openCursor().onsuccess = (event) => {
		const cursor = event.target.result;
		if (cursor) {
			if (cursor.value[storeKey].toLowerCase().includes(searchInput.toLowerCase())) {
				renderGalleryColumn(cursor);
			}
			cursor.continue();
		}
	};
};

// Form functions

/**
 * @desc Gets the file from the input field and adds it to the IndexedDB
 * @param {Event} ev
 * @returns {Promise<void>}
 */
const handleSubmit = async (ev) => {
	ev.preventDefault();

	//const file = await getFileFromInput();

	getFileFromInputV2().then((files) => {

		const store = db.transaction(storeName, 'readwrite').objectStore(storeName);

		files.forEach(file => {
			console.log("file: ", file);
			store.add(file);
		});

		store.transaction.oncomplete = () => {
			clearGalleryImages();
			renderAvailableImagesFromDb();
			renderStorageQuotaInfo();

			uploadFilesWorker();

		};

	});
};

/**
 * @desc Gets the file from the input field
 * @returns {Promise<object>}
 */
const getFileFromInput = () => {
	return new Promise((resolve, reject) => {
		const file = document.getElementById('file').files[0];
		const reader = new FileReader();
		reader.onload = (event) => {
			document.getElementById('file').value = '';
			resolve({
				[storeKey]: file.name,
				type: file.type,
				size: file.size,
				data: event.target.result,
			});
		};
		reader.onerror = (event) => {
			reject(event.target.error);
		};
		reader.readAsArrayBuffer(file);
	});
};

/**
			 *  Simple JavaScript Promise that reads a file as text.
			 **/
const readFileArrayBuffer = (file) => {
	return new Promise(function (resolve, reject) {
		const reader = new FileReader();

		reader.onload = function (event) {
			resolve({
				[storeKey]: file.name,
				type: file.type,
				size: file.size,
				data: event.target.result,
			});
			//resolve(reader.result);
		};

		reader.onerror = function () {
			reject(reader);
			//reject(event.target.error);
		};

		reader.readAsArrayBuffer(file);
	});
}

// Handle multiple fileuploads
const getFileFromInputV2 = () => {
	let files = document.getElementById('file').files;
	let readers = [];

	// Abort if there were no files selected
	if (!files.length) return;

	// Store promises in array
	for (let i = 0; i < files.length; i++) {
		readers.push(readFileArrayBuffer(files[i]));
	}

	return Promise.all(readers);

	// Trigger Promises
	/*Promise.all(readers).then((values) => {
		// Values will be an array that contains an item
		// with the text of every selected file
		// ["File1 Content", "File2 Content" ... "FileN Content"]
		console.log(values);
	});*/
};

// Methods for the image gallery

/**
 * @desc Clears the gallery images from the DOM
 */
const clearGalleryImages = () => {
	document.getElementById('images').innerHTML = '';
}

/**
 * @desc Renders the gallery images in the DOM
 * @param {IDBCursorWithValue} cursor
 */
const renderGalleryColumn = (cursor) => {
	const galleryContainer = document.getElementById('images');
	const imageBuffer = cursor.value.data;
	const imageBlog = new Blob([imageBuffer]);

	const col = document.createElement('div');
	col.classList.add('col-12', 'col-md-6', 'col-lg-4');

	const card = document.createElement('div');
	card.classList.add('card');

	const cardBody = document.createElement('div');
	cardBody.classList.add('card-body');

	const image = document.createElement('img');
	image.src = URL.createObjectURL(imageBlog);
	image.classList.add('card-img-top');

	const title = document.createElement('h5');
	title.classList.add('card-title');
	title.innerText = cursor.value['type'];

	const subTitle = document.createElement('h6');
	subTitle.classList.add('card-subtitle');
	subTitle.innerText = formatAsByteString(+cursor.value['size'])

	const text = document.createElement('p');
	text.classList.add('card-text');
	text.innerText = cursor.value[storeKey];

	const deleteButton = document.createElement('button');
	deleteButton.classList.add('btn', 'btn-danger');
	deleteButton.innerText = 'Delete';
	deleteButton.addEventListener('click', () => {
		deleteImageFromIndexedDb(cursor.value[storeKey]);
	})

	cardBody.appendChild(title);
	cardBody.appendChild(subTitle);
	cardBody.appendChild(text)
	cardBody.appendChild(deleteButton);
	card.appendChild(image);
	card.appendChild(cardBody);
	col.appendChild(card);

	galleryContainer.appendChild(col);
}

// Methods for Storage quota
/**
 * @desc Gets the current storage quota
 * @returns {Promise<{totalQuota: string, usedQuota: string, freeQuota: string}>}
 */
const getStorageQuotaText = async () => {
	const estimate = await navigator.storage.estimate();
	const totalQuota = +(estimate.quota || 0);
	const usedQuota = +(estimate.usage || 0);
	const freeQuota = totalQuota - usedQuota;
	return {
		totalQuota: formatAsByteString(totalQuota),
		usedQuota: formatAsByteString(usedQuota),
		freeQuota: formatAsByteString(freeQuota)
	};
};

/**
 * @desc Renders the storage quota info in the DOM
 * @returns {Promise<void>}
 */
const renderStorageQuotaInfo = async () => {
	const { totalQuota, usedQuota, freeQuota } = await getStorageQuotaText();
	document.getElementById('storage-total').textContent = totalQuota;
	document.getElementById('storage-used').textContent = usedQuota;
	document.getElementById('storage-free').textContent = freeQuota;
}

// Util functions
const formatAsByteString = (bytes) => {
	const oneGigabyte = 1024 * 1024 * 1024;
	const oneMegabyte = 1024 * 1024;
	const oneKilobyte = 1024;

	return bytes > oneGigabyte ? `${(bytes / oneGigabyte).toFixed(2)} GB` : bytes > oneMegabyte ? `${(bytes / oneMegabyte).toFixed(2)} MB` : `${(bytes / oneKilobyte).toFixed(2)}KB`;
}


// Init event listeners
document.querySelector('#file-form')?.addEventListener('submit', handleSubmit);
document.querySelector('#search-form')?.addEventListener('submit', handleSearch);
document.querySelector('#clear-button')?.addEventListener('click', clearEntriesFromIndexedDb);

window.addEventListener('load', async () => {
	/** Uncomment the following code to enable user's persistent storage settings */
	// const requestPermission = await navigator.storage.persisted();
	// const persistent = await navigator.storage.persist();
	// if (persistent && requestPermission) {
	db = await initIndexedDb(dbName, [{ name: storeName, keyPath: storeKey }]);
	renderAvailableImagesFromDb();
	await renderStorageQuotaInfo();
	// } else {
	// 	console.warn('Persistence is not supported');
	// }
});

const uploadFilesWorker = () => {
	if (window.Worker) {
		const myWorker = new Worker("filesWorker.js");

		let filesInfo = {
			proyectoId: 1,
			accion: "CARGAR_ARCHIVOS",
			dbName,
			storeName, 
			storeKey,
			dbVersion
		};

		myWorker.postMessage(filesInfo);
		console.log('Message posted to worker: ', filesInfo);

		myWorker.onmessage = function (e) {
			//result.textContent = e.data;
			console.log('Message received from worker: ', e.data);
		}

	} else {
		console.log('Your browser doesn\'t support web workers.');
	}

}

