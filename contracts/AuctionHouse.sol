pragma solidity ^0.5.0;

//*****Todo: Sealed auction part

//Contract for Auction House overseeing individual auctions
contract AuctionHouse {
    //Track all auctions
    Auction[] public auctions;

    //Broadcast new auctions
    event AuctionCreated(address singleAuction);

    //Create new auction with the parameters auction item and time limit.
    function createAuction (
      string memory _item,
      uint _startPrice,
      string memory _desc,
      uint _timeLimit,
      uint _revealTime
    ) public returns (address auctionAddress){

      //Error handling
      require(_timeLimit > 0, 'Please input a proper auction time limit.');
      require(_revealTime > 0, 'Please input a proper reveal time limit.');
      require(bytes(_item).length > 0, 'Please input a proper auction item name.');

      //Add new auction and returns auction contract address
      Auction newAuction = new Auction(_item, _startPrice, _desc, _timeLimit, _revealTime, msg.sender);
      emit AuctionCreated(address(newAuction));
      auctions.push(newAuction);
      return address(newAuction);
    }

    //Return list of all auctions
    function returnAllAuctions() public view returns(Auction[] memory) {
      return auctions;
    }
}

//Contract for individual auctions
contract Auction {

    //Initialize global variables
    string public item;
    address payable public owner;
    uint public startPrice;
    string public desc;
    uint public auctionEndTime;
    uint public timeLimit;
    uint public revealEndTime;
    uint public revealTime;
    bool public isOpen = true;
    address public highestBidder;
    uint public highestBid;

    mapping(address => uint) deposits;
    mapping(bytes32 => address) sealedBidList;

    event log(string);
    event logNum(uint);
    event logBytes(bytes32);
    event OpenRevealPeriod();
    event Results(address winner, uint amount);

    modifier isOwner {
        require(msg.sender == owner, "You must be the owner to perform this action");
        _;
    }
    modifier isNotOwner {
        require(msg.sender != owner, "The owner of this auction cannot perform this action");
        _;
    }
    modifier revealPeriod {
        require(now >= auctionEndTime && now <= revealEndTime, "This action can only be performed after the auction is over and the reveal period has started");
        _;
    }
    modifier completedAuction {
        require(now >= revealEndTime, "This action can only be performed after an auction is over");
        _;
    }


    constructor(
        string memory _item,
        uint _startPrice,
        string memory _desc,
        uint _timeLimit,
        uint _revealTime,
        address payable _owner
    ) public {
        item = _item;
        owner = _owner;
        startPrice = _startPrice * 1 ether;
        desc = _desc;
        timeLimit = _timeLimit;
        revealTime = _revealTime;
        auctionEndTime = now + timeLimit * 1 seconds;
        revealEndTime = auctionEndTime + revealTime * 1 seconds;
    }

    //Allows users to bid for auctions, but prevents owner from entering bids
    function bid (bytes32 sealedBid) isNotOwner public payable {

        require(sealedBid[0] != 0, "Please input a hashed version of your bid in whole units of ETH in the following format: [Bid]-[password]");
        require(now <= auctionEndTime, "Sorry, the bidding window has closed for this auction.");
        require(msg.value > 0, "Sorry, you must make a deposit of an amount greater than 0 ETH.");

        //Marks down all deposits from each address
        if (msg.value > 0) {
          deposits[msg.sender] += msg.value;
        }

        //Record every sealed bid made by each bidder
        sealedBidList[sealedBid] = msg.sender;
    }

    //Find character in string
    function getIndex(string memory text, string memory char) public pure returns (uint) {
        bytes memory bytesText = bytes(text);
        bytes memory bytesChar = bytes(char);
        for(uint i = 0; i<=bytesText.length; i++)
        {
            if(bytesText[i] == bytesChar[0])
            {
                return i;
            }
        }
    }

    //Locate hyphen to separate bid amount from password
    function getSubstring(string memory text, uint startIndex, uint endIndex) public pure returns (string memory) {
        bytes memory bytesText = bytes(text);
        bytes memory substring = new bytes(endIndex - startIndex);
        for (uint i = startIndex; i < endIndex; i++)
        {
            substring[i-startIndex] = bytesText[i];
        }
        return string(substring);
    }

    //Convert bid number from string to int
    function parseInt(string memory text) public pure returns (uint number) {
        bool isError = false;

        bytes memory bytesText = bytes(text);
        number = 0;
        uint temp = 0;
        for(uint i = 0; i < bytesText.length; i++)
        {
            temp = uint256(uint8(bytesText[i]));
            if(temp >= 48 && temp <= 57)
            {
                number = number * 10 + (temp - 48);
            }
            else
            {
                isError = true;
            }
        }

        require(isError == false, "An invalid bid value was placed");

        return number;
    }

    function revealBid (string memory bidString, bytes32 sealedBid) revealPeriod public {
        //Reveal bid and password from hash
        require(sealedBid == keccak256(abi.encodePacked(bidString)), 'Bid hash does not match with sealed bid');

        //Separate bid amount from password and convert bid string to int value
        uint endIndex = getIndex(bidString, "-");
        require(endIndex > 0, "Inputted bid was not in the correct format and is therefore rejected");
        string memory strRevealedBid = getSubstring(bidString, 0, endIndex);
        uint revealedBid = parseInt(strRevealedBid) * 1 ether;

        //Error handling
        require(deposits[msg.sender] >= revealedBid, "Sorry your bid has been rejected because it exceeds the total amount of deposits you have made for this bid");
        require(revealedBid > startPrice, "Sorry your bid has been rejected because it is under the starting bid");
        require(sealedBidList[sealedBid] == msg.sender, "Sorry this was not a bid you submitted");

        //Record highest bids as they are revealed
        if (revealedBid > highestBid && revealedBid >= startPrice) {
          highestBidder = msg.sender;
          highestBid = revealedBid;
        }
    }

    //Settle auction and marks as complete - can only be executed by the owner
    function finalizeAuction() isOwner public {

        require(now >= revealEndTime, "Auction has not been completed yet.");
        require(isOpen == true, "The auction has already been marked as completed.");

        //Mark auction as closed, transfers money and announces results
        isOpen = false;
        emit Results(highestBidder, highestBid);

        owner.transfer(highestBid);
    }

    //Allow withdrawal of lost bids after auction is marked finalized
    function withdraw() completedAuction public {

        uint amount = deposits[msg.sender];

        if (amount > 0) {

            //Mark deposit as 0 to prevent double withdrawals
            deposits[msg.sender] = 0;

            //Reduce the amount of withdrawals highest bidder gets by the highest bid amount
            if(msg.sender == highestBidder)
            {
              amount -= highestBid;
            }

        }
        (msg.sender).transfer(amount);
    }

    //Return values of individual auctions to be retrieved
    function showAuctionInfo() public view returns (string memory, uint, string memory, uint, uint, bool, address, address, uint) {
      return (item, startPrice, desc, auctionEndTime, revealEndTime, isOpen, owner, highestBidder, highestBid);
    }

}
