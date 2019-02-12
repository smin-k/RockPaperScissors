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

    console.log("initialising web3")

    if (typeof web3 !== 'undefined') {

      App.web3Provider = web3.currentProvider;

    } else {

      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }

    web3 = new Web3(App.web3Provider);

    return App.initContract();

  },

  initContract: function() {
    console.log("initialising contract")

    var req = $.getJSON('RockPaperScissors.json', function(data) {

      var RockPaperScissorsArtifact = data;
      App.contracts.RockPaperScissors = TruffleContract(RockPaperScissorsArtifact);

      App.contracts.RockPaperScissors.setProvider(App.web3Provider);
      console.log(App.contracts.RockPaperScissors.deployed());

    });
    req.done(function() {
      App.setUp();
    });
  },

  setUp: function() {
    var inst;

    App.contracts.RockPaperScissors.deployed().then(function(instance) {
      inst = instance;

      inst.getPlayer(1).then(addr => {
        // checks if player1 is already registered - if so disable register button
        if (addr == '0x0000000000000000000000000000000000000000' || addr == '0x') {
          console.log("Player1 needs to register - " + addr);
        } else {
          console.log("Player1 is already registered at address: " + addr);
          document.getElementById("register1").disabled = true;
          document.getElementById("header_p1").innerHTML = "Player1: " + addr;
        }
      });
      inst.getPlayer(2).then(addr => {
        if (addr == '0x0000000000000000000000000000000000000000' || addr == '0x') {
          console.log("Player2 needs to register - " + addr);
        } else {
          console.log("Player2 is already registered at address: " + addr);
          document.getElementById("register2").disabled = true;
          document.getElementById("header_p2").innerHTML = "Player2: " + addr;
        }
      });
      document.getElementById("play").disabled = true;


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
      console.log('Account to be registered: ' + account);
      App.contracts.RockPaperScissors.deployed().then(instance => {
        console.log(instance)
        console.log('PlayerNumber: ' + playerNumber);
        inst = instance;
        if (playerNumber == 1) {
          // need to send tokens in order for the contract to be able to transfer these at the end of the game.
          return inst.registerPlayer(1, {from: account, value:web3.toWei(5, "ether")});
        }
        else {
          return inst.registerPlayer(2, {from: account, value:web3.toWei(5, "ether")});
        }
      }).then(() => {
        console.log("Successfully Registered Player " + playerNumber);
        if (playerNumber == 1) {
          document.getElementById("register1").disabled = true;
        } else {
          document.getElementById("register2").disabled = true;
        }
        return inst.getPlayer(playerNumber);

      }).then(addr => {
        console.log(addr);
        if (playerNumber == 1) {
          document.getElementById("header_p1").innerHTML = "Player1: " + addr;
        } else {
          document.getElementById("header_p2").innerHTML = "Player2: " + addr;
        }
        return inst.getHash(playerNumber);
      }).then(hash => {
        console.log("HASH: " + hash);
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
      console.log(account)
      App.contracts.RockPaperScissors.deployed().then(function(instance) {
        inst = instance;
        console.log(playerNumber);
        console.log(shape);
        console.log(str);

        return inst.lockShape(playerNumber, shape, str, {from: account});

      }).then(() => {
        return inst.hasLocked(playerNumber);
      }).then(boolean => {
        console.log(boolean);
        if (boolean) {
          console.log("Successfully locked player shape.");
          if (playerNumber == 1) {
            document.getElementById("lock1").disabled = true;
            document.getElementById("str1").value = "";
            document.getElementById("status-p1").innerHTML = "Successfully locked player shape.";
          } else if (playerNumber == 2){
            document.getElementById("lock2").disabled = true;
            document.getElementById("str2").value = "";
            document.getElementById("status-p2").innerHTML = "Successfully locked player shape.";
          }
          if (document.getElementById("lock1").disabled == true && document.getElementById("lock2").disabled == true) {
            document.getElementById("reveal1").disabled = false;
            document.getElementById("reveal2").disabled = false;
          }
        } else {
          console.log("Could not lock player shape.");
        }
        return inst.getHash(playerNumber);
      }).then(hash => {
        console.log(hash);
        return inst.getRevealed(playerNumber);
      }).then(string => {
        console.log("REVEALED: " + string);
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
      console.log(account);
      App.contracts.RockPaperScissors.deployed().then(instance => {
        inst = instance;
        console.log(shape);
        console.log(str);
        return inst.revealShape(playerNumber, shape, str, {from: account});
      }).then(() => {
        return inst.getRevealed(playerNumber);
      }).then(string => {
        console.log("REVEALED:" + string);
        if (string != "") {
          console.log("Successfully revealed player shape.");
          if (playerNumber == 1) {
            document.getElementById("status-p1").innerHTML = "Successfully revealed player shape.";
            document.getElementById("reveal1").disabled = true;
          } else if (playerNumber == 2){
            document.getElementById("status-p2").innerHTML = "Successfully revealed player shape.";
            document.getElementById("reveal2").disabled = true;
          }
          if (document.getElementById("reveal1").disabled == true && document.getElementById("reveal2").disabled == true) {
            document.getElementById("play").disabled = false;
          }
        } else {
          if (playerNumber == 1) {
            document.getElementById("status-p1").innerHTML = "Could not reveal player shape.";
          } else if (playerNumber == 2) {
            document.getElementById("status-p2").innerHTML = "Could not reveal player shape.";
          }
          console.log("Could not reveal player shape.");
        }
        return inst.getHash(playerNumber);
      }).then(hash => {
        console.log("HASH: " + hash);
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
        console.log("Player1 is locked: " + boolean);
        return inst.hasLocked(2);
      }).then(boolean => {
        console.log("Player2 is locked: " + boolean);

        return inst.play({from: account, gas: "100000"});
      }).then(() => {
        return inst.getWinner();
      }).then(winnerInt => {
        console.log("Successfully played the game. Winner: " + winnerInt);
        if (winnerInt == 1) {
          document.getElementById("winner-label").innerHTML = "Player1 won the last game.";
        } else if (winnerInt == 2) {
          document.getElementById("winner-label").innerHTML = "Player2 won the last game.";
        } else {
          document.getElementById("winner-label").innerHTML = "The last game was a draw.";
        }
        resetView();

      }).catch(function(err) {
        console.error(err);
      });
    });
  }
};

function resetView() {
  document.getElementById("header_p1").innerHTML = "Player1";
  document.getElementById("header_p2").innerHTML = "Player2";
  document.getElementById("lock1").disabled = false;
  document.getElementById("lock2").disabled = false;
  document.getElementById("play").disabled = true;
  document.getElementById("status-p1").innerHTML = "";
  document.getElementById("status-p2").innerHTML = "";
}


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


$(function() {
  $(window).load(function() {
    document.getElementById("reveal1").disabled = true;
    document.getElementById("reveal2").disabled = true;
    App.init();
  });

});
