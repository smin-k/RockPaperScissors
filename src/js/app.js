App = {
  web3Provider: null,
  contractInstance: null,
  contractABI: null,

  init: async function() {
    await App.initWeb3();
  },

  initWeb3: async function() {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (error) {
        console.error("User denied account access");
      }
    } else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
      web3 = new Web3(window.web3.currentProvider);
    } else {
      console.log('No Ethereum browser detected. Try MetaMask!');
      return;
    }

    await App.loadContract();
  },

  loadContract: async function() {
    // Load ABI from JSON
    const response = await fetch('RockPaperScissors.json');
    const data = await response.json();
    console.log(data.abi)
    App.contractABI = data.abi;

    // 여기서는 아직 address 없음. 나중에 연결할 때 사용.
  },

  connectContract: async function() {
    const address = document.getElementById("contract-address").value;
    if (!web3.utils.isAddress(address)) {
      alert('Invalid contract address');
      return;
    }
    App.contractInstance = new web3.eth.Contract(App.contractABI, address);
    console.log('Connected to contract at:', address);
    // ✅ 연결 성공하면 상태 표시
    document.getElementById("connection-status").innerText = "✅ Connected to Contract: " + address;

    App.contractInstance.events.allEvents()
    .on('data', function(event) {
      console.log('Received Event:', event.event); // ShapeLocked or ShapeRevealed
      //console.log(event); // full event data
      getStatus(App.contractInstance)
    });
    
    // 버튼들도 활성화 가능 (선택)
    App.setUp();
      
},

  setUp: async function() {
    const inst = App.contractInstance;
    if (!inst) {
      console.error('Contract not connected yet.');
      return;
    }
    getStatus(inst);
  },

  registerPlayer: async function(playerNumber) {
    const inst = App.contractInstance;
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
  
    try {
      disableAllButtons(); // 🔥 트랜잭션 시작할 때 모두 비활성화
      showLoading(playerNumber, "Registering player...");
  
      await inst.methods.registerPlayer(playerNumber)
        .send({ from: account, value: web3.utils.toWei('5', "ether") });
      
      const addr = await inst.methods.getAddress(playerNumber).call();
      setRegistered(playerNumber, addr);
    } catch (err) {
      console.error(err);
      showError(playerNumber, "Registration failed.");
    } finally {
      enableAllButtons(); // 🔥 트랜잭션 끝났을 때 다시 활성화
    }
  },
  
  lockShape: async function(playerNumber) {
    const inst = App.contractInstance;
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
  
    const shape = getSelectedShape(playerNumber);
    const str = getRandomString(playerNumber);
  
    try {
      disableAllButtons();
      showLoading(playerNumber, "Locking shape...");
  
      await inst.methods.lockShape(playerNumber, shape, str)
        .send({ from: account });
      
      setLocked(playerNumber, inst);
    } catch (err) {
      console.error(err);
      showError(playerNumber, "Lock shape failed.");
    } finally {
      enableAllButtons();
    }
  },
  
  revealShape: async function(playerNumber) {
    const inst = App.contractInstance;
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
  
    const shape = getSelectedShape(playerNumber);
    const str = getRandomString(playerNumber);
  
    try {
      disableAllButtons(); // 🔥 트랜잭션 시작
      showLoading(playerNumber, "Revealing shape...");
  
      await inst.methods.revealShape(playerNumber, shape, str)
        .send({ from: account });
  
      const revealed = await inst.methods.getRevealed(playerNumber).call();
      if (revealed !== "") {
        setRevealed(playerNumber, inst);
      } else {
        showError(playerNumber, "Could not reveal player shape.");
      }
    } catch (err) {
      console.error(err);
      showError(playerNumber, "Reveal failed.");
    } finally {
      enableAllButtons(); // 🔥 트랜잭션 끝
    }
  },
  
  distributeRewards: async function() {
    const inst = App.contractInstance;
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
  
    try {
      disableAllButtons(); // 🔥 트랜잭션 시작
      document.getElementById("winner-label").innerHTML = "⏳ Distributing rewards...";
  
      await inst.methods.distributeRewards()
        .send({ from: account, gas: 1000000 });
  
      const winner = await inst.methods.getWinner().call();
      if (winner == 1) {
        document.getElementById("winner-label").innerHTML = "🏆 Player1 won the last game.";
      } else if (winner == 2) {
        document.getElementById("winner-label").innerHTML = "🏆 Player2 won the last game.";
      } else {
        document.getElementById("winner-label").innerHTML = "🤝 The last game was a draw.";
      }
  
      document.getElementById("register1").disabled = false;
      document.getElementById("register2").disabled = false;
  
      App.setUp();
    } catch (err) {
      console.error(err);
      document.getElementById("winner-label").innerHTML = "❌ Failed to distribute rewards.";
    } finally {
      enableAllButtons(); // 🔥 트랜잭션 끝
    }
  },

  timeoutReset: async function() {
    const inst = App.contractInstance;
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
  
    try {
      showLoading(-1, "Checking timeout and resetting game...");
  
      await inst.methods.timeoutReset()
        .send({ from: account, gas: 1000000 });
  
      alert("✅ Timeout reset successful!");
      App.setUp(); // 다시 상태 새로고침
    } catch (err) {
      console.error(err);
      alert("❌ Timeout reset failed or not allowed yet.");
    } finally {
      enableAllButtons(); // 혹시 disable한 버튼 복구
    }
  },
  
};

function getSelectedShape(playerNumber) {
  if (playerNumber === 1) {
    return document.getElementById("select-player1").value;
  } else {
    return document.getElementById("select-player2").value;
  }
}

function getRandomString(playerNumber) {
  if (playerNumber === 1) {
    return document.getElementById("str1").value;
  } else {
    return document.getElementById("str2").value;
  }
}

function changeImage(strShape, playerNumber) {
  if (!strShape) {
    strShape = "Question";  // 🔥 값이 없으면 강제로 question
  }

  if (playerNumber == 1) {
    document.getElementById("img-player1").src = "/img/" + strShape + ".png";
  } else {
    document.getElementById("img-player2").src = "/img/" + strShape + ".png";
  }
}


// 현재 스마트 계약 상태를 불러와 UI를 업데이트
function getStatus(inst) {
  document.getElementById("reveal1").disabled = true;
  document.getElementById("reveal2").disabled = true;
  document.getElementById("distribute-rewards").disabled = true;

  inst.methods.getAddress(1).call().then(addr => {
    if (addr === '0x0000000000000000000000000000000000000000' || addr === '0x') {
      setNotRegistered(1);
    } else {
      setRegistered(1, addr);
    }
  });

  inst.methods.getAddress(2).call().then(addr => {
    if (addr === '0x0000000000000000000000000000000000000000' || addr === '0x') {
      setNotRegistered(2);
    } else {
      setRegistered(2, addr);
    }
  });

  inst.methods.hasLocked(1).call().then(boolean => {
    if (boolean) {
      setLocked(1, inst);
    }
  });

  inst.methods.hasLocked(2).call().then(boolean => {
    if (boolean) {
      setLocked(2, inst);
    }
  });

  inst.methods.hasRevealed(1).call().then(boolean => {
    if (boolean) {
      setRevealed(1, inst);
    }
  });

  inst.methods.hasRevealed(2).call().then(boolean => {
    if (boolean) {
      setRevealed(2, inst);
    }
  });

  checkTimeoutAvailable();
}

// 등록되지 않은 상태로 UI 업데이트
function setNotRegistered(playerNumber) {
  if (playerNumber === 1) {
    document.getElementById("select-player1").disabled = true;
    document.getElementById("str1").disabled = true;
    document.getElementById("lock1").disabled = true;
    document.getElementById("status-p1").innerHTML = "Please register.";
    document.getElementById("header-p1").innerHTML = "Player1";
  } else {
    document.getElementById("select-player2").disabled = true;
    document.getElementById("str2").disabled = true;
    document.getElementById("lock2").disabled = true;
    document.getElementById("status-p2").innerHTML = "Please register.";
    document.getElementById("header-p2").innerHTML = "Player2";
  }
}

// 등록된 상태로 UI 업데이트
function setRegistered(playerNumber, addr) {
  if (playerNumber === 1) {
    document.getElementById("register1").disabled = true;
    document.getElementById("status-p1").innerHTML = "Please lock shape.";
    document.getElementById("header-p1").innerHTML = "Player1: " + addr;
    document.getElementById("select-player1").disabled = false;
    document.getElementById("str1").disabled = false;
    document.getElementById("lock1").disabled = false;
  } else {
    document.getElementById("register2").disabled = true;
    document.getElementById("status-p2").innerHTML = "Please lock shape.";
    document.getElementById("header-p2").innerHTML = "Player2: " + addr;
    document.getElementById("select-player2").disabled = false;
    document.getElementById("str2").disabled = false;
    document.getElementById("lock2").disabled = false;
  }
}

function setLocked(playerNumber, inst) {
  if (playerNumber === 1) {
    document.getElementById("status-p1").innerHTML = "Successfully locked player shape.";
    document.getElementById("lock1").disabled = true;
    document.getElementById("str1").value = "";
    document.getElementById("img-player1").src = "/img/question.png";  // 🔥 락하면 물음표로 변경
  } else {
    document.getElementById("status-p2").innerHTML = "Successfully locked player shape.";
    document.getElementById("lock2").disabled = true;
    document.getElementById("str2").value = "";
    document.getElementById("img-player2").src = "/img/question.png";  // 🔥 락하면 물음표로 변경
  }
  checkBothLocked(inst);
}

async function setRevealed(playerNumber, inst) {
  if (playerNumber === 1) {
    document.getElementById("status-p1").innerHTML = "Successfully revealed player shape.";
    document.getElementById("reveal1").disabled = true;
    document.getElementById("str1").value = "";

    // 🔥 reveal된 실제 shape 가져오기
    const shape = await inst.methods.getRevealed(1).call();
    changeImage(shape, 1);
  } else {
    document.getElementById("status-p2").innerHTML = "Successfully revealed player shape.";
    document.getElementById("reveal2").disabled = true;
    document.getElementById("str2").value = "";

    // 🔥 reveal된 실제 shape 가져오기
    const shape = await inst.methods.getRevealed(2).call();
    changeImage(shape, 2);
  }
  checkBothRevealed(inst);
}


// 두 명 모두 락 완료했는지 체크
function checkBothLocked(inst) {
  inst.methods.hasLocked(1).call().then(boolean1 => {
    if (boolean1) {
      inst.methods.hasLocked(2).call().then(boolean2 => {
        if (boolean2) {
          document.getElementById("reveal1").disabled = false;
          document.getElementById("reveal2").disabled = false;
        }
      });
    }
  });
}

// 두 명 모두 공개 완료했는지 체크
function checkBothRevealed(inst) {
  inst.methods.hasRevealed(1).call().then(boolean1 => {
    if (boolean1) {
      inst.methods.hasRevealed(2).call().then(boolean2 => {
        if (boolean2) {
          document.getElementById("distribute-rewards").disabled = false;
        }
      });
    }
  });
}

function showLoading(playerNumber, message) {
  if (playerNumber === 1) {
    document.getElementById("status-p1").innerHTML = "⏳ " + message;
  } else if (playerNumber === 2) {
    document.getElementById("status-p2").innerHTML = "⏳ " + message;
  }
}

function showError(playerNumber, message) {
  if (playerNumber === 1) {
    document.getElementById("status-p1").innerHTML = "❌ " + message;
  } else if (playerNumber === 2) {
    document.getElementById("status-p2").innerHTML = "❌ " + message;
  }
}

function disableAllButtons() {
  document.querySelectorAll('button').forEach(button => {
    button.disabled = true;
  });
}

function enableAllButtons() {
  document.querySelectorAll('button').forEach(button => {
    button.disabled = false;
  });
}

function checkTimeoutAvailable() {
  const inst = App.contractInstance;
  inst.methods.getLastActionTime().call().then(lastAction => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = parseInt(lastAction) + 600 - now; // 남은 초

    const timeoutStatus = document.getElementById("timeout-status");
    const timeoutButton = document.getElementById("timeout-reset");

    if (remaining <= 0) {
      timeoutStatus.innerText = "⛔ Timeout Reset Available!";
      timeoutButton.disabled = false;
    } else {
      timeoutStatus.innerText = `⏳ Timeout in: ${remaining}s`;
      timeoutButton.disabled = true;
    }
  }).catch(err => {
    console.error("Failed to check timeout", err);
    document.getElementById("timeout-reset").disabled = true;
    document.getElementById("timeout-status").innerText = "";
  });
}





/**
* JQuery function that is called when the browser window loads. This initialises the app.
*/
window.addEventListener('load', () => {
  App.init();

  // ⏰ 매 1초마다 timeout 체크
  setInterval(() => {
    if (App.contractInstance) {  // 컨트랙트 연결된 경우만
      checkTimeoutAvailable();
    }
  }, 1000); // 1초 (1000ms)
});
