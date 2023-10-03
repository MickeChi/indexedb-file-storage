'use strict';

const storeName = 'localFiles';
const storeKey = 'fileName';
const dbVersion = 1;
let db = null;

const formatAsByteString = (bytes) => {
	const oneGigabyte = 1024 * 1024 * 1024;
  const oneMegabyte = 1024 * 1024;
  const oneKilobyte = 1024;

	return bytes > oneGigabyte ? `${(bytes / oneGigabyte).toFixed(2)} GB` : bytes > oneMegabyte ? `${(bytes / oneMegabyte).toFixed(2)} MB` : `${(bytes / oneKilobyte).toFixed(2)}KB`;
}

// Methods for Storage quota
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

=======
		totalQuota: formatAsByteString(totalQuota),
		usedQuota: formatAsByteString(usedQuota),
		freeQuota: formatAsByteString(freeQuota),
	};
};

>>>>>>> cb25094 (feat: add search using a cursor)
// Methods for form buttons and file input

/**
 * @desc Gets the file from the input field and adds it to the IndexedDB
 * @param {Event} ev
 * @returns {Promise<void>}
 */
const handleSubmit = async (ev) => {
	ev.preventDefault();
	const file = await getFileFromInput();
	const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
	store.add(file);

	store.transaction.oncomplete = () => {
		clearGalleryImages();
		renderAvailableImagesFromDb();
		renderStorageQuotaInfo();
	};
};

const handleSearch = async (ev) => {
	ev.preventDefault();
	const searchInput = document.getElementById('search').value;
	const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
	const cursorRequest = store.openCursor();
	clearGalleryImages();

	cursorRequest.onsuccess = (event) => {
		const cursor = event.target.result;
		if (cursor) {
			if (cursor.value[storeKey].toLowerCase().includes(searchInput.toLowerCase())) {
				renderGalleryColumn(cursor);
			}
			cursor.continue();
		}
	};
};



// IndexedDB Methods
/**
 * @desc Initializes the IndexedDB database
 * @param {string} dbName
 * @param {{name: string, keyPath: string}[]} stores
 * @returns {Promise<IDBDatabase>}
 */
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

// Util functions
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
				size: file.size,
				type: file.type,
				data: event.target.result,
			});
		};
		reader.onerror = (event) => {
			reject(event.target.error);
		};
		reader.readAsArrayBuffer(file);
	});
};
<<<<<<< HEAD



// IndexedDB Methods
/**
 * @desc Initializes the IndexedDB database
 * @param {string} dbName
 * @param {{name: string, keyPath: string}[]} stores
 * @returns {Promise<IDBDatabase>}
 */
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
				event.target.result.createObjectStore(store.name, { keyPath: store.keyPath });
			});
		};
	});
};

<<<<<<< HEAD
/**
 * @desc Renders the available images from the IndexedDB
 * @returns {void}
 */
=======
const clearEntriesFromIndexedDb = () => {
	const store = db.transaction(storeName, 'readwrite').objectStore(storeName);

	store.clear()
	clearPreviousImages();

	store.transaction.oncomplete = () => {
		renderStorageQuotaInfo();
	}
};

const deleteImageFromIndexedDb = (storeKey) => {
	const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
	store.delete(storeKey);
	store.transaction.oncomplete = async () => {
		clearPreviousImages();
		renderAvailableImagesFromDb();
		await renderStorageQuotaInfo();
	}
}

>>>>>>> 9648598 (feat: add delete method)
const renderAvailableImagesFromDb = () => {
	db.transaction(storeName, 'readonly').objectStore(storeName).openCursor().onsuccess = (event) => {
		const cursor = event.target.result;
		if (cursor) {
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

			document.getElementById('images').appendChild(col);
			cursor.continue();
		}
	};
};

/**
 * @desc Clears the previous images from the DOM
 * @returns {void}
 */
const clearPreviousImages = () => {
	document.getElementById('images').innerHTML = '';
};

/**
 * @desc Clears the previous images from IndexedDB
 * @returns {void}
 */
const clearEntriesFromIndexedDb = () => {
	db.transaction(storeName, 'readwrite').objectStore(storeName).clear();
	clearPreviousImages();
  renderStorageQuotaInfo();
};

// Methods for Storage quota
/**
 * @desc Gets the storage quota text
 * @returns {Promise<{totalQuota: string, usedQuota: string, freeQuota: string}>}
 */
const getStorageQuotaText = async () => {
  const oneGigabyte = 1024 * 1024 * 1024;
  const oneMegabyte = 1024 * 1024;
  const oneKilobyte = 1024;
	const estimate = await navigator.storage.estimate();
	const totalQuota = +(estimate.quota || 0);
	const usedQuota = +(estimate.usage || 0);
  const freeQuota = totalQuota - usedQuota;
	return {
    totalQuota: totalQuota > oneGigabyte ? `${(totalQuota / oneGigabyte).toFixed(2)} GB` : totalQuota > oneMegabyte ? `${(totalQuota / oneMegabyte).toFixed(2)} MB` : `${(totalQuota / oneKilobyte).toFixed(2)}KB`,
    usedQuota: usedQuota > oneGigabyte ? `${(usedQuota / oneGigabyte).toFixed(2)} GB` : usedQuota > oneMegabyte ? `${(usedQuota / oneMegabyte).toFixed(2)} MB` : `${(usedQuota / oneKilobyte).toFixed(2)}KB`,
    freeQuota: freeQuota > oneGigabyte ? `${(freeQuota / oneGigabyte).toFixed(2)} GB` : freeQuota > oneMegabyte ? `${(freeQuota / oneMegabyte).toFixed(2)} MB` : `${(freeQuota / oneKilobyte).toFixed(2)}KB`,
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

// Methods for form buttons and file input
/**
 * @desc Gets the file from the input field and adds it to the IndexedDB
 * @param {Event} ev
 * @returns {Promise<void>}
 */
const handleSubmit = async (ev) => {
	ev.preventDefault();
	const file = await getFileFromInput();
	const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
	store.add(file);

	store.transaction.oncomplete = () => {
		clearPreviousImages();
		renderAvailableImagesFromDb();
    renderStorageQuotaInfo()
	};
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
				data: event.target.result,
			});
		};
		reader.onerror = (event) => {
			reject(event.target.error);
		};
		reader.readAsArrayBuffer(file);
	});
};

// Init event listeners
document.querySelector('#file-form')?.addEventListener('submit', handleSubmit);
document.querySelector('#search-form')?.addEventListener('submit', handleSearch);
document.querySelector('#clear-button')?.addEventListener('click', clearEntriesFromIndexedDb);

window.addEventListener('load', async () => {
	const persistent = await navigator.storage.persist();
	if (persistent) {
		db = await initIndexedDb('my-db', [{ name: storeName, keyPath: storeKey }]);
		renderAvailableImagesFromDb();
		await renderStorageQuotaInfo();
	} else {
		console.warn('Persistence is not supported');
	}
});