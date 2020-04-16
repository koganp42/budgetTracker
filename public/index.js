let transactions = [];
let myChart;

let db;
const request = window.indexedDB.open;
window.addEventListener("online", checkDb);

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

const getTransactions = () => {
  fetch("/api/transaction")
    .then(response => {
      return response.json();
    })
    .then(data => {
      // save db data on global variable
      transactions = data;
  
      populateTotal();
      populateTable();
      populateChart();
    });

}
getTransactions();

const populateTotal = () => {
  // reduce transaction amounts to a single total value
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

const populateTable = () => {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach(transaction => {
    // create and populate a table row
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

const populateChart = () => {
  // copy array and reverse it
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  let labels = reversed.map(t => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  let data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: 'line',
      data: {
        labels,
        datasets: [{
            label: "Total Over Time",
            fill: true,
            backgroundColor: "#6666ff",
            data
        }]
    }
  });
}

const sendTransaction = isAdding => {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  }
  else {
    errorEl.textContent = "";
  }

  // create record
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString()
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();
  
  // also send to server
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
  .then(response => {    
    return response.json();
  })
  .then(data => {
    if (data.errors) {
      errorEl.textContent = "Missing Information";
    }
    else {
      // clear form
      nameEl.value = "";
      amountEl.value = "";
    }
  })
  .catch(err => {
    // fetch failed, so save in indexed db
    saveRecord(transaction);

    // clear form
    nameEl.value = "";
    amountEl.value = "";
  });
}

document.querySelector("#add-btn").onclick = function() {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function() {
  sendTransaction(false);
};
