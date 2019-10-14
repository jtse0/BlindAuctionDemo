# Auction House Dapp
  
## AuctionHouse.sol
This is the smart contract that governs the auction house and the individual auction functions.

## Auction.test.js
This contains the unit tests for the smart contract to ensure all requirements were met and functions were operating as expected.
The test are broken up into 6 parts:
1. Test Deployment
2. Test creation of an auction
3. Test that auction details can be retrieved
4. Test the bidding process
5. Test the bid reveal process and
6. Test the auction close process and subsequent withdrawals

All tests also include error handling to ensure the entire process runs smoothly.  Tests use mocha and chai, and ganache as the testnet to run transactions.

Unit tests can be run in the console using command: "truffle test"

## App.vue
The UI was made using a template using Vue JS to present a user-friendly interface for users to create auctions, view auction details, and make their bids.  Metamask and the Ropsten testnet were used in this section to simulate how users would interact with the user interface to execute the contract functions.  The contract is deployed to the Ropsten testnet.

The app can be run in the console using the command: "npm run serve"
and then navigating to the localhost dev environment, usually "localhost:8080."

The top section of the layout allows the user to create new bids.  Required fields include the auction item name, the time that bidding will be open to the public, and the time allowed for bidders to reveal their bids after the bidding has been completed.

The yellow box at the bottom allows the user to interact with the auction.  Users will be able to get a live countdown of both the bidding period as well as the bid reveal periods with the refresh countdown button to help them keep track of time.  Bidders can place bids by inputting their hashed bids (created from the encryption tool) as well as their deposit amounts under the "Place bids" section.  During the Bid Reveal round, bidders can input the bid string they used to generate their hashed bid as well as the generated hashed bid to reveal their bids.  Once the time is up, the owner will be able to close and finalize the auction with the click of a button and the winner and winning bid will be displayed.  All losing bidders can claim their funds back by clicking the "Withdraw losing bids" button.

The grey box in the middle allows users to browse through all current and past auctions by searching the auction index number.  The text above displays how many auctions have been created so far and the auctions are all numbered in chronological order.

## Future
This dapp is a simple implementation of an auction and I have tried my best to design it in a way that would be easy to use and test in a limited amount of time.  Some improvements that can be made in the future are to convert the time limit to other units of time such as minutes or days to allow for a more realistic experience and flexibility.  Seconds were chosen as the unit of time to allow for quick and easy testing of operations.

For the explorer catalog, perhaps the contract address should be used as a way to search for contracts as well especially when there are more auctions created.  In the meantime, the count was used to allow for users to find out how many contracts were deployed and easily access the latest ones using this count.
