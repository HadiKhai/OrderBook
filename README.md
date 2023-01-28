
- Install dependencies:
```
yarn
```

- Compile all smart contracts in the root folder:

```
yarn compile-all
```

- Start an instance of a local blockchain:
```
yarn launch-devnet
```

- Migrate To Ganache:
```
yarn deploy-devnet-reset
```

- Run tests:
```
yarn test
```
Features Implemented:

- User can open an Order (deposits makeAmount in the contract)
- User can cancel their Order (return user's remaining makeAmount on cancel)
- User can take part or all of an Order (exchange of assets)
- A bid array keeps track of all swaps made by users for each Order
- A Status map keeps track of each Order's current status: 
Status {
  OPENED,
  PARTIALLY_FILLED,
  FULFILLED,
  CANCELED
  }
- Upgradeable contracts
- OrderBookV2: introducing a new function (getOrdersWithBidsByAddress)
- OrderBookV3: fix Status update on cancel
- UpgradeProxy function was used to upgrade v1 -> v2 -> v3
- 21 tests written and passed

Limitations:

- Status should be inside the Order Struct 
- Salt and taker weren't used in the implementation

