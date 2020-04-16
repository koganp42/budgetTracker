let db;

const request = window.indexedDB.open("budget", 1);
console.log("Indexed DB available"); 

const saveRecord = record => {
    const transaction = db.transaction(["pending"], "readwrite");
    const pendingStore = transaction.objectStore("pending"); 
    pendingStore.add(record); 
  }

const checkDb = () => {
    const transaction = db.transaction(["pending"], "readwrite");
    const pendingStore = transaction.objectStore("pending"); 
    
    const getAllRecords = pendingStore.getAll();
    getAllRecords.onsuccess = () => {
      if(getAllRecords.result.length > 0){
        fetch("/api/transaction/bulk", {
          method: "POST",
          body: JSON.stringify(getAll.result),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json"
          }
        }).then(response => response.json()
        ).then(() => {
          const transaction = db.transaction(["pending"], "readwrite");
          const pendingStore = transaction.objectStore("pending"); 
          pendingStore.clear();
          getTransactions();
          console.log("Finished updating transactions")
        })
      }
    }
  }

  request.onupgradeneeded = e => {
    db = e.target.result;
    const pendingStore = db.createObjectStore("pending", {autoIncrement: true});
    console.log(pendingStore);
  }
  
  request.onsuccess = e => {
    db = request.result;
    if(navigator.onLine === true){
      checkDb();
    }
  }
  
  request.onerror = e => {
    console.log(e.target.errorCode);
  }

window.addEventListener("online", checkDb);