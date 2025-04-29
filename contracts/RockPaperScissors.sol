// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

/**
* @title RockPaperScissors
* @notice Two players play Rock-Paper-Scissors. Timeout mechanism rewards the active player if timeout happens.
*/
contract RockPaperScissors {
    event ShapeLocked(address indexed player, int playerNumber);
    event ShapeRevealed(address indexed player, int playerNumber);

    address payable public player1;
    address payable public player2;
    bytes32 private hash1;
    bytes32 private hash2;
    string private revealedP1Shape;
    string private revealedP2Shape;
    int public lastWinner;
    uint public lastActionTime; // 🔥 마지막 액션 타임스탬프 기록

    modifier notRegisteredYet() {
        require(msg.sender != player1 && msg.sender != player2, "Already registered");
        _;
    }

    modifier isRegistered() {
        require(msg.sender == player1 || msg.sender == player2, "Not a registered player");
        _;
    }

    modifier hasEnoughEther() {
        require(msg.value >= 5 ether, "Minimum 5 ether required");
        _;
    }

    modifier bothLocked() {
        require(hash1 != bytes32(0) && hash2 != bytes32(0), "Both players must lock first");
        _;
    }

    modifier bothRevealed() {
        require(!stringsEqual(revealedP1Shape, "") && !stringsEqual(revealedP2Shape, ""), "Both players must reveal first");
        _;
    }

    modifier correctPlayer(int playerNumber) {
        require((msg.sender == player1 && playerNumber == 1) || (msg.sender == player2 && playerNumber == 2), "Wrong player");
        _;
    }

    function hasLocked(int playerNumber) public view returns (bool) {
        if (playerNumber == 1) return (hash1 != bytes32(0));
        else return (hash2 != bytes32(0));
    }

    function hasRevealed(int playerNumber) public view returns (bool) {
        if (playerNumber == 1) return (bytes(revealedP1Shape).length != 0);
        else return (bytes(revealedP2Shape).length != 0);
    }

    function getAddress(int playerNumber) public view returns (address) {
        if (playerNumber == 1) return player1;
        else return player2;
    }

    function getRevealed(int playerNumber) public view returns (string memory) {
        if (playerNumber == 1) return revealedP1Shape;
        else return revealedP2Shape;
    }

    function getHash(int playerNumber) public view returns (bytes32) {
        if (playerNumber == 1) return hash1;
        else return hash2;
    }

    function getWinner() public view returns (int) {
        return lastWinner;
    }

    function resetVariables() internal {
        revealedP1Shape = "";
        revealedP2Shape = "";
        player1 = payable(address(0));
        player2 = payable(address(0));
        hash1 = bytes32(0);
        hash2 = bytes32(0);
        lastActionTime = 0;
    }

    function registerPlayer(int playerNumber) public payable notRegisteredYet hasEnoughEther {
        require(playerNumber == 1 || playerNumber == 2, "Invalid player number");

        if (playerNumber == 1) {
            require(player1 == address(0), "Player 1 already registered");
            player1 = payable(msg.sender);
        } else {
            require(player2 == address(0), "Player 2 already registered");
            player2 = payable(msg.sender);
        }

        lastActionTime = block.timestamp; // 🔥 액션 시간 업데이트
    }

    function lockShape(int playerNumber, string memory shape, string memory randomStringToHash) public correctPlayer(playerNumber) isRegistered {
        if (msg.sender == player1 && hash1 == bytes32(0)) {
            hash1 = keccak256(bytes(shape)) ^ keccak256(bytes(randomStringToHash));
            emit ShapeLocked(msg.sender, playerNumber);
        }
        if (msg.sender == player2 && hash2 == bytes32(0)) {
            hash2 = keccak256(bytes(shape)) ^ keccak256(bytes(randomStringToHash));
            emit ShapeLocked(msg.sender, playerNumber);
        }

        lastActionTime = block.timestamp; // 🔥 액션 시간 업데이트
    }

    function revealShape(int playerNumber, string memory shape, string memory randomStringToHash) public isRegistered bothLocked correctPlayer(playerNumber) {
        bytes32 tempHash = keccak256(bytes(shape)) ^ keccak256(bytes(randomStringToHash));

        if (msg.sender == player1 && tempHash == hash1) {
            revealedP1Shape = shape;
            emit ShapeRevealed(msg.sender, playerNumber);
        }
        if (msg.sender == player2 && tempHash == hash2) {
            revealedP2Shape = shape;
            emit ShapeRevealed(msg.sender, playerNumber);
        }

        lastActionTime = block.timestamp; // 🔥 액션 시간 업데이트
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

    function distributeRewards() public payable bothLocked bothRevealed isRegistered {
        int winner = computeWinner(revealedP1Shape, revealedP2Shape);

        if (winner == 1) {
            (bool sent, ) = player1.call{value: 10 ether}("");
            require(sent, "Failed to send Ether");
        } else if (winner == 2) {
            (bool sent2, ) = player2.call{value: 5 ether}("");
            require(sent2, "Failed to send Ether");
        } else {
            player1.transfer(5 ether);
            player2.transfer(5 ether);
        }

        lastWinner = winner;
        resetVariables();
    }

    // 🔥 타임아웃 강제 리셋 및 보상
    function timeoutReset() public {
        require(block.timestamp > lastActionTime + 600, "Game is still active");

        bool p1Locked = hasLocked(1);
        bool p2Locked = hasLocked(2);
        bool p1Revealed = hasRevealed(1);
        bool p2Revealed = hasRevealed(2);

        uint balance = address(this).balance;

        if (p1Locked && p2Locked) {
            if (!p1Revealed && !p2Revealed) {
                player1.transfer(balance / 2);
                player2.transfer(balance / 2);
            } else if (p1Revealed && !p2Revealed) {
                player1.transfer(balance);
            } else if (!p1Revealed && p2Revealed) {
                player2.transfer(balance);
            }
        } else if (p1Locked && !p2Locked) {
            player1.transfer(balance);
        } else if (!p1Locked && p2Locked) {
            player2.transfer(balance);
        } else {
            player1.transfer(balance / 2);
            player2.transfer(balance / 2);
        }

        resetVariables();
    }

    function stringsEqual(string memory a, string memory b) public pure returns (bool) {
        return (keccak256(bytes(a)) == keccak256(bytes(b)));
    }
}
