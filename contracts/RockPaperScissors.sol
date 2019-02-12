pragma solidity ^0.5.0;

contract RockPaperScissors {
  address payable player1;
  address payable player2;
  bytes32 hash1;
  bytes32 hash2;
  string revealedP1Shape;
  string revealedP2Shape;
  int winnerPlayer;

  modifier notRegisteredYet() {
    require (msg.sender != player1 && msg.sender != player2);
    _;
  }

  modifier isRegistered() {
    require (msg.sender == player1 || msg.sender == player2);
    _;
  }

  modifier hasEnoughEther() {
    require(msg.value >= 5 ether);
    _;
  }

  modifier bothLocked(){
    require( hash1 != bytes32(0) && hash2 != bytes32(0));
    _;
  }

  modifier correctPlayer(int playerNumber) {
    require( (msg.sender == player1 && playerNumber == 1) || (msg.sender == player2 && playerNumber == 2) );
    _;
  }

  function getPlayer(int playerNumber) public view returns (address) {
    if (playerNumber == 1)
      return player1;
    else
      return player2;
  }

  function getLocked(int playerNumber) public view returns (bool) {
    if (playerNumber == 1)
      return (hash1 != bytes32(0));
    else
      return (hash2 != bytes32(0));
  }

  function isRevealed(int playerNumber) public view returns (bool) {
    if (playerNumber == 1)
      return (!stringsEqual(revealedP1Shape,""));
    else
      return (!stringsEqual(revealedP2Shape,""));
  }


  function getRevealed(int playerNumber) public view returns (string memory) {
    if (playerNumber == 1)
      return revealedP1Shape;
    else
      return revealedP2Shape;
  }

  function getHash(int playerNumber) public view returns (bytes32) {
    if (playerNumber == 1)
      return hash1;
    else
      return hash2;
  }

  function getWinner() public view returns (int) {
    return winnerPlayer;
  }

  function resetVariables() public {
    revealedP1Shape = "";
    revealedP2Shape = "";
    nullifyAddr(player1);
    nullifyAddr(player2);
		hash1 = bytes32(0);
		hash2 = bytes32(0);
    winnerPlayer = -1;
  }


  function registerPlayer(int playerNumber) public payable notRegisteredYet hasEnoughEther {

    if (playerNumber == 1) {
      if (player1 == address(0)) {
          player1 = msg.sender;
        }
    } else {
      if (player2 == address(0)) {
          player2 = msg.sender;
      }
    }
  }

  // returns bool so we can check if the web UI needs to be updated
  function lockShape(int playerNumber, string memory shape, string memory randomStringToHash) public correctPlayer(playerNumber) isRegistered returns (bool) {
    // if the player is locking his own shape AND if it is the player's address that calls this AND if the player's hash has not been set
    if(msg.sender == player1 && hash1 == bytes32(0)) {
      // XOR random string with shape
      hash1 = keccak256(bytes(shape)) ^ keccak256(bytes(randomStringToHash));
      return true;
    }
    if(msg.sender == player2 && hash2 == bytes32(0)) {
      hash2 = keccak256(bytes(shape)) ^ keccak256(bytes(randomStringToHash));
      return true;
    }
    return false;
  }

  // returns bool so we can check if the web UI needs to be updated
  function revealShape(int playerNumber, string memory shape, string memory randomStringToHash) public isRegistered bothLocked correctPlayer(playerNumber) returns (int) {
    bytes32 tempHash = keccak256(bytes(shape)) ^ keccak256(bytes(randomStringToHash));

    // again, we want to check this so that the player does not unlock the opponent's shape
		if(msg.sender == player1){
			if(tempHash == hash1){
				if(stringsEqual(shape, "Rock")) {
					revealedP1Shape = "Rock";
          return 1;
				}
        if(stringsEqual(shape, "Paper")) {
          revealedP1Shape = "Paper";
          return 1;
				}
        if(stringsEqual(shape, "Scissors")) {
          revealedP1Shape = "Scissors";
          return 1;
				}
        // shape is going to be one of the above
			}
		}
    if(msg.sender == player2){
			if(tempHash == hash2){
				if(stringsEqual(shape, "Rock")) {
					revealedP2Shape = "Rock";
          return 1;
				}
        if(stringsEqual(shape, "Paper")) {
          revealedP2Shape = "Paper";
          return 1;
				}
        if(stringsEqual(shape, "Scissors")) {
          revealedP2Shape = "Scissors";
          return 1;
				}
			}
		}
    return 0;
	}



  function computeWinner(string memory revealedP1, string memory revealedP2) pure public returns (int) {

    if (stringsEqual(revealedP1, revealedP2)) return 0;
    else if (stringsEqual(revealedP1, "Rock") && stringsEqual(revealedP2, "Scissors")) return 1;
    else if (stringsEqual(revealedP1, "Rock") && stringsEqual(revealedP2, "Paper")) return 2;
    else if (stringsEqual(revealedP1, "Paper") && stringsEqual(revealedP2, "Rock")) return 1;
    else if (stringsEqual(revealedP1, "Paper") && stringsEqual(revealedP2, "Scissors")) return 2;
    else if (stringsEqual(revealedP1, "Scissors") && stringsEqual(revealedP2, "Rock")) return 2;
    else if (stringsEqual(revealedP1, "Scissors") && stringsEqual(revealedP2, "Paper")) return 1;
    else return 0;

  }

  function play() public payable bothLocked returns (int) {

    int winner = computeWinner(revealedP1Shape, revealedP2Shape);

    if (winner == 1) {

      player1.transfer(10 ether);

    } else if (winner == 2) {

      player2.transfer(10 ether);

    } else {
      // in the case of a draw, send half money to both parties
      player1.transfer(5 ether);
			player2.transfer(5 ether);

    }
    resetVariables();
    winnerPlayer = winner;
    return winner;

  }


  function nullifyAddr(address addr) public pure {
    addr = address(0);
  }

  function stringsEqual(string memory _a, string memory _b) public pure returns (bool) {
    bytes memory a = bytes(_a);
    bytes memory b = bytes(_b);

    if (a.length != b.length)
        return false;

    for (uint i = 0; i < a.length; i ++)
        if (a[i] != b[i])
            return false;
        return true;

  }

}
