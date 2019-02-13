/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

App = {

  web3Provider: null,
  contracts: {},
  registered: false,

  init: function() {

    return App.initWeb3();

  },

  initWeb3: function() {

    // initialising web3
    if (typeof web3 !== 'undefined') {

      App.web3Provider = web3.currentProvider;

    } else {

      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }

    web3 = new Web3(App.web3Provider);

    return App.initContract();

  },

  initContract: function() {

    // initialising the contract
    // the json file stores the contract ABI which is passed into the 'RockPaperScissorsArtifact'
    var req = $.getJSON('RockPaperScissors.json', function(data) {

      var RockPaperScissorsArtifact = data;
      App.contracts.RockPaperScissors = TruffleContract(RockPaperScissorsArtifact);

      App.contracts.RockPaperScissors.setProvider(App.web3Provider);

    });
    req.done(function() {
      App.setUp();
    });
  },

  setUp: function() {
    var inst;

    App.contracts.RockPaperScissors.deployed().then(function(instance) {
      inst = instance;

      getStatus(inst);

    }).catch(function(err) {
      console.error(err);
    });
    return;
  },

  registerPlayer : function(playerNumber){
    var inst;
    web3.eth.getAccounts(function(err, accounts) {
      if (err) {
        console.error(err);
      }
      var account = accounts[0];
      App.contracts.RockPaperScissors.deployed().then(instance => {
        inst = instance;
        if (playerNumber == 1) {
          // need to send tokens in order for the contract to be able to transfer these at the end of the game.
          return inst.registerPlayer(1, {from: account, value: web3.toWei(5, "ether")});
        }
        else {
          return inst.registerPlayer(2, {from: account, value: web3.toWei(5, "ether")});
        }
      }).then(() => {

        return inst.getAddress(playerNumber);

      }).then(addr => {

        setRegistered(playerNumber, addr);

      }).catch(function(err) {
        console.error(err);
      });
    });
  },

  lockShape: function(playerNumber) {
    var inst;
    var shape = getSelectedShape(playerNumber);
    var str = getRandomString(playerNumber);
    web3.eth.getAccounts(function(err, accounts) {
      if (err) {
        console.error(err);
      }
      var account = accounts[0];
      App.contracts.RockPaperScissors.deployed().then(instance => {
        inst = instance;
        return inst.lockShape(playerNumber, shape, str, {from: account});
      }).then(() => {
        setLocked(playerNumber, inst);
      }).catch(function(err) {
        console.error(err);
      });
    });
  },

  revealShape: function(playerNumber){
    var inst;
    var shape = getSelectedShape(playerNumber);
    var str = getRandomString(playerNumber);
    web3.eth.getAccounts(function(err, accounts) {
      if (err) {
        console.error(err);
      }
      var account = accounts[0];
      App.contracts.RockPaperScissors.deployed().then(instance => {
        inst = instance;
        return inst.revealShape(playerNumber, shape, str, {from: account});
      }).then(() => {
        return inst.getRevealed(playerNumber);
      }).then(string => {
        if (string != "") {
          setRevealed(playerNumber, inst)
        } else {
          if (playerNumber == 1) {
            document.getElementById("status-p1").innerHTML = "Could not reveal player shape.";
          } else if (playerNumber == 2) {
            document.getElementById("status-p2").innerHTML = "Could not reveal player shape.";
          }
        }
      }).catch(function(err) {
        console.error(err);
      });
    });
  },

  play: function() {
    var inst;
    web3.eth.getAccounts(function(err, accounts) {
      if (err) {
        console.error(err);
      }
      var account = accounts[0];
      App.contracts.RockPaperScissors.deployed().then(instance => {
        inst = instance;
        return inst.hasLocked(1);
      }).then(boolean => {
        return inst.hasLocked(2);
      }).then(boolean => {
        return inst.play({from: account, gas: "1000000"});
      }).then(() => {
        return inst.getWinner();
      }).then(winnerInt => {
        if (winnerInt == 1) {
          document.getElementById("winner-label").innerHTML = "Player1 won the last game.";
        } else if (winnerInt == 2) {
          document.getElementById("winner-label").innerHTML = "Player2 won the last game.";
        } else {
          document.getElementById("winner-label").innerHTML = "The last game was a draw.";
        }
        document.getElementById("register1").disabled = false;
        document.getElementById("register2").disabled = false;
        App.setUp();
      }).catch(function(err) {
        console.error(err);
      });
    });
  }
};

function getSelectedShape(playerNumber) {

  if (playerNumber == 1) {
    return document.getElementById("select_player1").value;
  } else {
    return document.getElementById("select_player2").value;
  }

}

function getRandomString(playerNumber) {

  if (playerNumber == 1) {
    return document.getElementById("str1").value;
  } else {
    return document.getElementById("str2").value;
  }

}

function changeImage(strChoice, playerNumber) {

  if (playerNumber == 1) {
    document.getElementById("img_player1").src = "/img/" + strChoice + ".png";
  } else {
    document.getElementById("img_player2").src = "/img/" + strChoice + ".png";
  }

}

// In case there was a game that has not been finished
function getStatus(inst) {
  document.getElementById("reveal1").disabled = true;
  document.getElementById("reveal2").disabled = true;
  document.getElementById("play").disabled = true;

  //enable by default
  inst.getAddress(1).then(addr => {
    if (addr == '0x0000000000000000000000000000000000000000' || addr == '0x') {
      document.getElementById("select_player1").disabled = true;
      document.getElementById("str1").disabled = true;
      document.getElementById("lock1").disabled = true;
      document.getElementById("status-p1").innerHTML = "Please register.";
      document.getElementById("header_p1").innerHTML = "Player1";
    } else {
      setRegistered(1, addr);
    }
  });
  inst.getAddress(2).then(addr => {
    if (addr == '0x0000000000000000000000000000000000000000' || addr == '0x') {
      document.getElementById("select_player2").disabled = true;
      document.getElementById("str2").disabled = true;
      document.getElementById("lock2").disabled = true;
      document.getElementById("status-p2").innerHTML = "Please register.";
      document.getElementById("header_p2").innerHTML = "Player2";
    } else {
      setRegistered(2, addr);
    }
  });
  inst.hasLocked(1).then(boolean => {
    if (boolean) {
      setLocked(1, inst);
    }
  });
  inst.hasLocked(2).then(boolean => {
    if (boolean) {
      setLocked(2, inst);
    }
  });
  inst.hasRevealed(1).then(boolean => {
    if (boolean) {
      setRevealed(1, inst);
    }
  });
  inst.hasRevealed(2).then(boolean => {
    if (boolean) {
      setRevealed(2, inst);
    }
  });
}

function setRegistered(playerNumber, addr) {
  if (playerNumber == 1) {
    document.getElementById("register1").disabled = true;
    document.getElementById("status-p1").innerHTML = "Please lock shape.";
    document.getElementById("header_p1").innerHTML = "Player1: " + addr;
    document.getElementById("select_player1").disabled = false;
    document.getElementById("str1").disabled = false;
    document.getElementById("lock1").disabled = false;
  } else {
    document.getElementById("register2").disabled = true;
    document.getElementById("status-p2").innerHTML = "Please lock shape.";
    document.getElementById("header_p2").innerHTML = "Player2: " + addr;
    document.getElementById("select_player2").disabled = false;
    document.getElementById("str2").disabled = false;
    document.getElementById("lock2").disabled = false;
  }
}

function setLocked(playerNumber, inst) {
  if (playerNumber == 1) {
    document.getElementById("status-p1").innerHTML = "Successfully locked player shape.";
    document.getElementById("lock1").disabled = true;
  } else {
    document.getElementById("status-p2").innerHTML = "Successfully locked player shape.";
    document.getElementById("lock2").disabled = true;
  }
  checkBothLocked(inst);
}

function setRevealed(playerNumber, inst) {
  if (playerNumber == 1) {
    document.getElementById("status-p1").innerHTML = "Successfully revealed player shape.";
    document.getElementById("reveal1").disabled = true;
  } else {
    document.getElementById("status-p2").innerHTML = "Successfully revealed player shape.";
    document.getElementById("reveal2").disabled = true;
  }
  checkBothRevealed(inst);
}

function checkBothLocked(inst) {
  inst.hasLocked(1).then(boolean1 => {
    if (boolean1) {
      return inst.hasLocked(2).then(boolean2 => {
        if (boolean2) {
          document.getElementById("reveal1").disabled = false;
          document.getElementById("reveal2").disabled = false;;
        }
      });
    }
  });
}

function checkBothRevealed(inst) {
  inst.hasRevealed(1).then(boolean1 => {
    if (boolean1) {
      return inst.hasRevealed(2).then(boolean2 => {
        if (boolean2) {
          document.getElementById("play").disabled = false;
        }
      });
    }
  });
}


$(function() {
  $(window).load(function() {
    App.init();
  });

});
