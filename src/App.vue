<template>
  <div class="container">
    <div class = "entryBox">
      <div class="b-row">
        <div>
          <strong>
            Auction House DApp
          </strong>
          <br /><br />
          <!--Inputs for new auction creation-->
          <div>
            <label for="item">
              Auction Item<font style="color:red">*</font>
            </label>
            <b-form-input id="item" v-model="item" type="text" placeholder="Name of item up for auction" />
          </div><br />
          <div>
            <label for="startPrice">
              Starting Bid
            </label>
            <b-form-input id="startPrice" v-model="startPrice" type="text" placeholder="Starting bid price in whole units of ETH" />
          </div><br />
          <div>
            <label for="desc">
              Description of auction item
            </label>
            <b-form-input id="desc" v-model="desc" type="text" placeholder="Description of item up for auction" />
          </div><br />
          <div>
            <label for="timeLimit">
              Bidding Time Limit<font style="color:red">*</font>
            </label>
            <b-form-input id="timeLimit" v-model="timeLimit" type="text" placeholder="Time allowance for bidding in seconds" />
          </div><br />
          <div>
            <label for="revealTime">
              Bid Reveal Time Limit<font style="color:red">*</font>
            </label>
            <b-form-input id="revealTime" v-model="revealTime" type="text" placeholder="Time allowance for revealing sealed bids in seconds" />
          </div>
        </div>
      </div>
      <br />
      <div class="b-row">
        <div style="padding-bottom:0.5em">
          <b-button :variant="'primary'" @click="createAuction">
            Create Auction
          </b-button> &nbsp
          <img v-show="isLoading" src="https://media.giphy.com/media/2A6xoqXc9qML9gzBUE/giphy.gif">
        </div>
        <font style="color:red">*Required</font>
      </div>
    </div>
    <br />
    <div>
      <strong style="text-decoration:underline">
        Auction Explorer
      </strong>
      <br />
      <!--Allow the user to input an auction count to find the latest open auctions and review past auctions-->
      <div id="auctionCatalog" class="entryBox">
        <font>
          Total Number of Available Auctions: {{ (totalAuctions) > 0 ? totalAuctions : 0 }} (Note: Auction numbers are in ascending order from oldest to newest)
        </font>
        <br /><br />
        <b-input-group>
          <b-form-input id="searchAuctionNum" v-model="searchAuctionNum" type="text" placeholder="Please enter the auction number you would like to view" />
          <b-input-group-append>
            <button @click="findAuction()">Show Auction</button>
          </b-input-group-append>
        </b-input-group>
      </div>

      <div class="entryBox">
          <!--Use contract address and bit item name as unique identifiers for auction page-->
          <strong>
            Auction Address: {{ auctionAddress }} <br /><br />
            Bid Item: {{ auctionEntry[0] }} <br />
            Starting Bid: {{ auctionEntry[1] * 1e-18 }} ETH <br />
            Description: {{ auctionEntry[2] }} <br />
          </strong>

          <!--Create a countdown for the auction in seconds and allow user to retrieve it with a button -->
          <p class="card-text, mt-3">
            Bidding Time Left: {{ ((auctionEntry[3] - Math.round((new Date()).getTime() / 1000) > 0) ? (auctionEntry[3] - Math.round((new Date()).getTime() / 1000)) : 0) }} seconds remaining
          </p>
          <p class="card-text, mt-3" style="margin-bottom:0.5em">
            Bid Reveal Time Left: {{ ((auctionEntry[4] - Math.round((new Date()).getTime() / 1000) > 0) ? (auctionEntry[4] - (Math.round((new Date()).getTime() / 1000) < auctionEntry[3] ? auctionEntry[3] : Math.round((new Date()).getTime() / 1000))) : 0) }} seconds remaining
          </p>
          <b-button class="mt-2" :variant="'success'" @click="refresh()">
            Update countdown
          </b-button>

          <br /><br />
          <div>
            <strong style="text-decoration:underline">Place Bids</strong>
            <p style="margin-bottom:0.5em">
              Please submit a hashed version of your bid using the following tool: <a href="https://emn178.github.io/online-tools/keccak_256.html" target="_blank">Encryption tool</a>. <br />
              In the input tab, please input your bid in the following format: [Bid amount in ETH]-[password] (ie. 2-password) and copy output hashed value into the "hashed bid" field below. Be sure to remember both the input and output values, and submit a deposit value that is larger than your bid value.
            </p>
            <form @submit.prevent="submitBid()">
              <b-input-group>
                <b-form-input v-model="createdHashedBid" placeholder="Enter hashed bid (0x...)" />
                <b-form-input v-model="deposit" placeholder="Enter deposit in ETH" />
                <b-button @click="submitBid()">Place Bid</b-button>
                <img v-show="isBidding" id="isBidding" src="https://media.giphy.com/media/2A6xoqXc9qML9gzBUE/giphy.gif">
              </b-input-group>
            </form>
          </div>
          <br />
          <div>
            <strong style="text-decoration:underline">Reveal Bids</strong>
            <p style="margin-bottom:0.5em">
              Please input the bid string and the hashed bid (with prefix 0x) you generated from the <a href="https://emn178.github.io/online-tools/keccak_256.html" target="_blank">Encryption tool</a> to reveal your bid. <br />
            </p>
            <form @submit.prevent="revealBid()">
              <b-input-group>
                <b-form-input v-model="bidString" placeholder="Enter bid string ([bid amount in ETH]-[password])" />
                <b-form-input v-model="hashedBid" placeholder="Enter hashed bid (0x...)" />
                <b-button :variant="'info'" @click="revealBid()">Reveal Bid</b-button>
                <img v-show="isRevealing" id="isRevealing" src="https://media.giphy.com/media/2A6xoqXc9qML9gzBUE/giphy.gif">
              </b-input-group>
            </form>
          </div>
          <br />
          <div class="row align-center" style="margin-left:auto;margin-right:auto">
            <b-button class="mt-2" :variant="'danger'" @click="withdraw()">
              Withdraw losing bids
            </b-button>&nbsp
            <!--Disable "Close Auction" button when auction is closed-->
            <b-button class="mt-2" :variant="'danger'" :disabled="!auctionEntry[5]" @click="finalize()">
              {{ (!auctionEntry[5]) ? 'Auction Ended' : finalizeStatus }}
            </b-button>
          </div>
          <br />
          <div>
            Owner: {{ auctionEntry[6] }} <br />
            <!--Ensure that results are only broadcasted when the auction is closed-->
            Winner: {{ (auctionEntry[5]) ? 'None' : auctionEntry[7] }} <br />
            Winning Bid: {{ (auctionEntry[5]) ? 0 : (auctionEntry[8] * 1e-18) > 0 ? (auctionEntry[8] * 1e-18) : 0 }} ETH
          </div>
        </div>
      </div>
      <br /><br />
  </div>
</template>

<script>
import web3 from '../contracts/web3';
import auction from '../contracts/auctionInstance';
import auctionHouse from '../contracts/auctionHouseInstance';

export default {
  name: 'APP',
  data() {
    return {
      sealedBid: '',
      item: '',
      startPrice: 0,
      desc: '',
      timeLimit: '',
      timeLeft: '',
      revealTime: '',
      revealTimeLeft: '',
      totalAuctions: 0,
      auctionEntry: [],
      isLoading: false,
      isBidding: false,
      isRevealing: false,
      deposit: '',
      createdHashedBid: '',
      hashedBid: '',
      bidString: '',
      auctionAddress: '',
      highestBidder: 'None',
      highestBid: 'None',
      finalizeStatus: 'Close Auction',
      searchAuctionNum: 1,
    };
  },
  beforeMount() {
    // get latest auction
    var index = 0;
      auctionHouse.methods
        .returnAllAuctions()
        .call()
        .then((auctions) => {
          console.log(auctions);
          // set the number of auctions
          this.totalAuctions = auctions.length;
          index = auctions.length-1;
            console.log(index);
            console.log(auctions[index]);
            // get the contract address of the previous auction
            this.auctionAddress = auctions[index];
            // set the address as the parameter
            var thisAuctionInstance = auction(auctions[index]);
            return thisAuctionInstance.methods.showAuctionInfo().call();
            console.log(instance);
            //index = index - 1;
        }).then((lists) => {
              console.log(lists);
              const auctionlists = lists;
              this.auctionEntry = auctionlists;
            })
            .catch((err) => {
              console.log(err);
            }).catch((err) => {
          console.log(err);
        });
  },
  methods: {
    createAuction() {
      //Initiate auction creation by fetching account address
      web3.eth.getAccounts().then((accounts) => {
        this.isLoading = true;
        return auctionHouse.methods.createAuction(this.item, this.startPrice, this.desc, this.timeLimit, this.revealTime)
          .send({ from: accounts[0] });
        console.log('success');
      }).then(() => {
        // initialize form fields
        this.isLoading = false;
        this.item = '';
        this.startPrice = '';
        this.desc = '';
        this.timeLimit = '';
        this.revealTime = '';
        return auctionHouse.methods.returnAllAuctions().call();
        //Get the info from the newly created auction
      }).then((auctions) => {
        const index = auctions.length - 1;
        //console.log(auctions[index]);
        this.auctionAddress = auctions[index];
        const auctionInstance = auction(auctions[index]);
        return auctionInstance.methods.showAuctionInfo().call();
      })
        //Output the newly created auction
        .then((lists) => {
          console.log(lists);
          const auctionlists = lists;
          this.auctionEntry = auctionlists;
          this.totalAuctions += 1;
        })
        .catch((err) => {
          console.log(err);
        });
    },
    submitBid() {
      // convert 'ether' to 'wei'
      const depositWei = web3.utils.toWei(this.deposit, 'ether');
      // get the current user web3 wallet adddress
      const fromAddress = web3.eth.accounts.givenProvider.selectedAddress;
      // set the auction address as the parameter
      const selectedAuction = auction(this.auctionAddress);
      this.isBidding = true;
      // execute bid
      selectedAuction.methods
        .bid(this.createdHashedBid)
        .send({
          from: fromAddress,
          value: depositWei,
        })
        //Reset parameters after bid has been submitted
        .then(() => {
          this.isBidding = false;
          this.deposit = '';
          this.createdHashedBid = '';
        });
    },
    revealBid() {
      //Get current auction address, execute finalization process and set status to finalized
      // get the current user web3 wallet adddress
      const fromAddress = web3.eth.accounts.givenProvider.selectedAddress;
      // set the auction address as the parameter
      const selectedAuction = auction(this.auctionAddress);
      this.isRevealing = true;
      selectedAuction.methods
        .revealBid(this.bidString, this.hashedBid)
        .send({ from: fromAddress })
        //Reset parameters after bid has been submitted
        .then(() => {
          this.isRevealing = false;
          this.bidString = '';
          this.hashedBid = '';
        });
    },
    finalize() {
      //Get current auction address, execute finalization process and set status to finalized
      web3.eth.getAccounts().then((accounts) => {
        const selectedAuction = auction(this.auctionAddress);
        selectedAuction.methods
          .finalizeAuction()
          .send({ from: accounts[0] })
          .then(() => {
            auctionEntry[5] = false;
            this.finalizeStatus = 'Auction Ended';
          });
      });
    },
    withdraw() {
      //Open withdrawals to lost bidders after auction has been marked as ended
      web3.eth.getAccounts().then((accounts) => {
        const selectedAuction = auction(this.auctionAddress);
        selectedAuction.methods
          .withdraw()
          .send({ from: accounts[0] });
      });
    },
    refresh() {
      //Update time left countdown
      this.$forceUpdate();
    },
    findAuction() {
      //Find auction based on user-inputted auction count
      var index = 1;
        auctionHouse.methods
          .returnAllAuctions()
          .call()
          .then((auctions) => {
            console.log(auctions);
            this.totalAuctions = auctions.length;
            //Convert user inputted auction count to 0 based value to retrieve correct auction
            index = this.searchAuctionNum-1;
              console.log(index);
              console.log(auctions[index]);
              this.auctionAddress = auctions[index];
              var thisAuctionInstance = auction(auctions[index]);
              return thisAuctionInstance.methods.showAuctionInfo().call();
              console.log(instance);
          }).then((lists) => {
                console.log(lists);
                const auctionlists = lists;
                this.auctionEntry = auctionlists;
              })
              .catch((err) => {
                console.log(err);
              }).catch((err) => {
            console.log(err);
          });
    },
  },
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

h1,
h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}

button {
  background-color: #fab915;
  color: white;
}


img {
  width: 32px;
}

#isBidding {
  height: 32px;
  margin-top: 16px;
  margin-left: 8px;
}

#isRevealing {
  height: 32px;
  margin-top: 16px;
  margin-left: 8px;
}

.entryBox {
  border: solid 2px #ffdfbf;
  padding:1em;
  margin-top:1em;
  border-radius: 5px;
  background-color: #ffdf;
}

#auctionCatalog.entryBox {
  border: solid 2px #d3d3d3;
  background-color: #eaeaea;
}
</style>
