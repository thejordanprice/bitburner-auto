// Load pako library
let script = document.createElement('script');
script.src = "https://cdnjs.cloudflare.com/ajax/libs/pako/2.0.3/pako.min.js";
document.head.appendChild(script);

// Verify pako is loaded
script.onload = function() {
    console.log('pako loaded:', typeof pako !== 'undefined');
    
    // Once pako is loaded, proceed with database operations
    modifySaveData();
};

function modifySaveData() {
    let dbName = 'bitburnerSave';
    let request = indexedDB.open(dbName);

    request.onsuccess = function(event) {
        console.log('Database opened successfully.');
        let db = event.target.result;

        // Get the data from the 'savestring' object store
        getData(db, 'savestring');
    };

    request.onerror = function(event) {
        console.error('Database error:', event.target.errorCode);
    };

    function getData(db, storeName) {
        let transaction = db.transaction([storeName], 'readonly');
        let objectStore = transaction.objectStore(storeName);
        let request = objectStore.getAll();

        request.onsuccess = function(event) {
            let allData = event.target.result;
            console.log('Data in store', storeName, ':', allData);

            if (allData.length > 0 && allData[0] instanceof Uint8Array) {
                let uint8ArrayData = allData[0];
                console.log('Uint8Array Data:', uint8ArrayData);

                // Decompress using gzip
                let decompressedData;
                try {
                    decompressedData = pako.ungzip(uint8ArrayData, { to: 'string' });
                    console.log('Decompressed Data:', decompressedData);

                    // Parse as JSON
                    let jsonData;
                    try {
                        jsonData = JSON.parse(decompressedData);
                        console.log('Parsed JSON Data:', jsonData);

                        // Modify the faction reputations
                        jsonData.data.FactionsSave = JSON.parse(jsonData.data.FactionsSave); // Parse FactionsSave
                        for (let faction in jsonData.data.FactionsSave) {
                            if (jsonData.data.FactionsSave.hasOwnProperty(faction)) {
                                jsonData.data.FactionsSave[faction].playerReputation += 50000; // Add 50,000 to playerReputation
                            }
                        }
                        jsonData.data.FactionsSave = JSON.stringify(jsonData.data.FactionsSave); // Re-stringify FactionsSave

                        console.log('Modified JSON Data:', jsonData);

                        // Compress the modified data
                        let modifiedCompressedData;
                        try {
                            modifiedCompressedData = pako.gzip(JSON.stringify(jsonData));
                            console.log('Compressed Modified Data:', modifiedCompressedData);

                            // Save the modified data back to IndexedDB
                            saveData(db, storeName, modifiedCompressedData);
                        } catch (e) {
                            console.error('Gzip compression failed:', e);
                        }
                    } catch (e) {
                        console.error('Failed to parse JSON:', e);
                    }
                } catch (e) {
                    console.error('Gzip decompression failed:', e);
                }
            } else {
                console.log('No Uint8Array data found.');
            }
        };

        request.onerror = function(event) {
            console.error('Error fetching data:', event.target.errorCode);
        };
    }

    function saveData(db, storeName, data) {
        let transaction = db.transaction([storeName], 'readwrite');
        let objectStore = transaction.objectStore(storeName);
        
        // Use 'save' as the key
        let key = 'save';

        // Use put with the key parameter
        let request = objectStore.put(data, key);

        request.onsuccess = function(event) {
            console.log('Data saved successfully:', event);
        };

        request.onerror = function(event) {
            console.error('Error saving data:', event.target.errorCode);
        };
    }
}
