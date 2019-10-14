//Todo: Try to test auctionEndTime - few second difference

const AuctionHouse = artifacts.require('./AuctionHouse.sol')
const Auction = artifacts.require('./Auction.sol')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('AuctionHouse', ([creator, bidder1, bidder2, bidder3, nonBidder]) => {
  let auctionHouse, auction

  before(async () => {
    auctionHouse = await AuctionHouse.deployed()
  })

  describe('Test Deployment', async () => {
    //Check deployment of contract and contract address
    it('Contract successfully deployed', async () => {
      const address = await auctionHouse.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)

    })
  })

  describe('Test AuctionHouse & Auction Contract functions', async () => {
    let result, auctionCount, orgWinnerBalance, orgCreatorBalance, orgBidderBalance, orgNonBidderBal

    before(async () => {
      result = await auctionHouse.createAuction('Vintage Clock', 1, 'Vintage clock from England in the 1920s', 10, 20, { from: creator })
    })

      it('Successfully created an auction', async () => {
        //Success: Check that auction fields are correctly captured
        auction = await Auction.at(result.logs[0].args.singleAuction)
        var item = await auction.item()
        var owner = await auction.owner()
        var startPrice = await auction.startPrice()
        startPrice = web3.utils.fromWei(startPrice, 'Ether')
        var desc = await auction.desc()
        var timeLimit = await auction.timeLimit()
        var revealTime = await auction.revealTime()
        assert.equal(item, 'Vintage Clock', 'Name was not set properly')
        assert.equal(owner, creator, 'Auction owner was not set properly')
        assert.equal(startPrice, 1, 'Start price was not set properly')
        assert.equal(desc, 'Vintage clock from England in the 1920s', 'Description was not set properly')
        assert.equal(timeLimit.toNumber(), 10, 'Bidding time limit was not set correctly')
        assert.equal(revealTime.toNumber(), 20, 'Reveal time limit was not set correctly')

        //Failure: Create auctions without a name or with time limit of 0
        await await auctionHouse.createAuction('Vintage Clock', 1, 'Vintage clock from England in the 1920s', 0, 20, { from: creator }).should.be.rejected
        await await auctionHouse.createAuction('Vintage Clock', 1, 'Vintage clock from England in the 1920s', 10, 0, { from: creator }).should.be.rejected
        await await auctionHouse.createAuction('', 1, 'Vintage clock from England in the 1920s', 10, 20, { from: creator }).should.be.rejected

      })

      it('All open auctions can be retrieved', async () => {
        //Create 2 new auctions
        result = await auctionHouse.createAuction('Stamp from 1923 Germany', 3, '', 10000, 10000, { from: creator })
        result = await auctionHouse.createAuction('Baseball Card', 0, 'Limited Edition Baseball Card', 100, 100, { from: creator })

        //Success: Check that the correct number of auctions are returned
        const openAuctions = await auctionHouse.returnAllAuctions()
        assert.equal(openAuctions.length, 3, 'Auctions were not correctly retrieved')
      })

      it('Bidding process works properly', async() => {
        //Set original balances for future tests
        orgCreatorBalance = await web3.eth.getBalance(creator)
        orgCreatorBalance = new web3.utils.BN(orgCreatorBalance)
        //console.log('creator: ' + orgCreatorBalance)
        orgBidderBalance = await web3.eth.getBalance(bidder2)
        orgBidderBalance = new web3.utils.BN(orgBidderBalance)
        //console.log('bidder: ' + orgBidderBalance)
        orgWinnerBalance = await web3.eth.getBalance(bidder3)
        orgWinnerBalance = new web3.utils.BN(orgWinnerBalance)
        //console.log('winner: ' + orgWinnerBalance)
        orgNonBidderBal = await web3.eth.getBalance(nonBidder)
        orgNonBidderBal = new web3.utils.BN(orgNonBidderBal)
        //console.log('non-bidder: ' + orgNonBidderBal)

        //For following test: bidString = "1-password", hashedBid = "0xf81ca4f485f24c62497f446d9a2dbc6593362e378d6fdbc938c4aa3328489728"
        //Failure: Test if creator can make bid
        await await auction.bid('0xf81ca4f485f24c62497f446d9a2dbc6593362e378d6fdbc938c4aa3328489728', { from: creator, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected
        //Failure: Test if empty bid can be made
        await await auction.bid('0xf81ca4f485f24c62497f446d9a2dbc6593362e378d6fdbc938c4aa3328489728', { from: bidder1, value: web3.utils.toWei('0', 'Ether')}).should.be.rejected

        //For following test:
        //Bidder1: bidString = "2-password", hashedBid = "0x74b0d2114987428af5c15d90d87404d3859f8adef1c69b36ac1d532b5619bf8a"
        //Bidder2: bidString = "5password", hashedBid = "0x415ad4f385ba83a08f10b704f00b7b2d21e26b5e702f375a7b52618b37f3e865"
        //Bidder2: bidString = "1-password", hashedBid = "0xf81ca4f485f24c62497f446d9a2dbc6593362e378d6fdbc938c4aa3328489728"
        //Bidder2: bidString = "3-password", hashedBid = "0xe4aaa3d770a4997641294b6d32a746e12ede1c2fbb45cf3cb79e875edbf84ec6"
        //Bidder3: bidString = "4-password", hashedBid = "0xe0bd69cc34531084a568bbccb78207c1bbf975f067e249fc4a0ed1c6c53be6d3"

        //Create sealed bids for 3 bidders
        await await auction.bid('0x74b0d2114987428af5c15d90d87404d3859f8adef1c69b36ac1d532b5619bf8a', { from: bidder1, value: web3.utils.toWei('1', 'Ether')})
        await await auction.bid('0x415ad4f385ba83a08f10b704f00b7b2d21e26b5e702f375a7b52618b37f3e865', { from: bidder2, value: web3.utils.toWei('1', 'Ether')})
        await await auction.bid('0xf81ca4f485f24c62497f446d9a2dbc6593362e378d6fdbc938c4aa3328489728', { from: bidder2, value: web3.utils.toWei('2', 'Ether')})
        await await auction.bid('0xe4aaa3d770a4997641294b6d32a746e12ede1c2fbb45cf3cb79e875edbf84ec6', { from: bidder2, value: web3.utils.toWei('3', 'Ether')})
        await await auction.bid('0xe0bd69cc34531084a568bbccb78207c1bbf975f067e249fc4a0ed1c6c53be6d3', { from: bidder3, value: web3.utils.toWei('5', 'Ether')})

      })

      it('Reveal function is handled properly', async () => {
        //Failure: Test if bids can be revealed before reveal bid period
        await await auction.revealBid('3-password','0xe4aaa3d770a4997641294b6d32a746e12ede1c2fbb45cf3cb79e875edbf84ec6', { from: bidder2 }).should.be.rejected

        //Fast forward 10 seconds into the future to end of bidding period
        advanceTime = (time) => {
          return new Promise((resolve, reject) => {
            web3.currentProvider.send({
              jsonrpc: '2.0',
              method: 'evm_increaseTime',
              params: [time],
              id: new Date().getTime()
            }, (err, result) => {
              if (err) { return reject(err) }
              return resolve(result)
            })
          })
        }
        await advanceTime(10)

        //Failure: Test if wrong bid string or wrong hash inputted is rejected
        await await auction.revealBid('not-password','0x74b0d2114987428af5c15d90d87404d3859f8adef1c69b36ac1d532b5619bf8a', { from: bidder1 }).should.be.rejected
        await await auction.revealBid('2-password','0x84b0d2114987428af5c15d90d87404d3859f8adef1c69b36ac1d532b5619bf8a', { from: bidder1 }).should.be.rejected
        await await auction.revealBid('5password','0x415ad4f385ba83a08f10b704f00b7b2d21e26b5e702f375a7b52618b37f3e865', { from: bidder2 }).should.be.rejected

        //Failure: Test if nonexistent bid/hash combo or combo that was not originally inputted by that specific bidder is rejected
        await await auction.revealBid('5-password','0x95a0347799e41d4f376dc3aa4956806e107fdf646e732a5fe29fc42ad61853a3', { from: bidder2 }).should.be.rejected
        await await auction.revealBid('2-password','0x84b0d2114987428af5c15d90d87404d3859f8adef1c69b36ac1d532b5619bf8a', { from: bidder2 }).should.be.rejected

        //Failure: Test if a bid greater than total deposits made is rejected
        await await auction.revealBid('2-password','0x74b0d2114987428af5c15d90d87404d3859f8adef1c69b36ac1d532b5619bf8a', { from: bidder1 }).should.be.rejected

        //Failure: Test if a bid less than or equal to the startPrice is rejected
        await await auction.revealBid('1-password','0xf81ca4f485f24c62497f446d9a2dbc6593362e378d6fdbc938c4aa3328489728', { from: bidder2 }).should.be.rejected
        await await auction.revealBid('3-password','0xe4aaa3d770a4997641294b6d32a746e12ede1c2fbb45cf3cb79e875edbf84ec6', { from: bidder2 })
        await await auction.revealBid('4-password','0xe0bd69cc34531084a568bbccb78207c1bbf975f067e249fc4a0ed1c6c53be6d3', { from: bidder3 })

        var highestBidder = await auction.highestBidder()
        var highestBid = await auction.highestBid()
        highestBid = web3.utils.fromWei(highestBid, 'Ether')
        assert.equal(highestBidder, bidder3, 'The highest bidder was incorrectly recorded.')
        assert.equal(highestBid, 4, 'The highest bid amount was incorrectly recorded.')

      })

      it('Closing of auctions are handled properly', async () => {
        let finalCreatorBalance, finalWinnerBalance, finalBidderBalance

        //Pre-check: Test isOpen flag to ensure it is true before auction is finalized
        var isOpen = await auction.isOpen()
        assert.equal(isOpen, true, 'Auction Open flag is supposed to be true before auction is closed.')

        //Failure: Test if the creator can close the auction before the auction has ended.
        result = await auction.finalizeAuction({ from: creator }).should.be.rejected

        //Failure: Check if bidders can withdraw before the end of the auction
        await await auction.withdraw({ from: bidder1 }).should.be.rejected

        //Fast forward 20 seconds into the future to end of reveal period
        advanceTime = (time) => {
          return new Promise((resolve, reject) => {
            web3.currentProvider.send({
              jsonrpc: '2.0',
              method: 'evm_increaseTime',
              params: [time],
              id: new Date().getTime()
            }, (err, result) => {
              if (err) { return reject(err) }
              return resolve(result)
            })
          })
        }
        await advanceTime(20)

        //Failure: If anyone aside from the creator of the auction tries to finalize the auction, it will be rejected
        await await auction.finalizeAuction({ from: bidder1 }).should.be.rejected

        //Success: When the creator of the auction finalizes the auction, the function will initiate
        result = await auction.finalizeAuction({ from: creator })

        //Retest isOpen flag after auction is finalized
        isOpen = await auction.isOpen()
        assert.equal(isOpen, false, 'Bid Open flag was not changed')

        //Failure: Check that bidding can't occur after the auction is over
        await await auction.bid('f25f9568121ea5f66f4b40108a1506bc2def02b54c7c888ec922c5be8e6a6681', { from: bidder1, value: web3.utils.toWei('6', 'Ether')}).should.be.rejected

        //Failure: Test if non-bidder can withdraw
        await await auction.withdraw({ from: nonBidder })

        //Success: Test that losing bidders can withdraw funds
        await await auction.withdraw({ from: bidder1 })
        await await auction.withdraw({ from: bidder2 })

        //Success: Test that winner can withdraw correct amount of funds
        await await auction.withdraw({ from: bidder3 })

        //Success: Check that amount was transferred to the creator/owner of the auction
        finalCreatorBalance = await web3.eth.getBalance(creator)
        finalCreatorBalance = new web3.utils.BN(finalCreatorBalance)
        //console.log("creator: " + finalCreatorBalance)
        finalBidderBalance = await web3.eth.getBalance(bidder2)
        finalBidderBalance = new web3.utils.BN(finalBidderBalance)
        //console.log("bidder: " + finalBidderBalance)
        finalWinnerBalance = await web3.eth.getBalance(bidder3)
        finalWinnerBalance = new web3.utils.BN(finalWinnerBalance)
        //console.log("winner: " + finalWinnerBalance)
        finalNonBidderBal = await web3.eth.getBalance(nonBidder)
        finalNonBidderBal = new web3.utils.BN(finalNonBidderBal)
        //console.log('non-bidder: ' + finalNonBidderBal)

        //Calculate final balances after all bids and refunds are processed
        var winnerPaid = Math.round((orgWinnerBalance - finalWinnerBalance) * 1e-18)
        assert.equal(winnerPaid, 4, 'Balance of winner was calculated incorrectly.')
        var creatorReceived = Math.round((finalCreatorBalance - orgCreatorBalance) * 1e-18)
        assert.equal(creatorReceived, 4, 'Balance of creator was calculated incorrectly.')
        var changeBidderBal = Math.round((finalBidderBalance - orgBidderBalance) * 1e-18)
        assert.equal(changeBidderBal, 0, 'Balance of losing bidder was calculated incorrectly.')
        var changeNonBidderBal = Math.round((finalNonBidderBal - orgNonBidderBal) * 1e-18)
        assert.equal(changeNonBidderBal, 0, 'Balance of non-bidder was calculated incorrectly.')

        //Failure: Test multiple withdrawals
        await await auction.withdraw({ from: bidder2 })

        finalBidderBalance = await web3.eth.getBalance(bidder2)
        finalBidderBalance = new web3.utils.BN(finalBidderBalance)
        //console.log("bidder: " + finalBidderBalance)

        changeBidderBal = Math.round((finalBidderBalance - orgBidderBalance) * 1e-18)
        assert.equal(changeBidderBal, 0, 'Multiple withdrawals were not handled correctly.')

      })

  })

})
